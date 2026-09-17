import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ts from 'typescript';
import { FrameworkCode } from '../src/components';
import { integrationExamples, sharedExamples } from '../src/examples';
import { referenceDocs, referenceLink, referenceSources, parseReference } from '../src/reference';
import { docs } from '../src/content';
import { Controller } from '../src/Controller';
import { ArcadeArtwork, PlayStationArtwork, XboxArtwork } from '../src/ControllerArtwork';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as gamepad from '../../src/index';

let root: Root;
beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="test-root"></div>';
    root = createRoot(document.getElementById('test-root')!);
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
});

it('switches frameworks with the keyboard and copies only the selected code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    act(() => root.render(<FrameworkCode examples={integrationExamples} />));
    const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    act(() => tabs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })));
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]!.getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[role="tabpanel"]')!.textContent).toContain('ngAfterViewInit');
    await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
    expect(writeText).toHaveBeenLastCalledWith(integrationExamples.angular.code);
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Copied!');
    act(() => tabs[1]!.click());
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Copy');
    expect(document.querySelector('[role="tabpanel"]')!.textContent).toContain('useEffect');
});

it('retains selectable code when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    act(() => root.render(<FrameworkCode examples={integrationExamples} />));
    await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Select code to copy');
    expect(document.querySelector('pre')!.textContent).toContain('mountCatalog');
});

it('publishes every selected guide and resolves skill references and source anchors locally', () => {
    expect(referenceDocs).toHaveLength(referenceSources.length);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
    for (const doc of referenceDocs) {
        expect(doc.sections.length, doc.id).toBeGreaterThan(0);
        expect(new Set(doc.sections.map((s) => s.id)).size).toBe(doc.sections.length);
    }
    expect(referenceLink('references/integration.md', 'skills/gamepad-integrate/SKILL.md')).toBe(
        '#/docs/integration-recipes'
    );
    expect(referenceLink('API.md#events')).toBe('#/docs/source-api#events');
    expect(referenceLink('javascript:alert(1)')).toBe('#/docs/introduction');
    const parsed = parseReference(
        '# Reference\n\n| Method | Behavior |\n|---|---|\n| init() | Start |\n\n```ts\nservice.init();\n```'
    );
    expect(parsed.some((s) => s.rows?.[0]?.[0] === 'init()')).toBe(true);
    expect(parsed.some((s) => s.examples?.angular.code === 'service.init();')).toBe(true);
});

it('keeps generated framework examples syntactically valid and uses the public package entry', () => {
    const examples = [
        integrationExamples,
        sharedExamples('service.refresh();'),
        ...docs.flatMap((d) => d.sections.flatMap((s) => (s.examples ? [s.examples] : []))),
    ];
    for (const set of examples)
        for (const [framework, example] of Object.entries(set)) {
            // Some reference snippets intentionally describe schemas or partial expressions.
            if (!example.code.includes("from '")) continue;
            const output = ts.transpileModule(example.code, {
                fileName: framework === 'react' ? 'sample.tsx' : 'sample.ts',
                compilerOptions: {
                    jsx: ts.JsxEmit.ReactJSX,
                    experimentalDecorators: true,
                    target: ts.ScriptTarget.ES2022,
                },
                reportDiagnostics: true,
            });
            expect(
                output.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error),
                example.code
            ).toEqual([]);
            expect(example.code).not.toContain('gamepad-controller/react');
            expect(example.code).not.toContain('[gamepadScope]');
        }
});

it('keeps recovery and teardown fragments intact instead of inventing a new service lifecycle', () => {
    for (const code of ['service.resetInput();', 'service.destroy();', 'service.clearActiveScope();']) {
        for (const example of Object.values(sharedExamples(code))) expect(example.code).toBe(code);
    }
    expect(docs.some((doc) => /migration/i.test(doc.id + doc.title))).toBe(false);
    expect(referenceSources.some(([source]) => /MIGRATION/.test(source))).toBe(false);
    expect(
        docs.find((doc) => doc.id === 'release-notes')?.sections.some((section) => /^1\.0\.0 — \d{4}-\d{2}-\d{2}$/.test(section.title))
    ).toBe(true);
});

it('updates controller controls and axes, preserving unique SVG references across instances', () => {
    act(() =>
        root.render(
            <>
                <Controller variant="xbox" pressed={[0, 15]} axes={[1, -1, 0.5, 0]} />
                <Controller variant="xbox" pressed={[]} axes={[]} />
            </>
        )
    );
    const controllers = document.querySelectorAll('.controller');
    expect(controllers[0]!.querySelector('[data-button="0"]')!.classList.contains('is-pressed')).toBe(true);
    expect(controllers[1]!.querySelector('[data-button="0"]')!.classList.contains('is-pressed')).toBe(false);
    expect(controllers[0]!.querySelector('[data-axis="0"]')!.getAttribute('transform')).toBe('translate(13, -13)');
    const ids = [...document.querySelectorAll('svg [id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const path of document.querySelectorAll('svg path')) expect(path.getAttribute('d')).not.toContain('\\n');
    act(() => root.render(<Controller variant="unknown" pressed={[6]} axes={[0.5, 0]} />));
    expect(document.querySelector('[data-button="6"]')!.textContent).toContain('7');
    expect(document.querySelector('[data-button="6"]')!.classList.contains('is-pressed')).toBe(true);
});

it('retains the legacy artwork exports with complete, instance-unique SVG implementations', () => {
    act(() =>
        root.render(
            <>
                <svg><XboxArtwork pressed={[]} axes={[]} /></svg>
                <svg><PlayStationArtwork pressed={[0]} axes={[0, 0, 0, 0]} /></svg>
                <svg><ArcadeArtwork pressed={[]} axes={[]} /></svg>
            </>
        )
    );
    expect(document.querySelectorAll('svg')).toHaveLength(3);
    expect(document.querySelectorAll('[data-button="0"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-button="0"].is-pressed')).toHaveLength(1);
    const ids = [...document.querySelectorAll('svg [id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
});

it('runs the documented vanilla and React setup snippets with the real service and tears down polling', () => {
    const frames = new Set<number>();
    let next = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
        frames.add(++next);
        return next;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        frames.delete(id);
    });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    function compile(code: string, filename: string) {
        const output = ts.transpileModule(code, {
            fileName: filename,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                target: ts.ScriptTarget.ES2022,
            },
        });
        const exports: Record<string, any> = {};
        new Function('require', 'exports', output.outputText)((name: string) => {
            if (name === 'gamepad-controller') return gamepad;
            if (name === 'react') return React;
            if (name === 'react/jsx-runtime') return jsxRuntime;
            throw new Error('Unexpected example import: ' + name);
        }, exports);
        return exports;
    }
    const catalog = document.createElement('main');
    catalog.id = 'catalog';
    catalog.innerHTML = '<button>Play</button><button>Library</button>';
    document.body.append(catalog);
    const vanilla = compile(
        integrationExamples.vanilla.code.replace(
            'const dispose = mountCatalog();',
            'export const dispose = mountCatalog();'
        ),
        'catalog.ts'
    );
    expect(frames.size).toBe(1);
    vanilla.dispose();
    expect(frames.size).toBe(0);
    catalog.remove();
    const react = compile(integrationExamples.react.code, 'Catalog.tsx');
    act(() => root.render(React.createElement(react.Catalog)));
    expect(document.querySelectorAll('#catalog button')).toHaveLength(2);
    expect(frames.size).toBe(1);
    act(() => root.render(null));
    expect(frames.size).toBe(0);
});
