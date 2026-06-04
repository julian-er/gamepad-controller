// Callback fired on context changes in GamepadContextManager.
import type { GamepadNavigationContext } from '../gamepadContextManager.js';

export interface GamepadContextManagerCallback {
    (newContext: GamepadNavigationContext, oldContext: GamepadNavigationContext | null): void;
}
