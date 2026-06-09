import { initCustomEventGamepad } from 'gamepad-controller';

/**
 * Custom-events / WinUI host-mode demo.
 *
 * `initCustomEventGamepad()` does NOT poll `navigator.getGamepads()`. Instead it
 * listens for DOM CustomEvents that a host (WinUI/WebView2, kiosk shell, native
 * wrapper) dispatches on `window`:
 *
 *   - hubgamepadconnected      → detail.gamepad
 *   - hubgamepadstatechanged   → detail.gamepad (latest button/axis snapshot)
 *   - hubgamepaddisconnected   → detail.gamepad
 *
 * `detail.gamepad` must be a standard-shaped snapshot: `{ index, id, mapping,
 * connected, buttons: [{ pressed }...], axes: [...] }`. The service stores the
 * snapshot and reads it each frame, so a host that wants continuous input just
 * keeps dispatching `hubgamepadstatechanged`.
 *
 * Here there is no real controller — the on-screen buttons play the role of the
 * host and dispatch these events for us.
 */

const logEl = document.getElementById('event-log')!;

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.insertBefore(entry, logEl.firstChild);
    while (logEl.children.length > 60) logEl.removeChild(logEl.lastChild!);
}

// Default custom event names (these match the library defaults; shown for clarity).
const CONNECTED = 'hubgamepadconnected';
const STATE_CHANGED = 'hubgamepadstatechanged';
const DISCONNECTED = 'hubgamepaddisconnected';

const gamepad = initCustomEventGamepad({
    containerSelector: '.custom-grid',
    navigationMode: 'spatial',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    statusElementId: 'gamepad-status',
    useDataAttributes: false,
    autoAddStyles: false,
    customConnectedEvent: CONNECTED,
    customStateChangedEvent: STATE_CHANGED,
    customDisconnectedEvent: DISCONNECTED,
});

// --- Build a standard-shaped gamepad snapshot the host would send ---------
const BUTTON_COUNT = 17; // standard mapping: 0..16 (incl. d-pad 12..15)

function makeSnapshot(pressedIndices: number[]): Gamepad {
    const buttons = Array.from({ length: BUTTON_COUNT }, (_, i) => {
        const pressed = pressedIndices.includes(i);
        return { pressed, touched: pressed, value: pressed ? 1 : 0 } as GamepadButton;
    });
    return {
        id: 'Mock WinUI Controller (STANDARD GAMEPAD Vendor-0000 Product-0000)',
        index: 0,
        connected: true,
        mapping: 'standard',
        timestamp: performance.now(),
        buttons,
        axes: [0, 0, 0, 0],
        vibrationActuator: null,
    } as unknown as Gamepad;
}

function dispatchHostEvent(type: string, pressedIndices: number[] = []) {
    window.dispatchEvent(new CustomEvent(type, { detail: { gamepad: makeSnapshot(pressedIndices) } }));
}

const BUTTON_LABELS: Record<number, string> = {
    0: 'A', 1: 'B', 4: 'L1', 5: 'R1', 12: 'D-Up', 13: 'D-Down', 14: 'D-Left', 15: 'D-Right',
};

let connected = false;

// A "tap": dispatch the button pressed, then release shortly after. The service
// reads the latest snapshot each animation frame, so the brief press is enough
// to register one navigation/selection (and a buttondown + buttonup edge).
function tapButton(index: number) {
    if (!connected) {
        log('Host not connected — dispatch hubgamepadconnected first.', 'error');
        return;
    }
    dispatchHostEvent(STATE_CHANGED, [index]);
    log(`📤 host → ${STATE_CHANGED} { ${BUTTON_LABELS[index] ?? `button ${index}`} pressed }`, 'info');
    setTimeout(() => dispatchHostEvent(STATE_CHANGED, []), 150);
}

// --- Wire host controls ---------------------------------------------------
document.getElementById('connect')?.addEventListener('click', () => {
    connected = true;
    dispatchHostEvent(CONNECTED);
    log(`📤 host → ${CONNECTED}`, 'success');
});

document.getElementById('disconnect')?.addEventListener('click', () => {
    if (!connected) return;
    connected = false;
    dispatchHostEvent(DISCONNECTED);
    log(`📤 host → ${DISCONNECTED}`, 'warning');
});

document.querySelectorAll<HTMLButtonElement>('[data-button]').forEach((btn) => {
    btn.addEventListener('click', () => tapButton(Number(btn.dataset.button)));
});

// --- Observe the service's reaction --------------------------------------
gamepad.on('controllerconnect', (gp) => log(`✅ service: controllerconnect — ${gp.id}`, 'success'));
gamepad.on('controllerdisconnect', () => log('🔌 service: controllerdisconnect', 'warning'));
gamepad.on('focus', (_el, index) => log(`🎯 service: focus → card ${index + 1}`, 'info'));
gamepad.on('select', (_el, index) => log(`✅ service: select → card ${index + 1}`, 'success'));
gamepad.on('backbutton', () => log('↩️ service: backbutton', 'warning'));
gamepad.on('buttondown', (index) => log(`⬇️ service: buttondown → ${BUTTON_LABELS[index] ?? index}`, 'info'));
gamepad.on('gamepaderror', (err) => log(`⚠️ service: gamepaderror — ${err.message}`, 'error'));

log('Ready. Connect the simulated host, then use the D-pad / A / B buttons.', 'info');

// Auto-connect so the demo is interactive immediately.
document.getElementById('connect')?.dispatchEvent(new MouseEvent('click'));

(window as any).gamepad = gamepad;
(window as any).dispatchHostEvent = dispatchHostEvent;
