import type { DemoId } from './registry';
export const learning: Record<
    DemoId,
    { explanation: string; experiment: string; topics: { id: string; label: string }[] }
> = {
    'treasure-tiles': {
        explanation:
            'Spatial navigation chooses among native tile buttons. A primary press reveals once; the component guards repeated reveals and owns the win state. beforeaction cancels Back synchronously before the host starts a new round.',
        experiment:
            'Hold Select on one tile, release, and reveal another. Compare the reveal count, then press Back to reset.',
        topics: [
            { id: 'navigation', label: 'Spatial navigation' },
            { id: 'events', label: 'Cancellable actions' },
        ],
    },
    'film-catalog': {
        explanation:
            'DemoDialog opens a native modal, refreshes committed targets and applies setActiveScope(). Closing restores background eligibility before clearActiveScope() and opener focus. Saved films remain application state.',
        experiment:
            'Open details, save a film, play the local preview, and return. Remove its poster in the focus experiment before closing to try the fallback.',
        topics: [
            { id: 'navigation', label: 'Modal scope and focus' },
            { id: 'api', label: 'Public service methods' },
        ],
    },
    portfolio: {
        explanation:
            'Semantic links share local view changes across pointer, keyboard and gamepad. beforeaction cancels default link navigation before the application activates its local case study, keeping the documentation route intact.',
        experiment:
            'Open each case study, then use its return link or Back. Resize the page and try the same spatial navigation.',
        topics: [
            { id: 'events', label: 'Action cancellation' },
            { id: 'navigation', label: 'Responsive spatial targets' },
        ],
    },
    'focus-timer': {
        explanation:
            'Horizontal navigation reaches duration presets and timer controls. The app owns a deadline-based timer and pauses it on Stop, blur or page hiding. A native settings dialog reuses the explicit scope helper; the service is not recreated on timer ticks.',
        experiment:
            'Choose the 10-second demo, start the timer, pause it, and resume. Stop controller input during a countdown and inspect the paused value.',
        topics: [
            { id: 'lifecycle', label: 'Lifecycle and teardown' },
            { id: 'navigation', label: 'Navigation and scopes' },
        ],
    },
    'recipe-browser': {
        explanation:
            'setElements() receives the ordered controls after a filter or detail view commits. Existing nodes remain registered through ordinary state changes. Right-stick snapshots scroll the configured app viewport through the public service; releases return axes to zero.',
        experiment:
            'Choose Desserts to reach the empty state, recover with All, then open a recipe. Hold Scroll down and release: the app viewport moves while the documentation stays in place.',
        topics: [
            { id: 'api', label: 'Manual targets and refresh' },
            { id: 'host-bridge', label: 'Complete input snapshots' },
        ],
    },
    'product-explorer': {
        explanation:
            'Feature tabs change local content while preserving eligible focus. A product preview uses the shared native dialog and explicit scope. Pointer clicks and controller Select activate the same semantic buttons.',
        experiment:
            'Switch features, open the product preview, and close with Back. Try a pointer click followed by directional input to observe focus handoff.',
        topics: [
            { id: 'navigation', label: 'Spatial navigation and scope' },
            { id: 'events', label: 'Selection events' },
        ],
    },
    'plan-chooser': {
        explanation:
            'Plan selection and billing changes are local application state. Link actions cancel synchronously before local navigation; no checkout or external account is involved. Pricing explanation dialogs restore focus to their opener.',
        experiment:
            'Change billing frequency, inspect a pricing explanation, and choose a plan. Return to comparison and confirm the docs route remains unchanged.',
        topics: [
            { id: 'events', label: 'Application-owned routing' },
            { id: 'navigation', label: 'Eligibility and focus return' },
        ],
    },
    'quiz-night': {
        explanation:
            'The application locks each answered question and counts its score once. setElements() registers the next committed question in order, refresh() rechecks eligibility, and native focus moves to Next when the choices lock.',
        experiment:
            'Hold Select after answering. The score changes once and the next question waits for a fresh press. Complete all three and restart.',
        topics: [
            { id: 'api', label: 'Ordered targets and refresh' },
            { id: 'events', label: 'Press and release semantics' },
        ],
    },
};
