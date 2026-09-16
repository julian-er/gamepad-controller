import { act } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const flush = (delay = 0) => new Promise<void>((resolve) => setTimeout(resolve, delay));

function route(hash: string) {
    act(() => {
        location.hash = hash;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
}

async function settle(delay = 0) {
    await act(async () => flush(delay));
}

async function traverseHistory(action: () => void) {
    await act(async () => {
        const changed = new Promise<void>((resolve) => window.addEventListener('hashchange', () => resolve(), { once: true }));
        action();
        // jsdom delivers hash traversal asynchronously, like a browser navigation task.
        await changed;
    });
}

function button(label: string) {
    const match = [...document.querySelectorAll<HTMLButtonElement>('button')].find((item) =>
        item.getAttribute('aria-label') === label || item.textContent?.trim() === label
    );
    if (!match) throw new Error('Missing button: ' + label);
    return match;
}

beforeAll(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<meta name="theme-color" content="#000"><div id="root"></div>';
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: () => undefined,
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Storage disabled', 'SecurityError');
    });
    HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
        // jsdom has no native dialog Escape default action. Model that browser action so
        // safeguards exercise Escape -> cancel -> React onCancel instead of dispatching
        // cancel directly from the test body.
        this.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            const cancel = new Event('cancel', { cancelable: true });
            this.dispatchEvent(cancel);
            if (!cancel.defaultPrevented) this.open = false;
        });
    };
    location.hash = '#/docs/introduction';
    await import('../src/main');
    await settle();
});

afterAll(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('documentation app safeguards', () => {
    it('handles routes, history-style hash changes, anchors, and unknown documents', async () => {
        const anchor = document.getElementById('getting-started') ?? document.querySelector<HTMLElement>('.doc-section')!;
        const scrollIntoView = vi.spyOn(anchor, 'scrollIntoView').mockImplementation(() => undefined);

        route('#/docs/introduction#' + anchor.id);
        await settle();
        expect(scrollIntoView).toHaveBeenCalled();
        expect(document.title).toContain('gamepad-controller docs');

        route('#/docs/api');
        await settle();
        expect(document.title).toContain('API reference');
        route('#/docs/introduction');
        await settle();
        expect(document.title).toContain('gamepad-controller docs');

        route('#/docs/not-a-document');
        await settle();
        expect(document.title).toBe('Page not found — gamepad-controller docs');
        expect(document.querySelector('h1')!.textContent).toContain('off the map');
    });

    it('traverses documentation routes with browser back, forward, and go history APIs', async () => {
        route('#/docs/introduction');
        await settle();
        route('#/docs/api');
        await settle();
        expect(document.title).toContain('API reference');

        await traverseHistory(() => history.back());
        expect(location.hash).toBe('#/docs/introduction');
        expect(document.title).toContain('gamepad-controller docs');

        await traverseHistory(() => history.forward());
        expect(location.hash).toBe('#/docs/api');
        expect(document.title).toContain('API reference');

        await traverseHistory(() => history.go(-1));
        expect(location.hash).toBe('#/docs/introduction');
        expect(document.title).toContain('gamepad-controller docs');
    });

    it('continues with optional theme storage unavailable for reads and writes', async () => {
        expect(document.documentElement.dataset.theme).toBe('dark');
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage disabled', 'SecurityError');
        });
        route('#/docs/introduction');
        await settle();
        act(() => button('Switch to light theme').click());
        await settle();
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(setItem).toHaveBeenCalledWith('gc-theme', 'light');
    });

    it('characterizes the known Escape focus-restoration defect through the dialog path', async () => {
        route('#/docs/introduction');
        await settle();
        const trigger = button('Search documentation');
        act(() => trigger.focus());
        act(() => trigger.click());
        await settle();

        const dialog = document.querySelector<HTMLDialogElement>('dialog.search-dialog')!;
        expect(document.activeElement).toBe(dialog.querySelector('#doc-search'));
        act(() => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
        await settle();

        expect(document.querySelector('dialog.search-dialog')).toBeNull();
        // Known current behavior: Search records the auto-focused input, so unmounting it
        // leaves browser focus on body rather than restoring the invoking trigger.
        expect(document.activeElement).toBe(document.body);
        expect(document.activeElement).not.toBe(trigger);
    });

    it('stops a simulated demo while documentation search or navigation is open', async () => {
        route('#/docs/demo-film-catalog');
        await settle(50);
        act(() => button('Start demo').click());
        await settle();
        expect(button('Stop demo')).toBeTruthy();

        act(() => button('Search documentation').click());
        await settle();
        expect(button('Start demo').disabled).toBe(true);
        expect(document.querySelector('.demo-session-note')!.textContent).toContain('stopped while documentation navigation');

        act(() =>
            document
                .querySelector<HTMLDialogElement>('dialog.search-dialog')!
                .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        );
        await settle();
        expect(button('Start demo').disabled).toBe(false);
        act(() => button('Start demo').click());
        await settle();
        act(() => button('Toggle navigation').click());
        await settle();
        expect(button('Start demo').disabled).toBe(true);
        expect(document.querySelector('.docs-sidebar')!.classList.contains('is-open')).toBe(true);
    });
});
