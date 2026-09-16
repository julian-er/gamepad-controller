// EventEmitter.ts
// A small strongly-typed multi-subscriber emitter shared by GamepadService and
// GamepadNavigationContext. Both previously hand-rolled the same Map<event, Set<listener>>
// pattern; this consolidates it into one primitive with a `hasListeners` helper used by the
// "emit if subscribed, else fall back to the platform" navigation policy.

/** Shape of an event map: keys are event names, values are listener signatures. */
export type EventMap = Record<string, (...args: never[]) => void>;

/**
 * Strongly-typed event emitter supporting multiple independent subscribers per event.
 *
 * The self-referential constraint (`TMap extends Record<keyof TMap, ...>`) lets plain
 * interfaces — which lack a string index signature — be used as the event map, while still
 * requiring every value to be a listener function.
 *
 * ```ts
 * interface MyEvents { ping: (n: number) => void }
 * const emitter = new TypedEmitter<MyEvents>();
 * const off = emitter.on('ping', (n) => console.log(n));
 * emitter.emit('ping', 42);
 * off();
 * ```
 */
export class TypedEmitter<TMap extends Record<keyof TMap, (...args: never[]) => void>> {
    private listeners: Map<keyof TMap, Set<(...args: never[]) => void>> = new Map();
    private errorHandler: ((error: Error) => void) | null = null;
    private reportingError = false;

    /** Install the service-owned error boundary used to isolate consumer callbacks. */
    setErrorHandler(handler: ((error: Error) => void) | null): void {
        this.errorHandler = handler;
    }

    /**
     * Subscribe to an event. Multiple subscribers are supported.
     * @returns An unsubscribe function that removes this exact listener.
     */
    on<K extends keyof TMap>(event: K, listener: TMap[K]): () => void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(listener as (...args: never[]) => void);
        return () => this.off(event, listener);
    }

    /** Remove a previously-registered listener. No-op if it was never registered. */
    off<K extends keyof TMap>(event: K, listener: TMap[K]): void {
        this.listeners.get(event)?.delete(listener as (...args: never[]) => void);
    }

    /** Invoke every listener registered for `event` with the given arguments. */
    emit<K extends keyof TMap>(event: K, ...args: Parameters<TMap[K]>): boolean {
        const set = this.listeners.get(event);
        if (!set) return true;
        let succeeded = true;
        // Snapshot the Set: a callback may unsubscribe, destroy the service, or subscribe.
        for (const listener of [...set]) {
            try {
                (listener as (...a: Parameters<TMap[K]>) => void)(...args);
            } catch (cause) {
                succeeded = false;
                if (!this.errorHandler || this.reportingError) continue;
                this.reportingError = true;
                try {
                    try {
                        this.errorHandler(cause instanceof Error ? cause : new Error(String(cause)));
                    } catch {
                        // Reporting must never take down the input loop.
                    }
                } finally {
                    this.reportingError = false;
                }
            }
        }
        return succeeded;
    }

    /** Whether at least one listener is registered for `event`. */
    hasListeners<K extends keyof TMap>(event: K): boolean {
        const set = this.listeners.get(event);
        return !!set && set.size > 0;
    }

    /** Drop every subscriber for every event (used during teardown). */
    clear(): void {
        this.listeners.clear();
    }
}
