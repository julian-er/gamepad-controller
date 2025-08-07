# Gamepad Action Detection System

This document explains how the gamepad controller library detects and processes actions from gamepad controllers.

## Overview

The gamepad controller library uses the **Web Gamepad API** combined with a **continuous polling system** to detect and process gamepad inputs in real-time. The system operates at 60fps (or display refresh rate) using `requestAnimationFrame` to ensure responsive input handling.

## Architecture Flow

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

The system starts by setting up event listeners for gamepad connection/disconnection:

```typescript
// From: src/core/gamepadEventHandler.ts:42-50
export function setupEventListeners(
    state: GamepadEventState, 
    handleGamepadConnected: (event: GamepadEvent) => void,
    handleGamepadDisconnected: (event: GamepadEvent) => void
) {
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    
    // Check for already connected gamepads
    detectExistingGamepads(state);
}
```

### Connection Detection:
- **`gamepadconnected`**: Fired when a gamepad is connected
- **`gamepaddisconnected`**: Fired when a gamepad is disconnected
- **`detectExistingGamepads`**: Checks for gamepads already connected when the page loads

## 3. Continuous Game Loop - The Heart of Detection

The library uses `requestAnimationFrame` to create a continuous loop that polls gamepad states:

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
        const connectedGamepads = navigator.getGamepads();

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

### Game Loop Characteristics:
- **Frequency**: Runs at display refresh rate (typically 60fps)
- **Timing**: Uses `performance.now()` for precise timestamp tracking
- **Cleanup**: Properly manages animation frame IDs for cleanup
- **Validation**: Checks gamepad validity before processing

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

The gamepad action detection system is a sophisticated, real-time input processing system that:

1. **Leverages native browser APIs** for gamepad access
2. **Uses continuous polling** at display refresh rate
3. **Implements state tracking** for edge detection
4. **Provides debouncing** to prevent input spam
5. **Supports multiple controller types** with automatic detection
6. **Offers flexible callback system** for custom behaviors
7. **Maintains high performance** through efficient state management
8. **Ensures proper cleanup** to prevent memory leaks

This system enables responsive, cross-platform gamepad navigation for web applications while maintaining performance and providing a rich API for customization. 