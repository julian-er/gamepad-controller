import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { GamepadService } from 'gamepad-ui-engine';
import { useDemoSession } from '../src/demos/useDemoSession';
import RecipeBrowser from '../src/demos/apps/RecipeBrowser';
import { DemoShell } from '../src/demos/DemoShell';
import { demos } from '../src/demos/registry';
let root: Root;
let frames: Map<number, FrameRequestCallback>;
let time: number;
let session: ReturnType<typeof useDemoSession>;
function Harness() {
    session = useDemoSession({
        containerId: 'recipe-viewport',
        variant: 'xbox',
        source: 'simulation',
        mode: 'spatial',
        enableBack: true,
        enableScroll: true,
        useDataAttributes: true,
    });
    return (
        <div id="recipe-viewport">
            <RecipeBrowser session={session} onReset={() => {}} />
        </div>
    );
}
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function button(label: string) {
    const match = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    if (!match) throw new Error(label);
    return match;
}
function click(label: string) {
    act(() => {
        const node = button(label);
        node.focus();
        node.click();
    });
}
function cards() {
    return [...document.querySelectorAll<HTMLButtonElement>('.recipe-card')];
}
beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    let counter = 0;
    time = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => time);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.set(++counter, callback);
        return counter;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        frames.delete(id);
    });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        const index = [...document.querySelectorAll('button')].indexOf(this as HTMLButtonElement);
        const x = Math.max(0, index % 3) * 150;
        const y = Math.floor(Math.max(index, 0) / 3) * 150;
        return { x, y, left: x, top: y, right: x + 100, bottom: y + 100, width: 100, height: 100, toJSON() {} };
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    act(() => root.render(<Harness />));
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});
it('replaces target membership after filters commit, preserves current filter and keeps empty-state recovery controls', () => {
    act(() => session.start());
    frame();
    expect(cards()).toHaveLength(4);
    click('Quick');
    expect(cards()).toHaveLength(2);
    expect(document.activeElement).toBe(button('Quick'));
    expect(session.service!.getElements()).toEqual([...document.querySelectorAll('#recipe-viewport button')]);
    click('Desserts');
    expect(cards()).toHaveLength(0);
    expect(session.service!.getElements()).toHaveLength(4);
    expect(document.activeElement).toBe(button('Desserts'));
    expect(document.querySelector('[role="status"]')!.textContent).toContain('No desserts yet');
    click('Comfort');
    expect(cards()).toHaveLength(2);
    expect(document.activeElement).toBe(button('Comfort'));
});
it('opens steps, retains unchanged target membership when marking a step and returns to recreated opener', () => {
    act(() => session.start());
    frame();
    const id = cards()[1]!.dataset.recipeId;
    act(() => {
        cards()[1]!.focus();
        cards()[1]!.click();
    });
    expect(document.activeElement).toBe(button('Back to recipes'));
    expect(document.querySelectorAll('.recipe-steps li')).toHaveLength(5);
    const registry = vi.spyOn(GamepadService.prototype, 'setElements');
    click('Mark step 1 complete');
    expect(registry).not.toHaveBeenCalled();
    expect(document.querySelector('.recipe-detail [role="status"]')!.textContent).toContain('1 of 5');
    act(() => session.press(1));
    frame();
    act(() => session.release(1));
    frame();
    expect(document.querySelector('.recipe-detail')).toBeNull();
    expect((document.activeElement as HTMLElement).dataset.recipeId).toBe(id);
});
it('scrolls only the actual configured service viewport and stops after axes release or teardown', () => {
    act(() => session.start());
    frame();
    act(() => cards()[0]!.click());
    const viewport = document.getElementById('recipe-viewport')!;
    Object.defineProperties(viewport, {
        clientHeight: { configurable: true, value: 300 },
        scrollHeight: { configurable: true, value: 2000 },
    });
    viewport.scrollBy = vi.fn((_x: number, y: number) => {
        viewport.scrollTop += y;
    }) as typeof viewport.scrollBy;
    const documentScroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    act(() => session.setAxis(3, 1));
    frame();
    frame();
    expect(viewport.scrollTop).toBeGreaterThan(0);
    expect(documentScroll).not.toHaveBeenCalled();
    act(() => session.releaseAll());
    frame();
    const stopped = viewport.scrollTop;
    frame();
    expect(viewport.scrollTop).toBe(stopped);
    act(() => session.setAxis(3, 1));
    frame();
    act(() => session.stop());
    expect(frames.size).toBe(0);
    expect(session.axes).toEqual([0, 0, 0, 0]);
});
it('supports filters, details, and return while controller input is idle', () => {
    click('Quick');
    act(() => cards()[0]!.click());
    expect(document.activeElement).toBe(button('Back to recipes'));
    click('Back to recipes');
    expect(cards()).toHaveLength(2);
    expect(document.activeElement).toBe(cards()[0]);
    expect(frames.size).toBe(0);
});
it('wires right-stick controls through complete snapshots and releases pointer/keyboard/focus boundaries', () => {
    act(() =>
        root.render(<DemoShell demo={demos.find((demo) => demo.id === 'recipe-browser')!} app={RecipeBrowser} />)
    );
    click('Start demo');
    frame();
    const scroll = button('Scroll down');
    scroll.setPointerCapture = vi.fn();
    const axis = () => document.querySelector('.demo-scroll-pad .mono')!.textContent;
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    for (const end of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        act(() => scroll.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })));
        expect(axis()).toContain('RY 1.00');
        act(() => scroll.dispatchEvent(new Event(end, { bubbles: true })));
        expect(axis()).toContain('RY 0.00');
    }
    act(() => scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
    expect(axis()).toContain('RY 1.00');
    act(() => scroll.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true })));
    expect(axis()).toContain('RY 0.00');
    act(() => {
        scroll.focus();
        scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    act(() => button('Reset example').focus());
    expect(axis()).toContain('RY 0.00');
    const snapshots = dispatch.mock.calls.map(([event]) => (event as CustomEvent).detail?.gamepad).filter(Boolean);
    expect(snapshots.length).toBeGreaterThan(4);
    expect(
        snapshots.every(
            (snapshot) =>
                snapshot.buttons.length === 17 && snapshot.axes.length === 4 && snapshot.axes.every(Number.isFinite)
        )
    ).toBe(true);
    act(() => scroll.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })));
    act(() => window.dispatchEvent(new Event('blur')));
    expect(axis()).toContain('RY 0.00');
    expect(frames.size).toBe(0);
    click('Start demo');
    frame();
    act(() => scroll.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(axis()).toContain('RY 0.00');
    expect(frames.size).toBe(0);
});
