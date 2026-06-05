# Gamepad Action Detection System

This document explains how the gamepad controller library detects and processes actions from gamepad controllers.

## Overview

The gamepad controller library supports **dual operation modes** for gamepad input detection:

1. **Native Browser Mode** (default): Uses the **Web Gamepad API** combined with a **continuous polling system** to detect and process gamepad inputs in real-time
2. **Custom Events Mode** (WinUI integration): Uses custom DOM events dispatched by the host application instead of native browser APIs

Both modes operate at 60fps (or display refresh rate) using `requestAnimationFrame` to ensure responsive input handling and maintain identical APIs for seamless integration.

## Architecture Flow

### Native Browser Mode
```
Browser Gamepad API
        ↓
Event Listener Setup (connect/disconnect)
        ↓
Continuous Game Loop (requestAnimationFrame)
        ↓
Button/Axis State Tracking
        ↓
State Comparison & Change Detection
        ↓
Debouncing & Timing Logic
        ↓
Action Mapping & Callbacks
        ↓
User-defined Behavior Execution
```

### Custom Events Mode (WinUI Integration)
```
Host Application (WinUI)
        ↓
Custom DOM Events (hubgamepad*)
        ↓
Custom Event Listener Setup
        ↓
Custom Game Loop (requestAnimationFrame)
        ↓
Event-based State Updates
        ↓
State Comparison & Change Detection
        ↓
Debouncing & Timing Logic
        ↓
Action Mapping & Callbacks
        ↓
User-defined Behavior Execution
```

## 0. Custom Events Mode (WinUI Integration)

For environments where native browser gamepad APIs are restricted (such as WinUI applications), the library supports a **custom events mode** that receives gamepad input through DOM events instead of browser APIs.

### Custom Event Types

The library listens for three types of custom events:

#### Connection Events
```typescript
// hubgamepadconnected - Controller connected
window.dispatchEvent(new CustomEvent('hubgamepadconnected', {
    detail: {
        gamepad: {
            index: 0,
            connected: true,
            timestamp: performance.now(),
            buttons: [/* button states */],
            axes: [/* axis values */]
        }
    }
}));
```

#### Disconnection Events
```typescript
// hubgamepaddisconnected - Controller disconnected
window.dispatchEvent(new CustomEvent('hubgamepaddisconnected', {
    detail: {
        gamepad: {
            index: 0,
            connected: false,
            timestamp: performance.now()
        }
    }
}));
```

#### State Change Events
```typescript
// hubgamepadstatechanged - Gamepad state updated
window.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {
    detail: {
        gamepad: {
            axes: [-0.1658, 0.0557, -0.0194, 0.0200],
            buttons: [
                { pressed: true, value: 1 },
                { pressed: false, value: 0 },
                // ... more buttons
            ],
            connected: true,
            index: 0,
            timestamp: 1753294113544
        }
    }
}));
```

### Custom Event Listener Setup

```typescript
// From: src/core/gamepadEventHandler.ts:52-84
export function setupCustomEventListeners(
    state: GamepadEventState,
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void,
    options: GamepadServiceOptions
) {
    const connectedEvent = options.customConnectedEvent || 'hubgamepadconnected';
    const disconnectedEvent = options.customDisconnectedEvent || 'hubgamepaddisconnected';
    const stateChangedEvent = options.customStateChangedEvent || 'hubgamepadstatechanged';

    // Listen for custom gamepad connected events
    window.addEventListener(connectedEvent, (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            const mockGamepadEvent = createMockGamepadEvent(customEvent.detail.gamepad);
            handleGamepadConnected(mockGamepadEvent);
        }
    });

    // Listen for custom gamepad state changed events
    window.addEventListener(stateChangedEvent, (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.gamepad) {
            const gamepad = customEvent.detail.gamepad;
            if (isValidGamepad(gamepad)) {
                state.gamepads[gamepad.index || 0] = gamepad;
            }
        }
    });
}
```

### Custom Event Game Loop

The custom events mode uses a separate game loop that processes gamepad state from the stored event data instead of polling `navigator.getGamepads()`:

```typescript
// From: src/core/gamepadEventHandler.ts:86-170
export function createCustomEventGameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    return function customEventGameLoopImpl(): void {
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }
        
        const currentTimestamp = performance.now();
        
        // Process gamepads from custom events (stored in eventState.gamepads)
        for (const gamepadIndex in eventState.gamepads) {
            const gp = eventState.gamepads[gamepadIndex];
            if (gp && isValidGamepad(gp)) {
                // Same button/axis processing logic as native mode
                // ... (processes buttons, analog sticks, D-pad, etc.)
            }
        }
        
        eventState.animationFrameId = requestAnimationFrame(customEventGameLoopImpl);
    };
}
```

### Event-to-API Compatibility

The custom events mode maintains full compatibility with native browser APIs by:

1. **Mock GamepadEvent Creation**: Converting custom events to standard `GamepadEvent` objects
2. **State Storage**: Storing gamepad state from events in `eventState.gamepads`
3. **Identical Processing**: Using the same button/axis processing logic as native mode
4. **Same Callbacks**: Triggering the same callback functions as native mode

### Configuration Options

```typescript
interface GamepadServiceOptions {
    // Custom Events Support
    useCustomEvents?: boolean;           // Enable custom events mode
    customConnectedEvent?: string;       // Connection event name (default: 'hubgamepadconnected')
    customDisconnectedEvent?: string;    // Disconnection event name (default: 'hubgamepaddisconnected')
    customStateChangedEvent?: string;    // State change event name (default: 'hubgamepadstatechanged')
}
```

### Usage Example

```typescript
import { initCustomEventGamepad } from 'gamepad-controller';

// Initialize with custom events
const gamepad = initCustomEventGamepad({
    enableNavigation: true,
    enableBackButton: true,
    focusedClass: 'gamepad-focused'
});

// Same callback API as native mode
gamepad.onSelect = (element, index) => {
    console.log('Selected:', element.textContent);
};

gamepad.onControllerConnect = (gamepad) => {
    console.log('Controller connected via custom events');
};
```

## 1. Browser API Foundation

The library leverages the native Web Gamepad API provided by modern browsers:

```typescript
// Core Browser APIs used:
navigator.getGamepads()           // Get current gamepad states
window.addEventListener('gamepadconnected', ...)    // Connection events
window.addEventListener('gamepaddisconnected', ...) // Disconnection events
```

### Key Browser API Objects:
- **`Gamepad` object**: Contains buttons array, axes array, and metadata
- **`GamepadButton` object**: Has `pressed` (boolean) and `value` (0-1) properties
- **Axes values**: Float values typically ranging from -1 to 1

## 2. Event Listener Setup

The system sets up event listeners based on the operation mode:

### Native Browser Mode

```typescript
// From: src/core/gamepadEventHandler.ts:42-50
export function setupEventListeners(
    state: GamepadEventState, 
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void,
    options?: GamepadServiceOptions
) {
    if (options?.useCustomEvents) {
        setupCustomEventListeners(state, handleGamepadConnected, handleGamepadDisconnected, options);
    } else {
        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
        
        // Check for already connected gamepads
        detectExistingGamepads(state);
    }
}
```

### Connection Detection (Native Mode):
- **`gamepadconnected`**: Fired when a gamepad is connected
- **`gamepaddisconnected`**: Fired when a gamepad is disconnected
- **`detectExistingGamepads`**: Checks for gamepads already connected when the page loads

### Connection Detection (Custom Events Mode):
- **Custom connected event**: Listens for WinUI-dispatched connection events
- **Custom disconnected event**: Listens for WinUI-dispatched disconnection events
- **Custom state change event**: Receives gamepad state updates from host application

## 3. Continuous Game Loop - The Heart of Detection

The library uses `requestAnimationFrame` to create a continuous loop that processes gamepad inputs. The implementation varies based on the operation mode:

### Native Browser Mode Game Loop

```typescript
// From: src/core/gamepadEventHandler.ts:172-186
export function gameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    return function gameLoopImpl() {
        // Check if loop should continue running
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();
        const connectedGamepads = navigator.getGamepads(); // Polls browser API

        for (const gp of connectedGamepads) {
            if (gp && isValidGamepad(gp)) {
                // Process gamepad inputs...
            }
        }

        // Schedule next frame and store the ID for cleanup
        eventState.animationFrameId = requestAnimationFrame(gameLoopImpl);
    };
}
```

### Custom Events Mode Game Loop

```typescript
// From: src/core/gamepadEventHandler.ts:86-170
export function createCustomEventGameLoop(
    eventState: GamepadEventState, 
    navState: NavigationState,
    contextManager?: any,
    updateFocusCallback?: () => void
): () => void {
    return function customEventGameLoopImpl() {
        if (!eventState.isRunning) {
            eventState.animationFrameId = null;
            return;
        }

        const currentTimestamp = performance.now();
        
        // Process gamepads from custom events (stored in eventState.gamepads)
        for (const gamepadIndex in eventState.gamepads) {
            const gp = eventState.gamepads[gamepadIndex]; // Uses event-stored state
            if (gp && isValidGamepad(gp)) {
                // Process gamepad inputs... (same logic as native mode)
            }
        }

        eventState.animationFrameId = requestAnimationFrame(customEventGameLoopImpl);
    };
}
```

### Game Loop Characteristics (Both Modes):
- **Frequency**: Runs at display refresh rate (typically 60fps)
- **Timing**: Uses `performance.now()` for precise timestamp tracking
- **Cleanup**: Properly manages animation frame IDs for cleanup
- **Validation**: Checks gamepad validity before processing
- **Input Source**: Native mode polls `navigator.getGamepads()`, custom events mode uses stored event data
- **Processing Logic**: Identical button/axis processing logic regardless of input source
- **All controllers processed**: Both loops process **every** valid controller each frame (not just the first), so any connected pad can drive the shared navigation cursor. Per-pad state in `processGamepad` keeps them from interfering. The native loop also prunes pads that disappear from `getGamepads()` (e.g. a missed disconnect event)

## 4. Button State Tracking & Detection

The library maintains previous button states and compares them with current states to detect press/release events:

```typescript
// From: src/core/gamepadEventHandler.ts (processGamepad)
// Per-pad state is fetched once per frame; `pad.lastButtonStates` holds the
// previous frame's pressed state for this specific controller.
const pad = getPadState(eventState, gp); // creates+seeds on first use
const prevStates = pad.lastButtonStates;
for (let i = 0; i < gp.buttons.length; i++) {
    const prev = prevStates[i] || false;
    const curr = gp.buttons[i]?.pressed ?? false;
    if (curr && !prev && typeof eventState.onButtonDown === 'function') {
        eventState.onButtonDown(i, gp);
    }
    if (!curr && prev && typeof eventState.onButtonUp === 'function') {
        eventState.onButtonUp(i, gp);
    }
    prevStates[i] = curr;
}
```

### Button Detection Logic:
- **Per-pad state**: Each controller's previous button states live in `pad.lastButtonStates` (under `eventState.padInputStates[gp.index]`)
- **Edge Detection**: Detects button press (`curr && !prev`) and release (`!curr && prev`)
- **Per-Gamepad Tracking**: Handles multiple controllers independently — no cross-pad clobbering
- **Seeded on connect**: New pads are seeded from the current frame so a button already held at connect time doesn't fire a spurious down-edge
- **Callback Triggering**: Calls `onButtonDown` and `onButtonUp` callbacks

## 5. Specific Action Button Detection

All of these read and write the **per-pad** state record (`pad`) rather than global
`eventState` fields, and resolve button indices from each pad's own detected `controllerType`.

### Primary Action Button (A/X/Cross):
```typescript
// From: src/core/gamepadEventHandler.ts (processGamepad)
const controllerType = detectControllerType(gp) as ControllerType;
const primaryButtonIndex = getPrimaryActionButtonIndex(controllerType);
if (gp.buttons[primaryButtonIndex]?.pressed) {
    if (currentTimestamp - pad.lastButtonPress > debounceTime) {
        handleSelection(navState, contextManager);
        pad.lastButtonPress = currentTimestamp;
    }
}
```

### Back Button (B/Circle):
```typescript
// From: src/core/gamepadEventHandler.ts (processGamepad)
if (options.enableBackButton) {
    const backCooldown = options.backButtonCooldown ?? DEFAULT_ACTION_COOLDOWN;
    const backIndex = getBackButtonIndex(controllerType);
    const backPressed = gp.buttons[backIndex]?.pressed ?? false;
    if (backPressed && !pad.lastBackButtonState) {
        if (currentTimestamp - pad.lastBackTime > backCooldown) {
            handleBackButton(eventState.onBackButton);
            pad.lastBackTime = currentTimestamp;
        }
    }
    pad.lastBackButtonState = backPressed;
}
```

### Shoulder Buttons (R1/L1):
```typescript
// From: src/core/gamepadEventHandler.ts (processGamepad)
if (options.enableShoulderNavigation) {
    const shoulderCooldown = options.shoulderCooldown ?? DEFAULT_ACTION_COOLDOWN;
    const { l1, r1 } = getShoulderIndices(controllerType);
    const r1Pressed = gp.buttons[r1]?.pressed ?? false;
    const l1Pressed = gp.buttons[l1]?.pressed ?? false;

    const r1Edge = r1Pressed && !pad.lastR1State;
    const l1Edge = l1Pressed && !pad.lastL1State;
    if (r1Edge || l1Edge) {
        if (currentTimestamp - pad.lastShoulderTime > shoulderCooldown) {
            const button = r1Edge ? 'R1' : 'L1'; // r1 wins if both fire same frame
            handleShoulderNavigation(navState, button, contextManager, eventState.onNavigationMenuOpen);
            pad.lastShoulderTime = currentTimestamp;
        }
    }

    pad.lastR1State = r1Pressed;
    pad.lastL1State = l1Pressed;
}
```

> Button indices (back, shoulders, D-pad) are resolved through the mapping table via
> `getBackButtonIndex`/`getShoulderIndices`/`getDpadIndices` for each pad's `controllerType`,
> and back/shoulder cooldowns are configurable (`backButtonCooldown`, `shoulderCooldown`,
> default `DEFAULT_ACTION_COOLDOWN`) rather than the old hard-coded `300`.

## 6 & 7. Directional Navigation (D-pad priority, left stick fallback)

D-pad and left-stick navigation are unified into a single per-pad directional step gated by one
`pad.lastAxisMove` cooldown. The D-pad takes priority; the left stick is the fallback when no
D-pad direction is pressed.

```typescript
// From: src/core/gamepadEventHandler.ts (processGamepad)
if (currentTimestamp - pad.lastAxisMove > debounceTime) {
    const dpad = getDpadIndices(controllerType);
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;

    // D-pad takes priority
    if (gp.buttons[dpad.up]?.pressed) direction = 'up';
    else if (gp.buttons[dpad.down]?.pressed) direction = 'down';
    else if (gp.buttons[dpad.left]?.pressed) direction = 'left';
    else if (gp.buttons[dpad.right]?.pressed) direction = 'right';
    else {
        // Left stick fallback — pick the dominant axis
        const x = applyDeadzone(gp.axes[0] ?? 0, options.deadzone);
        const y = applyDeadzone(gp.axes[1] ?? 0, options.deadzone);
        if (Math.abs(x) > 0 || Math.abs(y) > 0) {
            direction = Math.abs(x) > Math.abs(y)
                ? (x > 0 ? 'right' : 'left')
                : (y > 0 ? 'down' : 'up');
        }
    }

    if (direction) {
        handleNavigation(navState, direction, contextManager, updateFocusCallback);
        pad.lastAxisMove = currentTimestamp;
        hadInput = true;
    }
}
```

### Directional Navigation Features:
- **D-pad priority, stick fallback**: a single resolved `direction` per frame, not four independent blocks
- **Deadzone**: Ignores small stick movements to prevent drift (`axes[0]` = X, `axes[1]` = Y)
- **Direction Priority**: Stick picks the dominant axis by magnitude
- **Per-pad timing**: `pad.lastAxisMove` debounces this controller independently of others

## 8. Controller Type Detection & Button Mapping

The library supports multiple controller types with different button mappings:

```typescript
// From: src/controllerMappings.ts:5-48
export const CONTROLLER_MAPPINGS: ControllerMappings = {
    xbox: {
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT',
            'Back', 'Start', 'LS', 'RS', 'D-Up', 'D-Down',
            'D-Left', 'D-Right', 'Xbox'
        ],
        axes: [
            'Left Stick X', 'Left Stick Y',
            'Right Stick X', 'Right Stick Y'
        ],
        validation: {
            minButtons: 16,
            minAxes: 4,
            // Vendor-ID fallback (045e = Microsoft) for browsers that don't put
            // "xbox" in the id. The minButtons/minAxes gate keeps non-controller
            // 045e devices (headsets, keyboards) from matching.
            idPatterns: [/xbox/i, /microsoft/i, /x-?input/i, /045e/i]
        }
    },
    playstation: {
        buttons: [
            'Cross', 'Circle', 'Square', 'Triangle',
            'L1', 'R1', 'L2', 'R2',
            'Share', 'Options', 'L3', 'R3',
            'D-Up', 'D-Down', 'D-Left', 'D-Right',
            'PS'
        ],
        axes: [
            'Left Stick X', 'Left Stick Y',
            'Right Stick X', 'Right Stick Y'
        ],
        validation: {
            minButtons: 16,
            minAxes: 4,
            // Vendor-ID fallback (054c = Sony) — Chrome reports a DualShock/DualSense
            // as "Wireless Controller (... Vendor: 054c ...)" with no readable name.
            idPatterns: [/playstation/i, /dualsense/i, /dualshock/i, /ps3/i, /ps4/i, /ps5/i, /054c/i]
        }
    },
    nintendo: {
        // ...
        validation: {
            minButtons: 16,
            minAxes: 4,
            // Vendor-ID fallback (057e = Nintendo) for Switch Pro Controller / Joy-Con.
            idPatterns: [/nintendo/i, /switch/i, /pro controller/i, /057e/i]
        }
    }
    // ... more controller types
};
```

### Controller Detection:
- **Pattern Matching**: Uses regex patterns to identify controller types
- **Vendor-ID fallbacks**: Matches USB vendor codes (`045e` Microsoft, `054c` Sony, `057e` Nintendo) when the browser doesn't expose a readable controller name
- **Validation**: Checks minimum button/axis counts (also gates out non-controller devices sharing a vendor ID)
- **Mapping**: Maps generic button indices to specific controller layouts
- **Per-pad**: Each connected controller is detected and mapped by its own type (so Nintendo's swapped A/B is honored even alongside an Xbox pad), via `getConnectedControllerTypes()`

## 9. Debouncing & Timing System

### Timing Controls:
- **`debounceTime`**: General input debounce (default: 150ms)
- **`scrollDebounceTime`**: Scroll-specific debounce (default: 50ms)
- **`backButtonCooldown`** / **`shoulderCooldown`**: Configurable cooldowns (default: `DEFAULT_ACTION_COOLDOWN`), replacing the old hard-coded 300ms

### Timestamp Tracking (per-pad, on `PadInputState`):
Each connected controller has its own copy of these timers under `eventState.padInputStates[gp.index]`:

- **`lastButtonPress`**: Last primary-button (A/X/Cross) selection time
- **`lastAxisMove`**: Last directional navigation time (D-pad or stick)
- **`lastBackTime`**: Last back button activation time
- **`lastShoulderTime`**: Last shoulder button activation time
- **`lastScrollTime`**: Last right-stick scroll step time

## 10. Event Callbacks System

The library provides multiple callback points for different types of events:

### Raw Input Callbacks:
- **`onButtonDown(buttonIndex, gamepad)`**: Any button press
- **`onButtonUp(buttonIndex, gamepad)`**: Any button release

### Action-Specific Callbacks:
- **`onSelect(element, index)`**: Primary action button (A/X/Cross)
- **`onFocus(element, index)`**: Navigation focus changes
- **`onBackButton()`**: Back button presses
- **`onNavigationMenuOpen(button)`**: Shoulder button presses

### Connection Callbacks:
- **`onControllerConnect(gamepad)`**: Controller connected
- **`onControllerDisconnect(gamepad)`**: Controller disconnected

## 11. State Management

### Per-Gamepad Input State

All edge-detection flags and cooldown timestamps are tracked **per controller** (keyed by
`gamepad.index`), not globally. This lets multiple controllers drive the same shared navigation
cursor in the same frame without clobbering one another — for example, an idle pad can't reset
the active pad's back-button edge.

```typescript
// From: src/Interfaces/GamepadEvents.ts
interface PadInputState {
    lastButtonPress: number;     // last primary-button (A/Cross/X) selection
    lastAxisMove: number;        // last directional navigation move
    lastBackButtonState: boolean;// back button pressed on the previous frame
    lastBackTime: number;        // last back-button activation (cooldown)
    lastR1State: boolean;        // R1 pressed on the previous frame
    lastL1State: boolean;        // L1 pressed on the previous frame
    lastShoulderTime: number;    // last shoulder activation (cooldown)
    lastScrollTime: number;      // last right-stick scroll step
    lastButtonStates: boolean[]; // per-button pressed state (onButtonDown/Up edges)
}
```

### GamepadEventState Structure:
```typescript
interface GamepadEventState {
    isRunning: boolean;
    gamepads: { [key: string]: Gamepad };
    // Type of the most-recently-active controller (for status / getControllerType back-compat).
    currentControllerType: string;
    // Per-gamepad input edge/cooldown state, keyed by gamepad.index.
    padInputStates: { [gamepadIndex: number]: PadInputState };
    animationFrameId: number | null;
    statusElementId: string | null;
    // Callback functions...
}
```

### State Tracking Features:
- **Multi-gamepad support**: Tracks each controller's input state independently in `padInputStates`
- **Button state arrays**: Maintains per-pad previous button states for edge detection
- **Timing state**: Tracks per-pad last action times for debouncing/cooldowns
- **Most-recently-active**: `currentControllerType` reflects the last pad the user touched; pads are pruned when they disappear from the live set

## 12. Performance Considerations

### Optimization Techniques:
- **Efficient polling**: Only processes connected, valid gamepads
- **State caching**: Avoids unnecessary state updates
- **Debouncing**: Prevents excessive event firing
- **Memory management**: Proper cleanup of animation frames and event listeners

### Resource Management:
- **Animation frame cleanup**: Cancels frames when stopping
- **Event listener cleanup**: Removes listeners on destroy
- **State clearing**: Clears gamepad references and callbacks

## 13. Cross-Platform Compatibility

### Supported Controllers:
- **Xbox controllers**: Xbox One, Xbox Series X/S, Xbox 360
- **PlayStation controllers**: DualShock 4, DualSense (PS5)
- **Generic controllers**: Standard gamepad layouts
- **Custom mappings**: Extensible controller mapping system

### Browser Support:
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Feature detection**: Graceful fallback for unsupported browsers
- **Polyfill ready**: Can work with gamepad polyfills

## 14. Usage Examples

### Basic Setup:
```typescript
import { GamepadService } from 'gamepad-controller';

const gamepadService = new GamepadService({
    containerSelector: '.my-container',
    debounceTime: 150,
    deadzone: 0.1
});

// Set up callbacks
gamepadService.onSelect = (element, index) => {
    console.log('Selected:', element.textContent);
};

gamepadService.onButtonDown = (buttonIndex, gamepad) => {
    console.log(`Button ${buttonIndex} pressed on ${gamepad.id}`);
};

gamepadService.init();
```

### Advanced Configuration:
```typescript
const gamepadService = new GamepadService({
    containerSelector: '.game-area',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    debounceTime: 100,
    deadzone: 0.15,
    enableBackButton: true,
    enableShoulderNavigation: true,
    enableRightStickScroll: true,
    scrollSpeed: 2,
    scrollDebounceTime: 30
});
```

## Summary

The gamepad action detection system is a sophisticated, real-time input processing system that supports **dual operation modes**:

### Native Browser Mode
1. **Leverages native browser APIs** (`navigator.getGamepads()`, connection events)
2. **Uses continuous polling** at display refresh rate
3. **Automatic controller detection** and existing gamepad discovery

### Custom Events Mode (WinUI Integration)
1. **Listens to custom DOM events** dispatched by host applications
2. **Event-driven state updates** instead of API polling
3. **Full API compatibility** with native mode

### Shared Characteristics (Both Modes)
1. **Implements state tracking** for edge detection
2. **Provides debouncing** to prevent input spam
3. **Supports multiple controller types** with automatic detection
4. **Offers flexible callback system** for custom behaviors
5. **Maintains high performance** through efficient state management
6. **Ensures proper cleanup** to prevent memory leaks
7. **Identical processing logic** for buttons, axes, and navigation
8. **Same callback API** regardless of input source

### Benefits
- **Environment Flexibility**: Works in standard browsers and restricted environments like WinUI
- **Seamless Migration**: Switch between modes with minimal code changes
- **API Consistency**: Same interfaces and callbacks across all modes
- **Performance**: Optimized for both polling and event-driven architectures

This dual-mode system enables responsive, cross-platform gamepad navigation for web applications in any environment while maintaining performance and providing a rich, consistent API for customization. 