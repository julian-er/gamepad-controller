import type { GamepadActionEvent } from '../interfaces/GamepadServiceOptions.js';
import type { GamepadEventState } from '../interfaces/GamepadEvents.js';

/** Central synchronous action contract: request, freshness check, effect, then completion. */
export class ActionDispatcher {
    static dispatch(
        state: GamepadEventState,
        type: GamepadActionEvent['type'],
        gamepad: Gamepad,
        target: Element | null,
        effect: () => boolean,
        direction?: GamepadActionEvent['direction'],
        button?: string
    ): boolean {
        const generation = state.generation;
        const epoch = state.inputEpoch;
        const action = this.action(type, gamepad, target, direction, button);
        if (state.onBeforeAction && !state.onBeforeAction(action)) return false;
        if (
            action.defaultPrevented ||
            !state.isRunning ||
            state.generation !== generation ||
            state.inputEpoch !== epoch
        )
            return false;
        let completed: boolean;
        try {
            completed = effect();
        } catch (cause) {
            state.onError?.(cause instanceof Error ? cause : new Error(String(cause)));
            return false;
        }
        if (!completed) return false;
        if (!state.isRunning || state.generation !== generation || state.inputEpoch !== epoch) return false;
        state.onAction?.(this.action(type, gamepad, target, direction, button));
        return true;
    }

    private static action(
        type: GamepadActionEvent['type'],
        gamepad: Gamepad,
        target: Element | null,
        direction?: GamepadActionEvent['direction'],
        button?: string
    ): GamepadActionEvent {
        const action: GamepadActionEvent = {
            type,
            gamepad,
            target,
            direction,
            button,
            defaultPrevented: false,
            preventDefault: () => {
                action.defaultPrevented = true;
            },
        };
        return action;
    }
}
