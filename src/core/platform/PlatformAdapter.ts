// PlatformAdapter.ts
// A single injectable seam over the browser globals this library touches at runtime —
// timing, the Gamepad API, window events, navigation fallbacks, and DOM-mutation
// observation. Routing these through one interface inverts the dependency on the browser
// (so collaborators no longer reach for `window`/`navigator`/`performance` directly) and
// makes the input loop and navigation fallbacks deterministically testable by injecting a
// fake adapter.
//
// DOM *querying* (querySelector/getComputedStyle/getBoundingClientRect) intentionally stays
// in domUtils — it is a much larger surface and is already isolated there.

/** A plain window-level event listener (handlers cast their typed callbacks to this). */
export type WindowEventListener = (event: Event) => void;

/**
 * Abstraction over the host platform's browser globals. The default implementation is
 * {@link BrowserPlatformAdapter}; tests may supply a fake to drive frames, gamepads, and
 * navigation deterministically.
 */
export interface PlatformAdapter {
    /** Whether a DOM environment (`window` + `document`) is present. */
    readonly isBrowser: boolean;

    /** High-resolution-ish current time in ms (used for input cooldown/debounce math). */
    now(): number;
    /** Schedule a frame callback; returns a handle for {@link cancelAnimationFrame}. */
    requestAnimationFrame(callback: FrameRequestCallback): number;
    /** Cancel a previously-scheduled frame callback. */
    cancelAnimationFrame(handle: number): void;

    /**
     * The live gamepad set. Returns `[]` when the Gamepad API is absent (non-browser /
     * unsupported). May throw `SecurityError` when blocked by `Permissions-Policy: gamepad`
     * — callers are expected to catch and degrade gracefully.
     */
    getGamepads(): (Gamepad | null)[];

    /** Add a window-level event listener (gamepad connect/disconnect, resize, custom events). */
    addWindowListener(type: string, listener: WindowEventListener): void;
    /** Remove a window-level event listener previously added via {@link addWindowListener}. */
    removeWindowListener(type: string, listener: WindowEventListener): void;

    /** Navigate the top-level browsing context (fallback when no `navigationrequest` subscriber). */
    assignLocation(href: string): void;
    /** Go back in browser history (fallback when no `backbutton` subscriber). */
    historyBack(): void;

    /** Create a MutationObserver, or `null` when the API is unavailable. */
    createMutationObserver(callback: MutationCallback): MutationObserver | null;
}

/**
 * Default {@link PlatformAdapter} backed by the real browser globals. Every method reads the
 * global at call time (rather than caching it at construction) so test spies installed on
 * `window`/`navigator` after the adapter is created still take effect.
 */
export class BrowserPlatformAdapter implements PlatformAdapter {
    get isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }

    now(): number {
        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
    }

    requestAnimationFrame(callback: FrameRequestCallback): number {
        return window.requestAnimationFrame(callback);
    }

    cancelAnimationFrame(handle: number): void {
        window.cancelAnimationFrame(handle);
    }

    getGamepads(): (Gamepad | null)[] {
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
            return [];
        }
        // May throw SecurityError under Permissions-Policy; intentionally propagated to the caller.
        return navigator.getGamepads();
    }

    addWindowListener(type: string, listener: WindowEventListener): void {
        window.addEventListener(type, listener);
    }

    removeWindowListener(type: string, listener: WindowEventListener): void {
        window.removeEventListener(type, listener);
    }

    assignLocation(href: string): void {
        window.location.href = href;
    }

    historyBack(): void {
        window.history.back();
    }

    createMutationObserver(callback: MutationCallback): MutationObserver | null {
        return typeof MutationObserver !== 'undefined' ? new MutationObserver(callback) : null;
    }
}

/** Shared default adapter instance used when a consumer does not inject their own. */
export const defaultPlatformAdapter: PlatformAdapter = new BrowserPlatformAdapter();
