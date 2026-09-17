import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { GamepadService } from 'gamepad-ui-engine';
import { DemoPage } from '../src/demos/DemoPage';
import { demos } from '../src/demos/registry';
import * as sourceFiles from '../src/demos/source-files';
let root: ReturnType<typeof createRoot> | undefined;
afterEach(() => {
    if (root) act(() => root!.unmount());
    root = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});
function button(text: string) {
    const match = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === text);
    if (!match) throw new Error(text);
    return match;
}
async function mount() {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
        'requestAnimationFrame',
        vi.fn(() => 1)
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(demos[0]!, 'load').mockResolvedValue({ default: () => <button>Example target</button> });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    await act(async () => root!.render(<DemoPage id="treasure-tiles" />));
}
it('loads selected source only on request and copies exactly the selected file', async () => {
    const first = vi.fn().mockResolvedValue('export const app = 1;\n');
    const support = vi.fn().mockResolvedValue('export const support = 2;\n');
    vi.spyOn(sourceFiles, 'demoSourceFiles').mockReturnValue([
        { path: 'app.ts', language: 'TypeScript', load: first },
        { path: 'support.ts', language: 'TypeScript', load: support },
    ]);
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    await mount();
    expect(first).not.toHaveBeenCalled();
    expect(support).not.toHaveBeenCalled();
    await act(async () => button('View source').click());
    expect(first).toHaveBeenCalledTimes(1);
    expect(support).not.toHaveBeenCalled();
    expect(document.querySelector('.code-block')!.textContent).toContain('export const app = 1;');
    const select = document.querySelector<HTMLSelectElement>('[aria-label="Source file"]')!;
    await act(async () => {
        select.value = 'support.ts';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(support).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.code-block')!.textContent).toContain('export const support = 2;');
    await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
    expect(copy).toHaveBeenCalledWith('export const support = 2;\n');
});
it('stops running input on source failure and offers retry without automatically restarting', async () => {
    const load = vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue('export const recovered = true;');
    vi.spyOn(sourceFiles, 'demoSourceFiles').mockReturnValue([{ path: 'app.ts', language: 'TypeScript', load }]);
    const destroy = vi.spyOn(GamepadService.prototype, 'destroy');
    await mount();
    act(() => button('Start demo').click());
    await act(async () => button('View source').click());
    expect(destroy).toHaveBeenCalled();
    expect(document.querySelector('[role="alert"]')!.textContent).toContain('input session has stopped');
    expect(button('Start demo').disabled).toBe(true);
    await act(async () => button('Retry source').click());
    expect(document.querySelector('.code-block')!.textContent).toContain('recovered');
    expect(button('Start demo').disabled).toBe(false);
});

it('exposes the controller molecule and every complete artwork implementation', async () => {
    const files = sourceFiles.demoSourceFiles(demos[0]!);
    const paths = files.map((file) => file.path);
    for (const path of [
        'website/src/components/molecules/Controller/Controller.tsx',
        'website/src/components/molecules/Controller/XboxArtwork.tsx',
        'website/src/components/molecules/Controller/PlayStationArtwork.tsx',
        'website/src/components/molecules/Controller/ArcadeArtwork.tsx',
    ]) {
        expect(paths).toContain(path);
        const file = files.find((entry) => entry.path === path)!;
        await expect(file.load()).resolves.toContain('export function');
    }
    expect(paths).not.toContain('website/src/Controller.tsx');
    expect(paths).not.toContain('website/src/ControllerArtwork.tsx');
});
