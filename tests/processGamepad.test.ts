import { describe, it, expect, vi } from 'vitest';
import { processGamepad } from '../src/core/gamepadEventHandler';
import type { GamepadEventState } from '../src/Interfaces/GamepadEvents';
import type { NavigationState } from '../src/Interfaces/NavigationState';

function gamepadWith(pressed: number[]): Gamepad {
    return {
        id: 'Xbox Wireless Controller',
        index: 0,
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
        lastButtonPress: 0,
        lastAxisMove: 0,
        lastBackButtonState: false,
        lastBackTime: 0,
        lastR1State: false,
        lastL1State: false,
        lastShoulderTime: 0,
        lastScrollTime: 0,
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

describe('processGamepad — selection', () => {
    it('delegates the primary button to the context manager in dual-context mode', () => {
        const handleSelection = vi.fn().mockReturnValue(true);
        const fakeContextManager = {
            handleShoulderNavigation: vi.fn(),
            handleStickNavigation: vi.fn(),
            handleSelection,
        };

        // Button index 0 = A / primary on xbox.
        processGamepad(gamepadWith([0]), eventState(), navState(), 1000, fakeContextManager as never);

        expect(handleSelection).toHaveBeenCalledTimes(1);
    });
});
