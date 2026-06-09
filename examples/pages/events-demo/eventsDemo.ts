import { GamepadService } from 'gamepad-controller';

/**
 * Multi-subscriber events demo.
 *
 * Showcases the new `service.on(event, listener)` API, which returns an
 * unsubscribe function and supports many independent subscribers per event —
 * a replacement for the old single, clobber-prone callback properties.
 */

const logEl = document.getElementById('event-log')!;
const subListEl = document.getElementById('sub-list')!;
const subCountEl = document.getElementById('sub-count')!;

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.insertBefore(entry, logEl.firstChild);
    while (logEl.children.length > 60) logEl.removeChild(logEl.lastChild!);
}

// Options can be passed in the new grouped shape (flat options also still work).
const gamepad = new GamepadService({
    navigation: { containerSelector: '.events-grid', navigationMode: 'spatial' },
    styling: { focusedClass: 'gamepad-focused', selectedClass: 'gamepad-selected', useDataAttributes: false },
    status: { statusElementId: 'gamepad-status' },
});

// --- Subscriber registry --------------------------------------------------
type EventKind = 'focus' | 'select' | 'buttondown';
interface Subscription {
    id: number;
    kind: EventKind;
    unsubscribe: () => void;
}

const subscriptions: Subscription[] = [];
let nextId = 1;

function nameOf(element: Element): string {
    return (element as HTMLElement).dataset.name || element.textContent?.trim().slice(0, 20) || 'element';
}

function addSubscriber(kind: EventKind) {
    const id = nextId++;

    // Each subscriber is an independent listener. Several of the same kind can
    // coexist — they all fire, in registration order.
    let unsubscribe: () => void;
    if (kind === 'focus') {
        unsubscribe = gamepad.on('focus', (el, index) => {
            log(`focus  →  subscriber #${id} saw "${nameOf(el)}" (index ${index})`, 'info');
        });
    } else if (kind === 'select') {
        unsubscribe = gamepad.on('select', (el, index) => {
            log(`select →  subscriber #${id} saw "${nameOf(el)}" (index ${index})`, 'success');
        });
    } else {
        unsubscribe = gamepad.on('buttondown', (buttonIndex) => {
            log(`buttondown → subscriber #${id} saw button ${buttonIndex}`, 'warning');
        });
    }

    subscriptions.push({ id, kind, unsubscribe });
    renderSubscriptions();
    log(`➕ Added subscriber #${id} for "${kind}"`, 'info');
}

function removeSubscription(target: Subscription) {
    target.unsubscribe(); // returned by .on() — detaches just this listener
    const i = subscriptions.indexOf(target);
    if (i >= 0) subscriptions.splice(i, 1);
    renderSubscriptions();
    log(`➖ Removed subscriber #${target.id} ("${target.kind}")`, 'warning');
}

function renderSubscriptions() {
    subCountEl.textContent = String(subscriptions.length);
    subListEl.innerHTML = '';
    for (const sub of subscriptions) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="sub-tag sub-${sub.kind}">${sub.kind}</span> subscriber #${sub.id}`;
        const btn = document.createElement('button');
        btn.textContent = 'remove';
        btn.className = 'sub-remove';
        btn.addEventListener('click', () => removeSubscription(sub));
        li.appendChild(btn);
        subListEl.appendChild(li);
    }
}

// --- Wire up controls -----------------------------------------------------
document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => addSubscriber(btn.dataset.add as EventKind));
});

document.getElementById('remove-last')?.addEventListener('click', () => {
    const last = subscriptions[subscriptions.length - 1];
    if (last) removeSubscription(last);
    else log('No subscribers to remove', 'error');
});

document.getElementById('remove-all')?.addEventListener('click', () => {
    if (!subscriptions.length) return log('No subscribers to remove', 'error');
    [...subscriptions].forEach(removeSubscription);
});

// Mouse clicks also trigger select-like feedback so the demo works without a controller.
document.querySelectorAll('.events-grid .card').forEach((card) => {
    card.addEventListener('click', () => log(`🖱️ Clicked "${nameOf(card)}" (gamepad select fires the same listeners)`, 'info'));
});

// Connection lifecycle (single subscribers — these are not part of the add/remove demo).
gamepad.on('controllerconnect', (gp) => log(`🎮 Controller connected: ${gp.id}`, 'success'));
gamepad.on('controllerdisconnect', (gp) => log(`🎮 Controller disconnected: ${gp.id}`, 'warning'));

// Surfaced when the Gamepad API is blocked (e.g. Permissions-Policy: gamepad). The library
// keeps the loop alive and emits this once instead of crashing.
gamepad.on('gamepaderror', (err) => log(`⚠️ Gamepad API blocked: ${err.message}`, 'error'));

gamepad.init();

// Seed the demo with one subscriber of each kind so output is visible immediately.
addSubscriber('focus');
addSubscriber('select');

log('Ready. Add/remove subscribers above, then navigate the grid with a controller.', 'info');
log('Tip: add two "focus" subscribers — both fire on every focus change.', 'info');

(window as any).gamepad = gamepad;
