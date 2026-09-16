import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { expect, it } from 'vitest';
import ts from 'typescript';
import { docs } from '../src/content';
import { parseReference, referenceSources } from '../src/reference';

const root = resolve(process.cwd(), '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n');
const ast = (path: string) => ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
function interfaceKeys(path: string, name: string): string[] {
    const declaration = ast(path).statements.find((node) => ts.isInterfaceDeclaration(node) && node.name.text === name);
    if (!declaration || !ts.isInterfaceDeclaration(declaration)) throw new Error('Missing source interface ' + name);
    return declaration.members
        .map((member) => member.name?.getText().replace(/['"]/g, ''))
        .filter((name): name is string => !!name);
}
function exportNames(): string[] {
    return ast('src/index.ts').statements.flatMap((node) =>
        ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)
            ? node.exportClause.elements.map((entry) => entry.name.text)
            : []
    );
}
function missingNames(names: string[], markdown: string): string[] {
    return names.filter((name) => !new RegExp('\\b' + name + '\\b').test(markdown));
}
function markdownFiles(directory: string): string[] {
    return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
        const path = directory + '/' + entry.name;
        return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
    });
}

it('documents each source option in its actual group with type, default and purpose', () => {
    const path = 'src/interfaces/GamepadServiceOptions.ts';
    const markdown = read('docs/CONFIGURATION.md');
    const sections = parseReference(markdown);
    const rows = sections.flatMap((section) => section.rows ?? []);
    for (const key of interfaceKeys(path, 'GamepadServiceOptions')) {
        const row = rows.find((cells) => cells[0] === '`' + key + '`');
        expect(row, 'Missing configuration row: ' + key).toBeDefined();
        expect(
            row?.slice(1).every((cell) => cell.length > 0),
            key + ' needs type/default/purpose'
        ).toBe(true);
        expect(row?.[3]?.length, key + ' needs a meaningful description').toBeGreaterThan(20);
    }
    const source = ast(path);
    const config = source.statements.find(
        (node) => ts.isInterfaceDeclaration(node) && node.name.text === 'GamepadServiceConfig'
    );
    if (!config || !ts.isInterfaceDeclaration(config)) throw new Error('Missing config');
    for (const member of config.members) {
        if (!ts.isPropertySignature(member) || !member.type) continue;
        const key = member.name.getText();
        expect(markdown).toContain(key);
        if (key === 'platform') continue;
        const type = member.type.getText();
        const heading = '## ' + key + '\n';
        const body = markdown.split(heading)[1]?.split('\n## ')[0] ?? '';
        expect(body, 'Missing group ' + key).toContain(type);
        expect(missingNames(interfaceKeys(path, type), body), 'Wrong/missing group keys: ' + key).toEqual([]);
    }
    expect(docs.find((doc) => doc.id === 'configuration')?.sections).toEqual(sections);
});

it('covers every exported entry-point symbol and service event from source', () => {
    const reference = read('docs/PUBLIC_API.md');
    expect(missingNames(exportNames(), reference + read('docs/CONFIGURATION.md'))).toEqual([]);
    const eventRows = parseReference(reference).flatMap((section) => section.rows ?? []);
    for (const event of interfaceKeys('src/service/GamepadService.ts', 'GamepadServiceEventMap')) {
        const row = eventRows.find((cells) => cells[0] === '`' + event + '`');
        expect(row?.[1], 'Missing callback for event ' + event).toContain('=> void');
        expect(row?.[2]?.length, 'Missing purpose for event ' + event).toBeGreaterThan(10);
    }
});

it('detects deliberately omitted config and export documentation', () => {
    const markdown = read('docs/CONFIGURATION.md');
    const key = 'shoulderCooldown';
    const omitted = markdown.replace(new RegExp('^\\| `' + key + '`.*\\n', 'm'), '');
    expect(missingNames([key], omitted)).toEqual([key]);
    expect(
        missingNames(
            exportNames(),
            read('docs/PUBLIC_API.md').replaceAll('WindowEventListener', 'RemovedListener') + markdown
        )
    ).toContain('WindowEventListener');
});

it('registers every canonical guide and skill with stable unique routes and valid local links', () => {
    const files = [...markdownFiles('docs'), ...markdownFiles('skills')];
    expect(new Set(docs.map((doc) => doc.id)).size).toBe(docs.length);
    expect(new Set(referenceSources.map(([source]) => source)).size).toBe(referenceSources.length);
    for (const file of files)
        expect(
            referenceSources.some(([source]) => source === file),
            file + ' missing from site'
        ).toBe(true);
    for (const id of [
        'package-guide',
        'source-vanilla',
        'source-react',
        'source-angular',
        'source-api',
        'configuration',
    ]) {
        expect(
            docs.some((doc) => doc.id === id),
            'Broken existing route ' + id
        ).toBe(true);
    }
    for (const file of ['README.md', ...files]) {
        for (const [, href] of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
            if (/^[a-z]+:/i.test(href!)) continue;
            const [path, anchor] = href!.split('#');
            const target = resolve(root, dirname(file), path || '.');
            const actual = path ? target : resolve(root, file);
            expect(existsSync(actual), file + ' -> ' + href).toBe(true);
            if (anchor) {
                const markdown = readFileSync(actual, 'utf8');
                expect(
                    parseReference(markdown).some((section) => section.id === anchor),
                    file + ' -> ' + href
                ).toBe(true);
            }
            if (path?.endsWith('.md') && file !== 'README.md') {
                expect(
                    referenceSources.some(([source]) => source === relative(root, actual).replaceAll('\\', '/')),
                    'No local site route for ' + href
                ).toBe(true);
            }
        }
    }
});

it('keeps canonical documentation and portable skill directories in the package allowlist', () => {
    const manifest = JSON.parse(read('package.json')) as { files: string[] };
    expect(manifest.files).toEqual(expect.arrayContaining(['docs', 'skills', 'README.md', 'dist']));
    expect(manifest.files.filter((path) => path.endsWith('.md'))).toEqual(['README.md']);
    expect(read('.gitignore').split(/\r?\n/)).not.toContain('/docs/');
    for (const [source] of referenceSources) expect(existsSync(resolve(root, source))).toBe(true);
});
