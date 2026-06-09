import { describe, it, expect, vi } from 'vitest';
import { TypedEmitter } from '../src/core/EventEmitter.js';

interface TestEvents {
    ping: (n: number) => void;
    pong: (label: string, value: number) => void;
}

describe('TypedEmitter', () => {
    it('delivers emitted events to a subscriber with the right arguments', () => {
        const emitter = new TypedEmitter<TestEvents>();
        const listener = vi.fn();
        emitter.on('pong', listener);

        emitter.emit('pong', 'hp', 42);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith('hp', 42);
    });

    it('supports multiple independent subscribers for the same event', () => {
        const emitter = new TypedEmitter<TestEvents>();
        const a = vi.fn();
        const b = vi.fn();
        emitter.on('ping', a);
        emitter.on('ping', b);

        emitter.emit('ping', 1);

        expect(a).toHaveBeenCalledWith(1);
        expect(b).toHaveBeenCalledWith(1);
    });

    it('unsubscribes via the returned function without affecting other listeners', () => {
        const emitter = new TypedEmitter<TestEvents>();
        const a = vi.fn();
        const b = vi.fn();
        const offA = emitter.on('ping', a);
        emitter.on('ping', b);

        offA();
        emitter.emit('ping', 7);

        expect(a).not.toHaveBeenCalled();
        expect(b).toHaveBeenCalledWith(7);
    });

    it('off() removes a specific listener', () => {
        const emitter = new TypedEmitter<TestEvents>();
        const listener = vi.fn();
        emitter.on('ping', listener);
        emitter.off('ping', listener);

        emitter.emit('ping', 1);

        expect(listener).not.toHaveBeenCalled();
    });

    it('reports listener presence via hasListeners()', () => {
        const emitter = new TypedEmitter<TestEvents>();
        expect(emitter.hasListeners('ping')).toBe(false);

        const off = emitter.on('ping', () => {});
        expect(emitter.hasListeners('ping')).toBe(true);

        off();
        expect(emitter.hasListeners('ping')).toBe(false);
    });

    it('clear() drops every subscriber', () => {
        const emitter = new TypedEmitter<TestEvents>();
        const a = vi.fn();
        emitter.on('ping', a);
        emitter.on('pong', vi.fn());

        emitter.clear();
        emitter.emit('ping', 1);

        expect(a).not.toHaveBeenCalled();
        expect(emitter.hasListeners('pong')).toBe(false);
    });

    it('emitting an event with no listeners is a no-op', () => {
        const emitter = new TypedEmitter<TestEvents>();
        expect(() => emitter.emit('ping', 1)).not.toThrow();
    });
});
