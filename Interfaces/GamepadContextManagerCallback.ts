// Callback para cambios de contexto en GamepadContextManager
import type { GamepadNavigationContext } from '../typescript/gamepadContextManager.js';

export interface GamepadContextManagerCallback {
    (newContext: GamepadNavigationContext, oldContext: GamepadNavigationContext | null): void;
}