import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { DemoShell } from '../src/demos/DemoShell';
import TreasureTiles from '../src/demos/apps/TreasureTiles';
import { demos } from '../src/demos/registry';
let root: Root;
let frames: Map<number, FrameRequestCallback>;
let time: number;
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function tiles() {
    return [...document.querySelectorAll<HTMLButtonElement>('.treasure-board button')];
}
function click(label: string) {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    if (!button) throw new Error(label);
    act(() => button.click());
}
function key(key: string, type = 'keydown') {
    act(() => document.activeElement!.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true })));
}
function render(suspended = false) {
    act(() => root.render(<DemoShell demo={demos[0]!} app={TreasureTiles} suspended={suspended} />));
}
beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    let counter = 0;
    time = 1000;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
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
        const index = tiles().indexOf(this as HTMLButtonElement);
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
    render();
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});
describe('Treasure Tiles real-service journey', () => {
    it('leaves editable controls and modified shortcuts to the browser', () => {
        click('Start demo');
        frame();
        const surface = document.querySelector('.demo-app-surface')!;
        for (const tag of ['input', 'textarea', 'select', 'div']) {
            const control = document.createElement(tag);
            if (tag === 'div') control.setAttribute('contenteditable', 'true');
            surface.append(control);
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
            act(() => control.dispatchEvent(event));
            expect(event.defaultPrevented).toBe(false);
            control.remove();
        }
        const modified = new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });
        act(() => tiles()[0]!.dispatchEvent(modified));
        frame();
        expect(modified.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(tiles()[0]);
    });
    it('supports pointer play while idle, counts each tile once and locks the winning round', () => {
        expect(frames.size).toBe(0);
        act(() => tiles()[0]!.click());
        act(() => tiles()[0]!.click());
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('1 reveal');
        act(() => tiles()[8]!.click());
        act(() => tiles()[1]!.click());
        expect(document.querySelector('.treasure-result')!.textContent).toContain('Treasure found in 2 reveals');
        click('New round');
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('0 reveals');
        expect(frames.size).toBe(0);
    });
    it('moves spatially, holds select once, resets with Back and restores first focus', () => {
        click('Start demo');
        frame();
        expect(document.activeElement).toBe(tiles()[0]);
        key('ArrowRight');
        frame();
        key('ArrowRight', 'keyup');
        frame();
        expect(document.activeElement).toBe(tiles()[1]);
        key('Enter');
        frame();
        frame();
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('1 reveal');
        key('Enter', 'keyup');
        frame();
        key('Escape');
        frame();
        key('Escape', 'keyup');
        frame();
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('0 reveals');
        expect(document.activeElement).toBe(tiles()[0]);
    });
    it('preserves round on stop, resets independently, and stops when docs overlays open', () => {
        click('Start demo');
        frame();
        act(() => tiles()[0]!.click());
        click('Stop demo');
        expect(frames.size).toBe(0);
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('1 reveal');
        click('Reset example');
        expect(document.querySelector('.treasure-heading strong')!.textContent).toBe('0 reveals');
        click('Start demo');
        frame();
        render(true);
        expect(frames.size).toBe(0);
        expect(document.querySelector('.demo-session-note')!.textContent).toContain('navigation is open');
        render(false);
        expect(frames.size).toBe(0);
        click('Start demo');
        frame();
        act(() => root.render(<div>Another route</div>));
        expect(frames.size).toBe(0);
    });
    it('stops native input too when docs navigation opens', () => {
        const select = document.querySelector('select')!;
        act(() => {
            select.value = 'native';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        click('Start demo');
        frame();
        expect(frames.size).toBe(2);
        render(true);
        expect(frames.size).toBe(0);
    });
});
