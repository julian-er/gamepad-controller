import { integrationExamples, sharedExamples } from '../examples';
import type { Section } from '../content/types';

const slug = (text: string) =>
    text
        .toLowerCase()
        .replace(/[`*]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
export function parseReference(markdown: string): Section[] {
    const lines = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\r?\n/);
    const sections: Section[] = [];
    let sequence = 0;
    const unique = new Set<string>();
    const add = (section: Omit<Section, 'id'>, id = 'block-' + sequence++) => {
        let key = id;
        while (unique.has(key)) key = id + '-' + sequence++;
        unique.add(key);
        sections.push({ ...section, id: key });
    };
    for (let i = 0; i < lines.length; ) {
        const line = lines[i]!;
        if (!line.trim()) {
            i++;
            continue;
        }
        if (/^```/.test(line)) {
            const language = line.slice(3).trim() || 'Text';
            const code: string[] = [];
            while (++i < lines.length && !/^```/.test(lines[i]!)) code.push(lines[i]!);
            const text = code.join('\n');
            if (/^(ts|tsx|js|javascript|typescript)$/.test(language)) {
                const examples = text.includes("from '@angular/core'")
                    ? {
                          ...integrationExamples,
                          angular: {
                              code: text,
                              filename: 'source.component.ts',
                              note: 'Angular example from the local source guide. Mount the component after installing the package.',
                          },
                      }
                    : text.includes("from 'react'")
                      ? {
                            ...integrationExamples,
                            react: {
                                code: text,
                                filename: 'Source.tsx',
                                note: 'React example from the local source guide. Use a unique container for each mounted instance.',
                            },
                        }
                      : sharedExamples(text);
                add({ title: '', examples });
            } else add({ title: '', code: text, language });
            i++;
            continue;
        }
        const heading = /^(#{1,6})\s+(.+)$/.exec(line);
        if (heading) {
            add({ title: heading[2]! }, slug(heading[2]!));
            i++;
            continue;
        }
        if (line.startsWith('|') && /^\|[\s:|\-]+\|$/.test(lines[i + 1] ?? '')) {
            const cells = (row: string) =>
                row
                    .trim()
                    .replace(/^\||\|$/g, '')
                    .split(/(?<!\\)\|/)
                    .map((x) => x.trim().replace(/\\\|/g, '|'));
            const headers = cells(line);
            const rows: string[][] = [];
            i += 2;
            while (i < lines.length && lines[i]!.startsWith('|')) rows.push(cells(lines[i++]!));
            add({ title: '', headers, rows });
            continue;
        }
        const body: string[] = [];
        while (i < lines.length && lines[i]!.trim() && !/^(#|```|\|)/.test(lines[i]!)) body.push(lines[i++]!);
        if (!body.length) body.push(lines[i++]!);
        add({ title: '', body: [body.join('\n')] });
    }
    return sections;
}
