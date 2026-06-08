// NavigationPolicy.ts
// Single home for the "emit if a consumer is subscribed, otherwise fall back to the browser"
// decision for the two navigation-side-effect events. This logic was previously duplicated
// between GamepadService's callback wiring and GamepadNavigationContext.select(); centralizing
// it keeps the fallback contract consistent and routes the browser side-effects through the
// injectable PlatformAdapter so they are deterministically testable.

import type { TypedEmitter } from './EventEmitter.js';
import type { PlatformAdapter } from './platform/PlatformAdapter.js';
import type { GamepadServiceEventMap } from './GamepadService.js';

export class NavigationPolicy {
    constructor(
        private readonly emitter: TypedEmitter<GamepadServiceEventMap>,
        private readonly platform: PlatformAdapter
    ) {}

    /**
     * Back/cancel request. Emits `backbutton` when a consumer is listening; otherwise falls
     * back to browser history (no-op outside a browser environment).
     */
    requestBack(): void {
        if (this.emitter.hasListeners('backbutton')) {
            this.emitter.emit('backbutton');
        } else if (this.platform.isBrowser) {
            this.platform.historyBack();
        }
    }

    /**
     * Link/page navigation request. Emits `navigationrequest` when a consumer is listening
     * (e.g. an SPA router intercepts it); otherwise assigns `window.location` so zero-config
     * static pages still navigate (no-op outside a browser environment).
     */
    requestNavigation(href: string, element: Element): void {
        if (this.emitter.hasListeners('navigationrequest')) {
            this.emitter.emit('navigationrequest', href, element);
        } else if (this.platform.isBrowser) {
            this.platform.assignLocation(href);
        }
    }
}
