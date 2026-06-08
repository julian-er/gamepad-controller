// StatusReporter.ts
// Owns the on-screen status-indicator lifecycle: ensuring the element exists (either an
// explicitly-provided id or an auto-created default) and syncing the resolved id back into the
// options and event state so the runtime's per-frame status updates target it. Extracted from
// GamepadService.init() to keep status wiring out of the lifecycle orchestrator.

import { ensureStatusElement } from '../utils/domUtils.js';
import type { GamepadServiceOptions } from '../interfaces/GamepadServiceOptions.js';
import type { GamepadEventState } from '../interfaces/GamepadEvents.js';

/** Default id used when `autoCreateStatusElement` is enabled without an explicit id. */
const DEFAULT_STATUS_ELEMENT_ID = 'gamepad-status';

export class StatusReporter {
    constructor(private readonly eventState: GamepadEventState) {}

    /**
     * Ensures the status element exists for this session. With an explicit `statusElementId`
     * the element is created/reused as-is. With `autoCreateStatusElement` (and no explicit id)
     * a default element is created and its id written back into `options` and the event state
     * so later status updates resolve to it.
     */
    setup(options: GamepadServiceOptions): void {
        if (options.statusElementId) {
            ensureStatusElement(options.statusElementId);
        } else if (options.autoCreateStatusElement) {
            options.statusElementId = DEFAULT_STATUS_ELEMENT_ID;
            this.eventState.statusElementId = DEFAULT_STATUS_ELEMENT_ID;
            ensureStatusElement(DEFAULT_STATUS_ELEMENT_ID);
        }
    }
}
