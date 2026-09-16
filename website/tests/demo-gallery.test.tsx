import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { docs } from '../src/content';
import { demos } from '../src/demos/registry';
import { DemoGallery } from '../src/demos/DemoGallery';
import { DemoPage } from '../src/demos/DemoPage';
import { demoSourceFiles } from '../src/demos/source-files';
import { learning } from '../src/demos/learning';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});
it('registers the gallery and live demo as searchable documentation routes', () => {
    expect(demos).toHaveLength(8);
    expect(demos.every((demo) => demo.load && demo.source)).toBe(true);
    expect(docs.find((doc) => doc.id === 'examples')?.interactiveDemo).toBe('gallery');
    for (const demo of demos.filter((entry) => entry.load)) {
        const doc = docs.find((entry) => entry.id === 'demo-' + demo.id)!;
        expect(doc.interactiveDemo).toBe(demo.id);
        expect(doc.summary).toBe(demo.challenge);
    }
    expect(new Set(docs.map((doc) => doc.id)).size).toBe(docs.length);
});
it('links each learning topic to a real page and exposes matching complete support source text', async () => {
    for (const demo of demos) {
        for (const topic of learning[demo.id].topics) expect(docs.some((doc) => doc.id === topic.id)).toBe(true);
        const files = demoSourceFiles(demo);
        expect(files.some((file) => file.path.endsWith('useDemoSession.ts'))).toBe(true);
        expect(files.some((file) => file.path.endsWith('_tokens.scss'))).toBe(true);
        for (const file of files) {
            expect(typeof file.load).toBe('function');
            const actual = await file.load();
            expect(actual.replaceAll('\r\n', '\n')).toBe(
                readFileSync(resolve(process.cwd(), '..', file.path), 'utf8').replaceAll('\r\n', '\n')
            );
        }
    }
});
it('renders eight static cards without loading app modules and uses actual cookbook anchors', () => {
    const load = vi.spyOn(demos[0]!, 'load');
    const markup = renderToStaticMarkup(<DemoGallery />);
    expect(load).not.toHaveBeenCalled();
    expect(markup.match(/<article/g) ?? []).toHaveLength(8);
    expect(markup).toContain('#/docs/demo-treasure-tiles');
    const cookbook = docs.find((doc) => doc.id === 'project-cookbook')!;
    for (const demo of demos) expect(cookbook.sections.some((section) => section.id === demo.anchor)).toBe(true);
});
it('reports a failed lazy app load with retry and no session', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.spyOn(demos[0]!, 'load').mockRejectedValue(new Error('offline'));
    document.body.innerHTML = '<div id="root"></div>';
    const root = createRoot(document.getElementById('root')!);
    await act(async () => root.render(<DemoPage id="treasure-tiles" />));
    expect(document.querySelector('[role="alert"]')!.textContent).toContain('could not load');
    expect(document.querySelector('.demo-shell')).toBeNull();
    expect(document.querySelector('button')!.textContent).toBe('Retry example');
    act(() => root.unmount());
});
