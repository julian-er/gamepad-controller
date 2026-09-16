import { describe, it, expect, vi } from 'vitest';
import { processGamepad } from '../src/core/gamepadEventHandler';
import type { GamepadEventState } from '../src/interfaces/GamepadEvents';
import type { NavigationState } from '../src/interfaces/NavigationState';

function gamepadWith(pressed: number[]): Gamepad {
    return makePad({ pressed });
}

function makePad(opts: { id?: string; index?: number; pressed?: number[] } = {}): Gamepad {
    const pressed = opts.pressed ?? [];
    return {
        id: opts.id ?? 'Xbox Wireless Controller',
        index: opts.index ?? 0,
        connected: true,
        mapping: 'standard',
        timestamp: 0,
        buttons: Array.from({ length: 17 }, (_, i) => ({
            pressed: pressed.includes(i),
            touched: pressed.includes(i),
            value: pressed.includes(i) ? 1 : 0,
        })),
        axes: [0, 0, 0, 0],
        vibrationActuator: null,
    } as unknown as Gamepad;
}

function eventState(): GamepadEventState {
    return {
        isRunning: true,
        gamepads: {},
        currentControllerType: 'xbox',
        padInputStates: {},
        animationFrameId: null,
        statusElementId: null,
        onControllerConnect: null,
        onControllerDisconnect: null,
        onNavigationMenuOpen: null,
        onBackButton: null,
        onButtonDown: undefined,
        onButtonUp: undefined,
        customListeners: null,
    };
}

function navState(overrides: Partial<NavigationState['options']> = {}): NavigationState {
    return {
        focusedElementIndex: 0,
        elements: [],
        gridDimensions: { rows: 0, cols: 0 },
        options: {
            enableDualContext: true,
            enableShoulderNavigation: true,
            enableBackButton: true,
            deadzone: 0.1,
            debounceTime: 0,
            ...overrides,
        },
        onFocus: null,
        onSelect: null,
    };
}

describe('processGamepad — shoulder navigation (TD-1 regression)', () => {
    it('forwards the correct string button (not the context manager) to the context manager in dual-context mode', () => {
        const handleShoulderNavigation = vi.fn().mockReturnValue(true);
        const fakeContextManager = {
            handleShoulderNavigation,
            handleStickNavigation: vi.fn(),
            handleSelection: vi.fn(),
        };

        // Button index 5 = R1 on the standard mapping.
        processGamepad(gamepadWith([5]), eventState(), navState(), 1000, fakeContextManager as never);

        expect(handleShoulderNavigation).toHaveBeenCalledTimes(1);
        expect(handleShoulderNavigation).toHaveBeenCalledWith('R1');
    });

    it('forwards L1 when the left shoulder is pressed', () => {
        const handleShoulderNavigation = vi.fn().mockReturnValue(true);
        const fakeContextManager = {
            handleShoulderNavigation,
            handleStickNavigation: vi.fn(),
            handleSelection: vi.fn(),
        };

        // Button index 4 = L1 on the standard mapping.
        processGamepad(gamepadWith([4]), eventState(), navState(), 1000, fakeContextManager as never);

        expect(handleShoulderNavigation).toHaveBeenCalledWith('L1');
    });
});

describe('processGamepad — primary action contract', () => {
    it('activates once while primary is held, then again only after a release', () => {
        const state = eventState();
        const nav = navState({ enableDualContext: false, enableNavigation: true, selectedClass: 'selected' });
        const target = document.createElement('button');
        nav.elements = [target];
        const select = vi.fn();
        nav.onSelect = select;

        processGamepad(gamepadWith([]), state, nav, 1);
        processGamepad(gamepadWith([0]), state, nav, 2);
        processGamepad(gamepadWith([0]), state, nav, 3);
        processGamepad(gamepadWith([]), state, nav, 4);
        processGamepad(gamepadWith([0]), state, nav, 5);

        expect(select).toHaveBeenCalledTimes(2);
    });

    it('records a cancellable request but suppresses the default select effect', () => {
        const state = eventState();
        const nav = navState({ enableDualContext: false, enableNavigation: true, selectedClass: 'selected' });
        const target = document.createElement('button');
        nav.elements = [target];
        const select = vi.fn();
        nav.onSelect = select;
        state.onBeforeAction = (action) => {
            action.preventDefault();
            return !action.defaultPrevented;
        };
        processGamepad(gamepadWith([]), state, nav, 1);
        processGamepad(gamepadWith([0]), state, nav, 2);
        expect(select).not.toHaveBeenCalled();
    });
});

describe('processGamepad — selection', () => {
    it('delegates the primary button to the context manager in dual-context mode', () => {
        const handleSelection = vi.fn().mockReturnValue(true);
        const target = document.createElement('button');
        const fakeContextManager = {
            handleShoulderNavigation: vi.fn(),
            handleStickNavigation: vi.fn(),
            handleSelection,
            getActiveContext: () => ({ getCurrentElement: () => target }),
        };

        // A first snapshot establishes baseline; the following press is the edge.
        const state = eventState();
        const navigation = navState({ enableDualContext: true });
        processGamepad(gamepadWith([]), state, navigation, 900, fakeContextManager as never);
        processGamepad(gamepadWith([0]), state, navigation, 1000, fakeContextManager as never);

        expect(handleSelection).toHaveBeenCalledTimes(1);
    });
});

// Single-context navState wired with N focusable elements in a 1-column grid so
// directional input deterministically advances the shared cursor by one.
function navStateGrid(count: number, overrides: Partial<NavigationState['options']> = {}): NavigationState {
    const ns = navState({ enableDualContext: false, navigationMode: 'grid', wrapNavigation: false, ...overrides });
    ns.elements = Array.from({ length: count }, () => ({}) as unknown as Element);
    ns.gridDimensions = { rows: count, cols: 1 };
    return ns;
}

const PS_ID = 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)';

describe('processGamepad — multiple controllers (shared cursor)', () => {
    it('lets either controller drive the same navigation cursor (per-pad debounce)', () => {
        const es = eventState();
        const ns = navStateGrid(3);

        // Xbox (index 0) presses D-pad Down (button 13) -> cursor 0 -> 1
        processGamepad(makePad({ index: 0, pressed: [13] }), es, ns, 1000);
        expect(ns.focusedElementIndex).toBe(1);

        // PS pad (index 1) presses D-pad Down in the SAME frame timestamp -> cursor 1 -> 2.
        // A new pad has its own lastAxisMove (0), so the shared debounce can't block it.
        processGamepad(makePad({ id: PS_ID, index: 1, pressed: [13] }), es, ns, 1000);
        expect(ns.focusedElementIndex).toBe(2);
    });

    it('keeps edge state independent: an idle pad does not reset another pad held button', () => {
        const es = eventState();
        const ns = navStateGrid(3, { enableBackButton: true, backButtonCooldown: 0 });
        const back = vi.fn();
        es.onBackButton = back;

        // Frame 1: Xbox (0) holds Back (button 1); PS (1) idle.
        processGamepad(makePad({ index: 0, pressed: [1] }), es, ns, 1000);
        processGamepad(makePad({ id: PS_ID, index: 1 }), es, ns, 1000);
        expect(back).toHaveBeenCalledTimes(1);

        // Frame 2: Xbox STILL holds Back; PS still idle. The idle pad must not have
        // cleared pad 0's lastBackButtonState, so no second (false) edge fires.
        processGamepad(makePad({ index: 0, pressed: [1] }), es, ns, 1016);
        processGamepad(makePad({ id: PS_ID, index: 1 }), es, ns, 1016);
        expect(back).toHaveBeenCalledTimes(1);
    });

    it('treats a frozen/idle duplicate pad as a no-op (no double navigation)', () => {
        const es = eventState();
        const ns = navStateGrid(3);

        // Live PS at index 1 presses Down; ghost duplicate at index 3 reports nothing.
        processGamepad(makePad({ id: PS_ID, index: 1, pressed: [13] }), es, ns, 1000);
        processGamepad(makePad({ id: PS_ID, index: 3 }), es, ns, 1000);

        expect(ns.focusedElementIndex).toBe(1); // advanced exactly once
    });
});
