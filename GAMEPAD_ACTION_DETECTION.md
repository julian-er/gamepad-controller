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

## 4. Button State Tracking & Detection

The library maintains previous button states and compares them with current states to detect press/release events:

```typescript
// From: src/core/gamepadEventHandler.ts:193-213
// --- Button event handling ---
if (!eventState.lastButtonStates) eventState.lastButtonStates = {};
if (!eventState.lastButtonStates[gp.index]) {
    eventState.lastButtonStates[gp.index] = gp.buttons.map(b => b.pressed);
}
const prevStates = eventState.lastButtonStates[gp.index];
for (let i = 0; i < gp.buttons.length; i++) {
    const prev = prevStates[i] || false;
    const curr = gp.buttons[i].pressed;
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
- **State Arrays**: Maintains `lastButtonStates` for each connected gamepad
- **Edge Detection**: Detects button press (`curr && !prev`) and release (`!curr && prev`)
- **Per-Gamepad Tracking**: Handles multiple controllers independently
- **Callback Triggering**: Calls `onButtonDown` and `onButtonUp` callbacks

## 5. Specific Action Button Detection

### Primary Action Button (A/X/Cross):
```typescript
// From: src/core/gamepadEventHandler.ts:220-227
// Handle primary action button (A/X/Cross)
const primaryButtonIndex = getPrimaryActionButtonIndex(eventState.currentControllerType as ControllerType);
if (gp.buttons[primaryButtonIndex] && gp.buttons[primaryButtonIndex].pressed) {
    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
        handleSelection(navState, contextManager);
        eventState.lastButtonPress = currentTimestamp;
    }
}
```

### Back Button (B/Circle):
```typescript
// From: src/core/gamepadEventHandler.ts:229-238
// Handle back button (B/Circle) - Button index 1
if (navState.options.enableBackButton) {
    const backPressed = gp.buttons[1]?.pressed || false;
    if (backPressed && !eventState.lastBackButtonState) {
        if (currentTimestamp - eventState.lastBackTime > 300) {
            handleBackButton(eventState.onBackButton);
            eventState.lastBackTime = currentTimestamp;
        }
    }
    eventState.lastBackButtonState = backPressed;
}
```

### Shoulder Buttons (R1/L1):
```typescript
// From: src/core/gamepadEventHandler.ts:240-259
// Handle shoulder buttons (R1/L1) - Button indices 5 and 4
if (navState.options.enableShoulderNavigation) {
    const r1Pressed = gp.buttons[5]?.pressed || false;
    const l1Pressed = gp.buttons[4]?.pressed || false;
    
    if (r1Pressed && !eventState.lastR1State) {
        if (currentTimestamp - eventState.lastShoulderTime > 300) {
            handleShoulderNavigation(navState, 'R1', contextManager, eventState.onNavigationMenuOpen);
            eventState.lastShoulderTime = currentTimestamp;
        }
    }
    
    if (l1Pressed && !eventState.lastL1State) {
        if (currentTimestamp - eventState.lastShoulderTime > 300) {
            handleShoulderNavigation(navState, 'L1', contextManager, eventState.onNavigationMenuOpen);
            eventState.lastShoulderTime = currentTimestamp;
        }
    }
    
    eventState.lastR1State = r1Pressed;
    eventState.lastL1State = l1Pressed;
}
```

## 6. Analog Stick Detection

```typescript
// From: src/core/gamepadEventHandler.ts:264-279
// Analog stick navigation
const leftStickX = applyDeadzone(gp.axes[0], navState.options.deadzone);
const leftStickY = applyDeadzone(gp.axes[1], navState.options.deadzone);

if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
    if (currentTimestamp - eventState.lastAxisMove > (navState.options.debounceTime ?? 0)) {
        if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
            handleNavigation(navState, leftStickX > 0 ? 'right' : 'left', contextManager, updateFocusCallback);
        } else {
            handleNavigation(navState, leftStickY > 0 ? 'down' : 'up', contextManager, updateFocusCallback);
        }
        moved = true;
        eventState.lastAxisMove = currentTimestamp;
    }
}
```

### Analog Stick Features:
- **Deadzone**: Ignores small movements to prevent drift
- **Direction Priority**: Determines primary movement direction based on magnitude
- **Axis Mapping**: `axes[0]` = X-axis, `axes[1]` = Y-axis
- **Timing**: Uses debounce to prevent rapid-fire navigation

## 7. D-pad Button Detection

```typescript
// From: src/core/gamepadEventHandler.ts:301-341
// D-pad navigation
const dpadIndices = getDpadIndices(eventState.currentControllerType as ControllerType);

if (gp.buttons[dpadIndices.up] && gp.buttons[dpadIndices.up].pressed) {
    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
        handleNavigation(navState, 'up', contextManager, updateFocusCallback);
        moved = true;
        eventState.lastButtonPress = currentTimestamp;
    }
}

if (gp.buttons[dpadIndices.down] && gp.buttons[dpadIndices.down].pressed) {
    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
        handleNavigation(navState, 'down', contextManager, updateFocusCallback);
        moved = true;
        eventState.lastButtonPress = currentTimestamp;
    }
}

if (gp.buttons[dpadIndices.left] && gp.buttons[dpadIndices.left].pressed) {
    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
        handleNavigation(navState, 'left', contextManager, updateFocusCallback);
        moved = true;
        eventState.lastButtonPress = currentTimestamp;
    }
}

if (gp.buttons[dpadIndices.right] && gp.buttons[dpadIndices.right].pressed) {
    if (currentTimestamp - eventState.lastButtonPress > (navState.options.debounceTime ?? 0)) {
        handleNavigation(navState, 'right', contextManager, updateFocusCallback);
        moved = true;
        eventState.lastButtonPress = currentTimestamp;
    }
}
```

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
            idPatterns: [
                /xbox/i,
                /microsoft/i,
                /x-input/i
            ]
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
            idPatterns: [
                /playstation/i,
                /dualsense/i,
                /dualshock/i,
                /ps3/i,
                /ps4/i,
                /ps5/i
            ]
        }
    }
    // ... more controller types
};
```

### Controller Detection:
- **Pattern Matching**: Uses regex patterns to identify controller types
- **Validation**: Checks minimum button/axis counts
- **Mapping**: Maps generic button indices to specific controller layouts

## 9. Debouncing & Timing System

### Timing Controls:
- **`debounceTime`**: General input debounce (default: 150ms)
- **`scrollDebounceTime`**: Scroll-specific debounce (default: 50ms)
- **Fixed timings**: Back button (300ms), shoulder buttons (300ms)

### Timestamp Tracking:
- **`lastButtonPress`**: Last general button press time
- **`lastAxisMove`**: Last analog stick movement time
- **`lastBackTime`**: Last back button press time
- **`lastShoulderTime`**: Last shoulder button press time
- **`lastScrollTime`**: Last scroll action time

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

### GamepadEventState Structure:
```typescript
interface GamepadEventState {
    isRunning: boolean;
    gamepads: { [key: string]: Gamepad };
    currentControllerType: string;
    lastButtonPress: number;
    lastAxisMove: number;
    lastBackButtonState: boolean;
    lastBackTime: number;
    lastR1State: boolean;
    lastL1State: boolean;
    lastShoulderTime: number;
    lastScrollTime: number;
    animationFrameId: number | null;
    statusElementId: string | null;
    // Callback functions...
    lastButtonStates?: { [gamepadIndex: number]: boolean[] };
}
```

### State Tracking Features:
- **Multi-gamepad support**: Tracks multiple controllers independently
- **Button state arrays**: Maintains previous button states for edge detection
- **Timing state**: Tracks last action times for debouncing
- **Controller metadata**: Stores controller type and connection status

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