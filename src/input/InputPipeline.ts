// InputPipeline.ts
// Owns the gamepad input runtime: the event state (connected pads, per-pad edge/cooldown
// state, status-element id, and the bridged callbacks), the native/custom game-loop functions,
// and the connect/disconnect handlers that pause/resume the loop. Extracted from GamepadService
// so the orchestrator no longer owns polling-loop mechanics directly.

import {
    gameLoop as createGameLoop,
    setupEventListeners,
    removeEventListeners,
    startGameLoop,
    stopGameLoop,
    handleGamepadConnected as handleConnected,
    handleGamepadDisconnected as handleDisconnected,
    createCustomEventGameLoop,
} from './InputHandler.js';
import { getConnectedControllerTypes } from '../utils/controllerUtils.js';
import type { GamepadEventState, GamepadEvent } from '../interfaces/GamepadEvents.js';
import type { GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';
import type { NavigationState } from '../interfaces/NavigationState.js';
import type { GamepadContextManager } from '../contexts/GamepadContextManager.js';
import type { PlatformAdapter } from '../platform/PlatformAdapter.js';

export class InputPipeline {
    /** Mutable input/event state shared (by reference) with the game-loop functions. */
    readonly state: GamepadEventState;

    private nativeGameLoopFn: (() => void) | null = null;
    readonly handleGamepadConnected: (event: GamepadEvent) => void;
    readonly handleGamepadDisconnected: (event: GamepadEvent) => void;

    constructor(
        private readonly navState: NavigationState,
        private readonly contextManager: GamepadContextManager,
        private readonly platform: PlatformAdapter,
        private readonly updateFocus: () => void,
        statusElementId: string | null
    ) {
        this.state = {
            isRunning: false,
            generation: 0,
            inputEpoch: 0,
            gamepads: {},
            currentControllerType: 'unknown',
            padInputStates: {},
            animationFrameId: null,
            statusElementId,
            onControllerConnect: null,
            onControllerDisconnect: null,
            onNavigationMenuOpen: null,
            onBackButton: null,
            onNavigationRequest: null,
            onButtonDown: undefined,
            onButtonUp: undefined,
            onError: undefined,
            onBeforeAction: undefined,
            onAction: undefined,
            customListeners: null,
            pendingSnapshots: [],
        };

        this.handleGamepadConnected = (event: GamepadEvent) => {
            handleConnected(this.state, event);
            // Resume the loop when the first controller connects after a pause.
            if (!this.state.isRunning && this.state.gameLoopFn) {
                startGameLoop(this.state, this.state.gameLoopFn, this.platform);
            }
        };
        this.handleGamepadDisconnected = (event: GamepadEvent) => {
            handleDisconnected(this.state, event);
            // Pause the loop when no controllers remain — saves ~60fps of idle CPU.
            if (Object.keys(this.state.gamepads).length === 0) {
                stopGameLoop(this.state, this.platform);
            }
        };
    }

    /** Attach native or custom-event connection listeners. */
    setupListeners(options: GamepadServiceOptions): void {
        setupEventListeners(
            this.state,
            this.handleGamepadConnected,
            this.handleGamepadDisconnected,
            this.platform,
            options
        );
    }

    /** Choose the native vs custom-event loop and start polling. */
    start(options: GamepadServiceOptions): void {
        this.state.generation = (this.state.generation ?? 0) + 1;
        if (options.useCustomEvents) {
            const customGameLoopFn = createCustomEventGameLoop(
                this.state,
                this.navState,
                this.platform,
                options.enableDualContext ? this.contextManager : undefined,
                this.updateFocus
            );
            this.state.gameLoopFn = customGameLoopFn;
            startGameLoop(this.state, customGameLoopFn, this.platform);
        } else {
            this.nativeGameLoopFn = createGameLoop(
                this.state,
                this.navState,
                this.platform,
                this.contextManager,
                this.updateFocus
            );
            this.state.gameLoopFn = this.nativeGameLoopFn;
            startGameLoop(this.state, this.nativeGameLoopFn, this.platform);
        }
    }

    /** Stop the polling loop and cancel any scheduled frame. */
    stop(): void {
        this.state.generation = (this.state.generation ?? 0) + 1;
        stopGameLoop(this.state, this.platform);
    }

    /** Remove both native and custom-event connection listeners. */
    teardownListeners(): void {
        removeEventListeners(this.state, this.handleGamepadConnected, this.handleGamepadDisconnected, this.platform);
    }

    /** Clear connected-pad and per-pad state, and drop the bridged input callbacks. */
    clearState(): void {
        this.state.gamepads = {};
        this.state.padInputStates = {};
        this.state.currentControllerType = 'unknown';
        this.state.onControllerConnect = null;
        this.state.onControllerDisconnect = null;
        this.state.onNavigationMenuOpen = null;
        this.state.onBackButton = null;
        this.state.onNavigationRequest = null;
        this.state.onButtonDown = undefined;
        this.state.onButtonUp = undefined;
        this.state.onError = undefined;
        this.state.onBeforeAction = undefined;
        this.state.onAction = undefined;
        this.state.pendingSnapshots = [];
    }

    /** Reset device state while preserving the service callback bridges and subscriptions. */
    resetInput(): void {
        this.state.inputEpoch = (this.state.inputEpoch ?? 0) + 1;
        this.state.gamepads = {};
        this.state.padInputStates = {};
        this.state.currentControllerType = 'unknown';
        this.state.pendingSnapshots = [];
    }

    getControllerType(): string {
        return this.state.currentControllerType;
    }

    getControllerTypes(): string[] {
        return getConnectedControllerTypes(this.state.gamepads);
    }

    isControllerConnected(): boolean {
        return Object.keys(this.state.gamepads).length > 0;
    }
}
