import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { DemoShell } from '../src/demos/DemoShell';
import FilmCatalog from '../src/demos/apps/FilmCatalog';
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
function button(label: string) {
    const match = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    if (!match) throw new Error(label);
    return match;
}
function click(label: string) {
    act(() => button(label).click());
}
function posters() {
    return [...document.querySelectorAll<HTMLButtonElement>('.film-poster')];
}
function key(value: string, type = 'keydown') {
    act(() =>
        document.activeElement!.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }))
    );
}
function render(suspended = false) {
    act(() =>
        root.render(
            <DemoShell
                demo={demos.find((demo) => demo.id === 'film-catalog')!}
                app={FilmCatalog}
                suspended={suspended}
            />
        )
    );
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
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function () {
        return [this.getBoundingClientRect()] as unknown as DOMRectList;
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
        this.open = false;
    };
    const original = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
        return selector === ':modal' ? this instanceof HTMLDialogElement && this.open : original.call(this, selector);
    });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
    render();
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});
it('shows six films and completes save/preview/close without running input', () => {
    expect(posters()).toHaveLength(6);
    const opener = posters()[2]!;
    act(() => opener.click());
    expect(document.querySelector('dialog')!.open).toBe(true);
    click('Save to your list');
    expect(button('Saved to your list').getAttribute('aria-pressed')).toBe('true');
    click('Play preview');
    expect(document.querySelector('.film-preview')!.textContent).toContain('Local preview');
    click('Close');
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(frames.size).toBe(0);
});
it('settles native-modal MutationObserver delivery instead of rewriting watched focus classes forever', async () => {
    const NativeObserver = window.MutationObserver;
    let deliveries = 0;
    // A bounded real observer makes the pre-fix microtask loop fail without hanging the test runner.
    vi.stubGlobal(
        'MutationObserver',
        class extends NativeObserver {
            constructor(callback: MutationCallback) {
                super((records, observer) => {
                    deliveries += 1;
                    if (deliveries > 30) {
                        observer.disconnect();
                        return;
                    }
                    callback(records, observer);
                });
            }
        }
    );
    click('Start demo');
    frame();
    act(() => posters()[2]!.click());
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(deliveries).toBeGreaterThan(0);
    expect(deliveries).toBeLessThan(10);
    expect(document.querySelector('dialog [data-gamepad-focused="true"]')).not.toBeNull();
    click('Save to your list');
    click('Play preview');
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(deliveries).toBeLessThan(15);
    click('Close');
    expect(document.activeElement).toBe(posters()[2]);
});
it('contains real-service focus in details and synchronously handles Back to the pointer-selected opener', () => {
    click('Start demo');
    frame();
    const opener = posters()[4]!;
    act(() => {
        opener.focus();
        opener.click();
    });
    frame();
    key('ArrowRight');
    frame();
    key('ArrowRight', 'keyup');
    frame();
    expect(document.querySelector('dialog')!.contains(document.activeElement)).toBe(true);
    act(() => button('Save to your list').focus());
    key('Enter');
    frame();
    key('Enter', 'keyup');
    frame();
    expect(button('Saved to your list')).toBeTruthy();
    key('Escape');
    frame();
    key('Escape', 'keyup');
    frame();
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(frames.size).toBe(1);
});
it('restores an eligible fallback when the original poster disappears', () => {
    click('Start demo');
    frame();
    act(() => posters()[3]!.click());
    click('Remove poster from catalog');
    expect(posters()).toHaveLength(5);
    click('Close');
    expect(document.activeElement).toBe(posters()[0]);
    act(() => posters()[2]!.click());
    const opener = posters()[2]!;
    opener.hidden = true;
    click('Close');
    expect(document.activeElement).toBe(posters()[0]);
});
it('cancels native Escape and does not reopen the modal when service stops for docs search', () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    click('Start demo');
    frame();
    act(() => posters()[0]!.click());
    expect(show).toHaveBeenCalledTimes(1);
    render(true);
    expect(frames.size).toBe(0);
    expect(show).toHaveBeenCalledTimes(1);
    act(() => document.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(document.querySelector('dialog')).toBeNull();
});
it('keeps the native modal open across source replacement, stop/restart, then cleans reset and unmount', () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    click('Start demo');
    frame();
    act(() => posters()[1]!.click());
    const dialog = document.querySelector('dialog')!;
    const select = document.querySelector('select')!;
    act(() => {
        select.value = 'native';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    frame();
    expect(dialog.open).toBe(true);
    expect(show).toHaveBeenCalledTimes(1);
    expect(dialog.contains(document.activeElement)).toBe(true);
    click('Stop demo');
    expect(frames.size).toBe(0);
    expect(dialog.open).toBe(true);
    click('Start demo');
    frame();
    expect(show).toHaveBeenCalledTimes(1);
    expect(dialog.contains(document.activeElement)).toBe(true);
    click('Reset example');
    expect(dialog.open).toBe(false);
    expect(document.querySelector('dialog')).toBeNull();
    act(() => posters()[0]!.click());
    const second = document.querySelector('dialog')!;
    act(() => root.render(<div>Another route</div>));
    expect(second.open).toBe(false);
    expect(frames.size).toBe(0);
});
