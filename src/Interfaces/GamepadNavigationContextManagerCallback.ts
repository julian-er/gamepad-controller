// Callback para cambios de contexto en GamepadContextManager
import type { GamepadNavigationContext } from '../gamepadContextManager.js';

export interface GamepadContextManagerCallback {
    (newContext: GamepadNavigationContext, oldContext: GamepadNavigationContext | null): void;
} 