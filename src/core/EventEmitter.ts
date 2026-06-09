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
    emit<K extends keyof TMap>(event: K, ...args: Parameters<TMap[K]>): void {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const listener of set) {
            (listener as (...a: Parameters<TMap[K]>) => void)(...args);
        }
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
