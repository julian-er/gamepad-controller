# Gamepad Service Methods Documentation

## Overview

The gamepad controller library provides multiple initialization methods that appear redundant at first glance. This document explains what each method does, their differences, and whether you can achieve everything with just one method.

## Current Methods Analysis

### 1. `initGamepadNavigation(options)`
**Purpose**: Basic initialization with enhanced defaults
**What it does**:
- Destroys any existing instance
- Sets up default options with navigation enabled
- Creates and initializes a GamepadService instance
- Returns the instance

**Default configuration**:
```typescript
{
    statusElementId: 'gamepad-status',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    navigationMode: 'spatial',
    wrapNavigation: true,
    autoDetectElements: true,
    enableNavigation: true,
    enableBackButton: true,
    enableShoulderNavigation: true,
    autoCreateStatusElement: true,
    autoAddStyles: false,
    debounceTime: 150,
    deadzone: 0.1
}
```

### 2. `gamepadService(containerSelector?, options?)`
**Purpose**: Quick setup with container selector and common patterns
**What it does**:
- Takes an optional container selector
- Merges with default options including dual context settings
- Calls `initGamepadNavigation()` internally

**Default configuration**:
```typescript
{
    containerSelector: containerSelector,
    statusElementId: 'gamepad-status',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    navigationMode: 'spatial',
    wrapNavigation: true,
    autoDetectElements: true,
    enableNavigation: true,
    enableBackButton: true,
    enableShoulderNavigation: true,
    navigationMenuSelector: '.nav-menu, nav, .navigation',
    autoCreateStatusElement: true,
    autoAddStyles: false,
    useDataAttributes: true,
    useGamepadIndex: false,
    gamepadContext: 'default',
    enableDualContext: false, // ← Key difference
    menuContextSelector: '.nav-menu, nav, .navigation',
    contentContextSelector: null,
    debounceTime: 150,
    deadzone: 0.1
}
```

### 3. `initGamepadForPage(options?)`
**Purpose**: Super simple one-line initialization with pre-configured event handlers
**What it does**:
- Calls `gamepadService(null, options)` internally
- Sets up common event handlers automatically
- Provides console logging for debugging
- Includes helpful usage instructions

**Subscribe to events with `on(event, cb)`** (each `on()` returns an unsubscribe function):
```typescript
instance.on('focus', (element, index) => {
    console.log(`🎯 Focused: ${element.textContent || element.tagName}`);
});

instance.on('select', (element, index) => {
    console.log(`✅ Selected: ${element.textContent || element.tagName}`);
    // Auto-handles navigation menu links
});

instance.on('controllerconnect', (gamepad) => {
    console.log('🎮 Controller connected');
});

instance.on('controllerdisconnect', (gamepad) => {
    console.log('🎮 Controller disconnected');
});

instance.on('backbutton', () => {
    console.log('🔙 Back button pressed');
});

instance.on('navigationmenuopen', (button) => {
    console.log(`📱 Navigation menu: ${button} pressed`);
});
```

### 4. `initDualContextGamepad(options?)`
**Purpose**: Dual context initialization with separate navigation for menu and content
**What it does**:
- Creates a GamepadService with `enableDualContext: true`
- Sets up dual context event handlers
- Provides context-aware logging

**Key differences**:
```typescript
{
    enableDualContext: true, // ← Main difference
    menuContextSelector: '.nav-menu, nav, .navigation',
    contentContextSelector: null,
    useDataAttributes: false, // Different default
    // ... other options same as gamepadService
}
```

**Dual context events**:
```typescript
instance.on('focus', (element, index) => {
    const context = instance.getActiveContext();
    console.log(`🎯 Focused (${context?.id}): ${element.textContent || element.tagName}`);
});

instance.on('contextswitch', (newContext, oldContext) => {
    console.log(`🔄 Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
});
```

## Can You Do Everything With Just One Method?

**YES!** You can achieve everything with just `gamepadService()` by providing the right configuration.

### Single Method Approach

```typescript
import { gamepadService } from 'gamepad-controller';

// 1. Basic page initialization (equivalent to initGamepadForPage)
const basicGamepad = gamepadService(null, {
    // All defaults are already good for basic usage
});

// 2. Dual context initialization (equivalent to initDualContextGamepad)
const dualContextGamepad = gamepadService(null, {
    enableDualContext: true,
    menuContextSelector: '.nav-menu, nav, .navigation',
    contentContextSelector: null,
    useDataAttributes: false
});

// 3. Container-specific initialization
const containerGamepad = gamepadService('.my-container', {
    navigationMode: 'grid',
    focusedClass: 'custom-focus'
});

// 4. Custom configuration with event handlers
const customGamepad = gamepadService('.app', {
    enableDualContext: true,
    navigationMode: 'spatial',
    focusedClass: 'app-focused',
    selectedClass: 'app-selected'
});

// Subscribe to events with on(event, cb)
customGamepad.on('focus', (element, index) => {
    console.log(`Focused: ${element.textContent}`);
});

customGamepad.on('select', (element, index) => {
    console.log(`Selected: ${element.textContent}`);
});

customGamepad.on('contextswitch', (newContext, oldContext) => {
    console.log(`Switched to ${newContext.id}`);
});
```

## Advantages of Having Multiple Methods

### 1. **Developer Experience**
- **Quick start**: `initGamepadForPage()` provides instant functionality with sensible defaults
- **Less configuration**: Users don't need to know all the options
- **Guided usage**: Each method suggests a specific use case

### 2. **Reduced Cognitive Load**
- **Clear intent**: Method names indicate what you're trying to achieve
- **Fewer decisions**: Users don't need to choose from dozens of options
- **Faster development**: Copy-paste examples work immediately

### 3. **Documentation and Examples**
- **Specific use cases**: Each method demonstrates a common pattern
- **Learning curve**: Users can start simple and progress to advanced usage
- **Best practices**: Methods embody recommended configurations

### 4. **Backwards Compatibility**
- **Existing code**: Current users don't need to change their code
- **Gradual migration**: Users can adopt new patterns over time
- **API stability**: Methods provide a stable interface

## Recommended Usage Patterns

### For Beginners
```typescript
// Start with the simplest method
const gamepad = initGamepadForPage();
```

### For Intermediate Users
```typescript
// Use gamepadService with specific configuration
const gamepad = gamepadService('.my-app', {
    enableDualContext: true,
    navigationMode: 'spatial'
});
```

### For Advanced Users
```typescript
// Direct GamepadService instantiation for full control
const gamepad = new GamepadService({
    enableDualContext: true,
    menuContextSelector: '.sidebar',
    contentContextSelector: '.main-content',
    customOption: true
});
gamepad.init();
```

## Configuration Reference

### Core Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerSelector` | `string \| null` | `null` | CSS selector for container |
| `navigationMode` | `'grid' \| 'spatial' \| 'horizontal'` | `'spatial'` | Navigation algorithm |
| `focusedClass` | `string` | `'gamepad-focused'` | CSS class for focused elements |
| `selectedClass` | `string` | `'gamepad-selected'` | CSS class for selected elements |

### Dual Context Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableDualContext` | `boolean` | `false` | Enable dual context mode |
| `menuContextSelector` | `string` | `'.nav-menu, nav, .navigation'` | Menu area selector |
| `contentContextSelector` | `string \| null` | `null` | Content area selector |

### Behavior Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableNavigation` | `boolean` | `true` | Enable navigation |
| `enableBackButton` | `boolean` | `true` | Enable back button |
| `enableShoulderNavigation` | `boolean` | `true` | Enable shoulder button nav |
| `wrapNavigation` | `boolean` | `true` | Wrap around at edges |
| `autoDetectElements` | `boolean` | `true` | Auto-detect focusable elements |

### Styling Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useDataAttributes` | `boolean` | `true` | Use data attributes instead of classes |
| `useGamepadIndex` | `boolean` | `false` | Use gamepad-index attribute filtering |
| `autoAddStyles` | `boolean` | `false` | Auto-add default styles |
| `autoCreateStatusElement` | `boolean` | `true` | Auto-create status element |

## Singleton factory vs. direct instantiation

This is the single most important distinction to understand before choosing a method.

### The factory helpers share **one** instance

`gamepadService()`, `initGamepadForPage()`, `initDualContextGamepad()`, and
`initCustomEventGamepad()` all operate on a **single module-level shared `GamepadService`
instance**. Calling any of them **destroys the previous shared instance first** and replaces it:

```ts
import { gamepadService, gamepadUtils, cleanupGamepadService } from 'gamepad-controller';

const a = gamepadService('.app');      // creates shared instance #1
const b = gamepadService('.sidebar');  // destroys #1, creates shared instance #2
// a is now destroyed — a.getElements() reflects the torn-down instance.

gamepadUtils.getInstance() === b;      // true — the façade tracks the shared instance
cleanupGamepadService();               // destroys the shared instance and clears the slot
```

**Why a singleton?** The overwhelmingly common case is *one navigation controller per page*.
A shared instance means:

- `gamepadUtils.*` helpers and `cleanupGamepadService()` always target "the" instance with no
  bookkeeping on your side.
- Re-initializing (e.g. on a client-side route change) can't leak the previous loop/listeners —
  the old instance is torn down automatically.

**The trade-off:** you cannot run two factory-managed controllers at once. The second call wins.

### `new GamepadService(...)` is **not** a singleton

The class itself holds no shared state. Construct as many as you need; each owns its own input
loop, listeners, focus state, and contexts. You are responsible for calling `init()` and
`destroy()` on each:

```ts
import { GamepadService } from 'gamepad-controller';

// Two independent controllers — e.g. split-screen or isolated widgets.
const left = new GamepadService({ containerSelector: '.player-1' });
const right = new GamepadService({ containerSelector: '.player-2' });
left.init();
right.init();

// Clean up each one explicitly.
left.destroy();
right.destroy();
```

Direct instantiation is also the path for **dependency injection** — supply a custom
[`PlatformAdapter`](API.md#platform-seam) via the `platform` option to run in a non-standard host
or to drive the loop deterministically in tests:

```ts
const service = new GamepadService({ platform: myAdapter });
service.init();
```

> The factory helpers do **not** expose the `platform` seam in their convenience signatures —
> reach for `new GamepadService({ platform })` when you need it.

### Which should I use?

| You want… | Use |
|---|---|
| One controller per page, minimal setup | a factory helper (`gamepadService()` / `initGamepadForPage()`) |
| Convenience helpers + auto-cleanup on re-init | a factory helper + `gamepadUtils` |
| Multiple simultaneous independent controllers | `new GamepadService(...)` per controller |
| A custom platform adapter / deterministic tests | `new GamepadService({ platform })` |
| Full lifecycle control (`init`/`destroy` timing) | `new GamepadService(...)` |

> **Note:** `initGamepadNavigation()` referenced in older docs is no longer part of the public API.
> Use `gamepadService()` (or `new GamepadService(...)`) instead.

## Conclusion

**You can absolutely do everything with just `gamepadService()`**, but the multiple methods provide significant value through:

1. **Better developer experience** for different skill levels
2. **Reduced configuration complexity** for common use cases
3. **Clear intent and documentation** through method names
4. **Backwards compatibility** for existing code

**Recommendation**: Keep all methods but emphasize `gamepadService()` as the primary API for advanced users, while keeping the convenience methods for beginners and common use cases. 