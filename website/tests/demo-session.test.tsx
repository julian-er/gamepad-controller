import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GamepadService } from 'gamepad-ui-engine';
import { useDemoSession, type DemoSource } from '../src/demos/useDemoSession';
import { snapshot, sendSnapshot } from '../src/simulation';
import { DemoShell } from '../src/demos/DemoShell';
import { demos } from '../src/demos/registry';

let root: Root;
let frames: Map<number, FrameRequestCallback>;
let time: number;
let sessions: Record<string, ReturnType<typeof useDemoSession>>;
const selected = vi.fn();
function Harness({
    id,
    source = 'simulation',
    prepare,
}: {
    id: string;
    source?: DemoSource;
    prepare?: (service: GamepadService) => void | (() => void);
}) {
    sessions[id] = useDemoSession({ containerId: id, source, variant: 'xbox', mode: 'horizontal', prepare });
    return (
        <div id={id}>
            {[0, 1, 2].map((index) => (
                <button key={index} onClick={() => selected(id, index)}>
                    {index}
                </button>
            ))}
        </div>
    );
}
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function targets(id = 'one') {
    return [...document.querySelectorAll<HTMLButtonElement>(`#${id} button`)];
}
function start(id = 'one') {
    act(() => sessions[id]!.start());
    frame();
}
function send(pressed: number[], id = 'one') {
    act(() => sendSnapshot('xbox', pressed, [0, 0, 0, 0], sessions[id]!.channel));
}

beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    let counter = 0;
    time = 1000;
    sessions = {};
    selected.mockReset();
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
        const index = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
        const x = index * 150;
        return { x, y: 0, left: x, top: 0, right: x + 100, bottom: 100, width: 100, height: 100, toJSON() {} };
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    act(() =>
        root.render(
            <StrictMode>
                <Harness id="one" />
                <Harness id="two" />
            </StrictMode>
        )
    );
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('owned demo sessions using the public service', () => {
    it('shows a native permission error without phantom activation or accumulating polling and cleans up on Stop', () => {
        const getGamepads = vi.fn(() => {
            throw new DOMException('Gamepad access denied', 'SecurityError');
        });
        Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: getGamepads });
        act(() =>
            root.render(
                <DemoShell
                    demo={demos.find((demo) => demo.id === 'treasure-tiles')!}
                    app={() => <button onClick={() => selected()}>Native target</button>}
                />
            )
        );
        const source = document.querySelector<HTMLSelectElement>('select')!;
        act(() => {
            source.value = 'native';
            source.dispatchEvent(new Event('change', { bubbles: true }));
        });
        const toggle = () =>
            [...document.querySelectorAll('button')].find((button) =>
                /^(Start|Stop) demo$/.test(button.textContent ?? '')
            )!;
        act(() => toggle().click());
        frame();
        expect(document.querySelector('[role="alert"]')?.textContent).toBe('Gamepad input is unavailable.');
        expect(selected).not.toHaveBeenCalled();
        const calls = getGamepads.mock.calls.length;
        for (let index = 0; index < 5; index++) {
            frame();
            expect(frames.size).toBeLessThanOrEqual(1);
        }
        expect(getGamepads.mock.calls.length - calls).toBeLessThanOrEqual(5);
        act(() => toggle().click());
        expect(frames.size).toBe(0);
        const stoppedCalls = getGamepads.mock.calls.length;
        frame();
        expect(getGamepads).toHaveBeenCalledTimes(stoppedCalls);
    });
    it('removes the exact event listeners installed by its lifecycle', () => {
        const windowAdd = vi.spyOn(window, 'addEventListener');
        const windowRemove = vi.spyOn(window, 'removeEventListener');
        const documentAdd = vi.spyOn(document, 'addEventListener');
        const documentRemove = vi.spyOn(document, 'removeEventListener');
        start();
        const channel = sessions.one!.channel;
        act(() => sessions.one!.stop());
        for (const [name, listener] of windowAdd.mock.calls.filter(
            ([name]) => name.startsWith(channel) || name === 'blur'
        )) {
            expect(
                windowRemove.mock.calls.some(
                    ([removedName, removedListener]) => removedName === name && removedListener === listener
                )
            ).toBe(true);
        }
        for (const [name, listener] of documentAdd.mock.calls.filter(([name]) => name === 'visibilitychange')) {
            expect(
                documentRemove.mock.calls.some(
                    ([removedName, removedListener]) => removedName === name && removedListener === listener
                )
            ).toBe(true);
        }
        expect(windowAdd.mock.calls.some(([name]) => name === channel)).toBe(true);
    });
    it('does not select when native primary is held at startup', () => {
        let held = true;
        Object.defineProperty(navigator, 'getGamepads', {
            configurable: true,
            value: () => [snapshot('xbox', held ? [0] : [])],
        });
        act(() => root.render(<Harness id="one" source="native" />));
        start();
        frame();
        expect(selected).not.toHaveBeenCalled();
        held = false;
        frame();
        held = true;
        frame();
        expect(selected).toHaveBeenCalledTimes(1);
    });
    it('stays idle and isolates channels across two running instances', () => {
        expect(frames.size).toBe(0);
        start();
        start('two');
        expect(sessions.one!.channel).not.toBe(sessions.two!.channel);
        send([0]);
        send([]);
        frame();
        expect(selected.mock.calls).toEqual([['one', 0]]);
        expect(frames.size).toBe(2);
    });
    it('preserves a press and release delivered before one frame and requires release to select again', () => {
        start();
        send([0]);
        send([]);
        frame();
        expect(selected).toHaveBeenCalledTimes(1);
        send([0]);
        frame();
        frame();
        expect(selected).toHaveBeenCalledTimes(2);
        send([]);
        send([0]);
        frame();
        expect(selected).toHaveBeenCalledTimes(3);
    });
    it('continues held directional input through silence and releases all buttons and axes', () => {
        start();
        act(() => {
            sessions.one!.press(15);
            sessions.one!.setAxis(3, 1);
        });
        frame();
        expect(document.activeElement).toBe(targets()[1]);
        frame();
        expect(document.activeElement).toBe(targets()[2]);
        act(() => sessions.one!.releaseAll());
        frame();
        const focused = document.activeElement;
        frame();
        expect(document.activeElement).toBe(focused);
        expect(sessions.one!.axes).toEqual([0, 0, 0, 0]);
        expect(sessions.one!.pressed).toEqual([]);
    });
    it('clears queued and held input at reset and disconnect, then baselines held primary safely', () => {
        start();
        send([0]);
        act(() => sessions.one!.resetInput());
        frame();
        expect(selected).not.toHaveBeenCalled();
        send([0]);
        act(() =>
            window.dispatchEvent(
                new CustomEvent(sessions.one!.channel + '-disconnect', { detail: { gamepad: { index: 0 } } })
            )
        );
        send([0]);
        frame();
        expect(selected).not.toHaveBeenCalled();
        send([]);
        send([0]);
        frame();
        expect(selected).toHaveBeenCalledTimes(1);
    });
    it('destroys on stop, rejects stale channels after restart, and removes owned frames on unmount', () => {
        start();
        const stale = sessions.one!.channel;
        act(() => sessions.one!.stop());
        expect(frames.size).toBe(0);
        expect(sessions.one!.service).toBeNull();
        start();
        expect(sessions.one!.channel).not.toBe(stale);
        act(() => sendSnapshot('xbox', [0], [0, 0, 0, 0], stale));
        frame();
        expect(selected).not.toHaveBeenCalled();
        act(() => root.render(<div />));
        expect(frames.size).toBe(0);
    });
    it('rebuilds policy and manual targets before each initialization and cleans their subscription', () => {
        const events = vi.fn();
        const dispose = vi.fn();
        const prepare = vi.fn((service: GamepadService) => {
            service.setElements(targets());
            const off = service.on('beforeaction', (event) => {
                events(event.type);
                if (event.type === 'select') event.preventDefault();
            });
            return () => {
                off();
                dispose();
            };
        });
        act(() => root.render(<Harness id="one" prepare={prepare} />));
        start();
        send([0]);
        send([]);
        frame();
        expect(events).toHaveBeenCalledWith('select');
        expect(selected).not.toHaveBeenCalled();
        act(() => sessions.one!.stop());
        expect(dispose).toHaveBeenCalledTimes(1);
        start();
        expect(prepare).toHaveBeenCalledTimes(2);
        expect(sessions.one!.service!.getElements()).toEqual(targets());
    });
    it('changes input source with a fresh baseline and leaves one owned service', () => {
        start();
        const old = sessions.one!.service;
        act(() => sessions.one!.press(15));
        act(() =>
            root.render(
                <StrictMode>
                    <Harness id="one" source="native" />
                    <Harness id="two" />
                </StrictMode>
            )
        );
        frame();
        expect(sessions.one!.service).not.toBe(old);
        expect(frames.size).toBe(2);
        act(() =>
            root.render(
                <StrictMode>
                    <Harness id="one" />
                    <Harness id="two" />
                </StrictMode>
            )
        );
        frame();
        expect(frames.size).toBe(1);
        expect(selected).not.toHaveBeenCalled();
        expect(sessions.one!.pressed).toEqual([]);
    });
    it('stops on window blur and page hiding and never resumes itself', () => {
        start();
        act(() => window.dispatchEvent(new Event('blur')));
        expect(sessions.one!.running).toBe(false);
        expect(frames.size).toBe(0);
        act(() => window.dispatchEvent(new Event('focus')));
        expect(frames.size).toBe(0);
        start();
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        act(() => document.dispatchEvent(new Event('visibilitychange')));
        expect(sessions.one!.running).toBe(false);
        expect(frames.size).toBe(0);
    });
});

describe('complete simulation producer', () => {
    it('copies valid axes and emits 17 fully described buttons', () => {
        const axes = [0, -1, 0.5, 1];
        const state = snapshot('xbox', [0, 16], axes);
        axes[0] = 1;
        expect(state.axes).toEqual([0, -1, 0.5, 1]);
        expect(state.buttons).toHaveLength(17);
        expect(state.buttons[0]).toEqual({ pressed: true, touched: true, value: 1 });
        expect(state.buttons[1]).toEqual({ pressed: false, touched: false, value: 0 });
    });
    it('rejects incomplete or invalid producer values', () => {
        for (const axes of [Array<number>(4), [0], [0, 0, NaN, 0], [0, 0, 0, Infinity], [0, 0, 0, 2]]) {
            expect(() => snapshot('xbox', [], axes)).toThrow(RangeError);
        }
        for (const index of [-1, 17, 0.5, NaN]) expect(() => snapshot('xbox', [index])).toThrow(RangeError);
    });
});
