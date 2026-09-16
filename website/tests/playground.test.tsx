import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Playground } from '../src/Playground';
import { sendSnapshot } from '../src/simulation';

let root: Root;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let time: number;
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function button(label: string) {
    const match = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === label);
    if (!match) throw new Error('Missing button: ' + label);
    return match;
}
function click(label: string) {
    act(() => button(label).click());
}
function key(target: Element, type: 'keydown' | 'keyup', value: string) {
    act(() => target.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true })));
}
function tiles() {
    return [...document.querySelectorAll<HTMLButtonElement>('.demo-tile')];
}

beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    nextFrame = 0;
    time = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => time);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        frames.delete(id);
    });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        const index = tiles().indexOf(this as HTMLButtonElement);
        const x = index >= 0 ? (index % 2) * 150 : 0;
        const y = index >= 0 ? Math.floor(index / 2) * 150 : 0;
        return { x, y, left: x, top: y, right: x + 100, bottom: y + 100, width: 100, height: 100, toJSON() {} };
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    document.body.innerHTML = '<div id="test-root"></div>';
    root = createRoot(document.getElementById('test-root')!);
    act(() => root.render(<Playground />));
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('React playground with the real GamepadService', () => {
    it('does not start input or claim focus before the user starts', () => {
        expect(frames.size).toBe(0);
        expect(document.querySelector('.demo-focused')).toBeNull();
        expect(document.querySelector<HTMLButtonElement>('[aria-label="Simulate →"]')!.disabled).toBe(true);
    });
    it('establishes a baseline, navigates, selects exactly once, and releases input', () => {
        click('Start demo');
        frame();
        expect(document.querySelector('.selection-output')!.textContent).not.toContain('Selected:');
        expect(tiles()[0].classList.contains('demo-focused')).toBe(true);
        key(tiles()[0], 'keydown', 'ArrowRight');
        frame();
        key(tiles()[1], 'keyup', 'ArrowRight');
        frame();
        expect(document.activeElement).toBe(tiles()[1]);
        key(tiles()[1], 'keydown', 'Enter');
        frame();
        frame();
        expect(document.querySelector('.selection-output')!.textContent).toBe('Selected: Living room');
        expect(
            [...document.querySelectorAll('.event-log li')].filter((el) =>
                el.textContent?.includes('opened · Living room')
            )
        ).toHaveLength(1);
        key(tiles()[1], 'keyup', 'Enter');
        frame();
        expect(document.querySelector('.controller')!.getAttribute('aria-label')).toContain('Pressed: none');
    });
    it('stops held simulation on blur and cleans up every frame on stop', () => {
        click('Start demo');
        frame();
        key(tiles()[0], 'keydown', 'ArrowRight');
        frame();
        act(() => window.dispatchEvent(new Event('blur')));
        frame();
        const focused = document.querySelector('.demo-focused');
        frame();
        frame();
        expect(document.querySelector('.demo-focused')).toBe(focused);
        click('Stop demo');
        expect(frames.size).toBe(0);
        expect(document.querySelector('.demo-focused')).toBeNull();
        act(() => sendSnapshot('xbox', [15]));
        frame();
        expect(document.querySelector('.demo-focused')).toBeNull();
    });
    it('recreates the service when changing controller skin without phantom selection', () => {
        click('Start demo');
        frame();
        click('PlayStation');
        frame();
        expect(document.querySelector('.device-label')!.textContent).toContain('Simulated playstation');
        expect(document.querySelector('.selection-output')!.textContent).not.toContain('Selected:');
        expect(frames.size).toBe(1);
        key(tiles()[0], 'keydown', 'ArrowDown');
        frame();
        key(tiles()[2], 'keyup', 'ArrowDown');
        frame();
        expect(document.activeElement).toBe(tiles()[2]);
    });
    it('cleans up when unmounted and remains usable after remount', () => {
        click('Start demo');
        frame();
        act(() => root.render(<div>Another page</div>));
        expect(frames.size).toBe(0);
        act(() => root.render(<Playground />));
        click('Start demo');
        frame();
        expect(frames.size).toBe(1);
        expect(document.querySelector('.demo-focused')).not.toBeNull();
    });
});
