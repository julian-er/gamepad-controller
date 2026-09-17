# Public API contracts

Import these runtime values and types from `gamepad-ui-engine`. Internal subpaths are not package exports. Start with [service lifecycle and host contracts](API.md) and [complete configuration](CONFIGURATION.md).

## Service signatures

`new GamepadService(config?: GamepadServiceConfig)` creates an independently owned instance. `options: Readonly<GamepadServiceOptions>` exposes flattened configuration; `contextManager: GamepadContextManager` is owned and destroyed by the service. The constructor does not start polling. Pair init with destroy; destroy clears external subscribers, so subscribe again before reuse.

| Signature | Result and ownership |
| --- | --- |
| `init(): void` | Start once; active repeated calls ignored; nonbrowser adapter skips initialization. |
| `destroy(): void` | Release input/listeners/focus/contexts; shared injected CSS and status DOM remain. |
| `resetInput(): void` | Clear input state while retaining service configuration and subscriptions. |
| `on<K extends keyof GamepadServiceEventMap>(event: K, listener: GamepadServiceEventMap[K]): () => void` | Multiple subscribers; returned function removes this subscription. |
| `off<K extends keyof GamepadServiceEventMap>(event: K, listener: GamepadServiceEventMap[K]): void` | Remove this callback. |
| `setElements(elements: Element[]): void` | Copy ordered manual single-context registry; target Elements remain application-owned. |
| `detectElements(): void` | Refresh single-context discovery or re-evaluate manual registry. |
| `refresh(): void` | Invalidate discovery and update focus; dispatches to all contexts in dual mode. |
| `updateFocus(): void` / `clearFocus(): void` | Apply/clear single-context presentation. |
| `navigateToIndex(index: number): boolean` | Single-context explicit navigation; false for invalid/ineligible target. In dual mode navigate on active context. |
| `getElements(): Element[]` | Copied array, shared Element references; active context in dual mode. |
| `getCurrentElement(): Element \| null` / `getCurrentIndex(): number` | Focus query; empty index may be -1, so check element before using it. |
| `getControllerType(): string` / `getControllerTypes(): string[]` | Last-active family / distinct connected families. |
| `isControllerConnected(): boolean` | Whether input tracks a connected pad. |
| `setActiveScope(scope: Element \| null): void` / `clearActiveScope(): void` | Push explicit scope / restore previous scope and eligible focus. Null clears directly. |
| `getContext(id: string): GamepadNavigationContext \| undefined` | Missing registered ID returns undefined. |
| `getActiveContext(): GamepadNavigationContext \| null` | Borrowed active context or null. |
| `getAllContexts(): GamepadNavigationContext[]` | New array of borrowed contexts. |
| `switchToContext(contextId: string): boolean` | Activate registered context; false if unavailable. |
| `setupDualContextMode(): void` | Register menu/content and bridge events; normally init performs this. Re-registering replaces contexts. |

## Event payloads

`GamepadServiceEventMap` maps names to these callback signatures. All callbacks return void. Subscribers are synchronous; exceptions are isolated and reported through gamepaderror. A failed beforeaction listener suppresses that automatic effect. The emitter does not recursively report a failing gamepaderror callback.

| Event | Callback | Meaning |
| --- | --- | --- |
| `beforeaction` | `(event: GamepadActionEvent) => void` | Cancel synchronously with preventDefault before automatic effect. |
| `action` | `(event: GamepadActionEvent) => void` | Completed successful effect; cancellation here is too late. |
| `focus` | `(element: Element, index: number) => void` | Focus presentation updated. |
| `select` | `(element: Element, index: number) => void` | Target selected. |
| `controllerconnect` | `(gamepad: Gamepad) => void` | Input device connected. |
| `controllerdisconnect` | `(gamepad: Gamepad) => void` | Input device disconnected. |
| `backbutton` | `() => void` | Observation before browser back; does not cancel it. |
| `navigationrequest` | `(href: string, element: Element) => void` | Observation before location assignment; does not cancel it. |
| `navigationmenuopen` | `(button: string) => void` | Menu action button label. |
| `buttondown` | `(buttonIndex: number, gamepad: Gamepad) => void` | Rising raw edge. |
| `buttonup` | `(buttonIndex: number, gamepad: Gamepad) => void` | Falling raw edge. |
| `contextswitch` | `(newContext: GamepadNavigationContext, oldContext: GamepadNavigationContext \| null) => void` | Borrowed contexts; no prior context is null. |
| `gamepaderror` | `(error: Error) => void` | Blocked input access or consumer callback failure. |

`GamepadActionEvent` has readonly type (`move`, `select`, `back`, `shoulder`, `scroll`), gamepad, target (Element or null), optional direction and button, plus mutable defaultPrevented and preventDefault(): void. `Direction` is up/down/left/right; `ShoulderButton` is L1/R1 (uppercase). `GamepadEvent extends Event` adds gamepad: Gamepad for browser-like input events; it is not the custom snapshot detail schema. See [custom transport](API.md#custom-event-host-transport).

## Factories and shared utilities

`gamepadService(containerSelector?: string | null, options?: GamepadServiceConfig): GamepadService`, `initGamepadForPage(options?: GamepadServiceConfig): GamepadService`, `initDualContextGamepad(options?: GamepadServiceConfig): GamepadService`, and `initCustomEventGamepad(options?: GamepadServiceConfig): GamepadService` initialize and replace one shared instance. Caller configuration overrides factory defaults; grouped values override flat values. `cleanupGamepadService(): void` destroys and clears that instance, safely doing nothing when absent. See [factory defaults](CONFIGURATION.md#factory-defaults).

`gamepadUtils` delegates to that same shared instance, not independent class instances:

| Method | Return and absent-instance behavior |
| --- | --- |
| `getInstance()` | GamepadService or null; borrowed instance. |
| `isConnected()` / `isDualContextEnabled()` | boolean; false when absent. |
| `getCurrentElement()` / `getCurrentIndex()` / `getElements()` | Element or null / number (-1 absent) / copied Element[] ([] absent). |
| `navigateToElement(element: Element)` / `navigateToIndex(index: number)` | boolean; false if absent or unavailable; delegates single-context navigation. |
| `refresh()` / `cleanup()` | void; no-op when absent. |
| `getActiveContext()` / `getMenuContext()` / `getContentContext()` / `getContext(contextId: string)` | Borrowed context, null without service; ID lookup can return undefined with a service. |
| `getAllContexts()` | GamepadNavigationContext[]; [] absent. |
| `switchToContext(contextId: string)` / `switchToMenu()` / `switchToContent()` | boolean; false absent. |
| `addStyles(options?: NavigationStyleOptions)` / `removeStyles()` / `printCSSExamples()` | void; global styling utilities independent of a service. removeStyles removes the default style ID only. |
| `getNavigationInfo()` | null absent; otherwise snapshot with isConnected:boolean, controllerType:string, currentElement:Element or null, currentIndex:number, totalElements:number and navigationEnabled/backButtonEnabled/shoulderNavigationEnabled:boolean or undefined. |

## Contexts

`new GamepadContextManager()` owns registered contexts. `new GamepadNavigationContext(id: string, options?: GamepadNavigationContextOptions)` creates a standalone context; its owner must call dispose(). Service-owned contexts are borrowed: let service.destroy() clean them up. Direct context methods are explicit commands and do not generate the service beforeaction/action pipeline.

| Manager method | Contract |
| --- | --- |
| `registerContext(id: string, options?: GamepadNavigationContextOptions): GamepadNavigationContext` | Create/replace an ID; dispose replaced context. |
| `getContext(id: string): GamepadNavigationContext \| undefined` / `getAllContexts(): GamepadNavigationContext[]` | Borrow contexts; list is a new array. |
| `setActiveContext(contextId: string): boolean` / `getActiveContext(): GamepadNavigationContext \| null` | Switch/query active context. |
| `setContextSwitchCallback(fn: GamepadContextManagerCallback \| null): void` | Replace single switch callback; null clears. |
| `setActiveScope(scope: Element \| null): void` | Apply scope to all contexts and update active focus. |
| `handleNavigation(direction: Direction): boolean` | Navigate active context. |
| `handleSelection(onNavigationRequest?: ((href: string, element: Element) => void) \| null): boolean` | Select active target; pass handler to handle navigation links. |
| `handleShoulderNavigation(button: ShoulderButton): boolean` | Route to menu-role or horizontal context. |
| `handleStickNavigation(direction: Direction): boolean` | Route to content-role or spatial context. |
| `refresh(): void` / `destroy(): void` | Refresh all / dispose all and clear registry/callback. |

Manager public fields are contexts: Map<string, GamepadNavigationContext>, activeContext and lastActiveContext (context or null). Use methods to preserve lifecycle and switching behavior instead of mutating these fields.

| Context method | Contract |
| --- | --- |
| `on(event, listener): () => void` | focus/select callbacks receive (Element, number); activate/deactivate receive context. Returned cleanup unsubscribes; no exported context event-map type. |
| `detectElements(): void` / `refresh(): void` | Discover when autoDetectElements enabled; refresh also updates active focus. |
| `activate(): void` / `deactivate(): void` | Enter/leave active state and update presentation. |
| `updateFocus(): void` / `clearFocus(): void` | Apply/clear focus presentation. |
| `navigate(direction: Direction): boolean` | Navigate active context; grid currently uses spatial navigation. |
| `navigateHorizontal(direction: Direction): boolean` / `navigateSpatial(direction: Direction): boolean` | Explicit algorithm methods; prefer navigate() for active-state guard. |
| `select(onNavigationRequest?: ((href: string, element: Element) => void) \| null): boolean` | Select/click; a nav-item link delegates only to the supplied callback, with no standalone navigation fallback. |
| `navigateToIndex(index: number): boolean` | Focus eligible target only while active. |
| `getCurrentElement(): Element \| null` / `getCurrentIndex(): number` / `getElements(): Element[]` | Current target/index/copied registry. |
| `syncNativeFocus(element: Element): boolean` | Track eligible registered DOM focus without rendering. |
| `setActiveScope(scope: Element \| null): void` | Replace explicit context scope and rediscover; does not push the service scope stack. |
| `_clearListeners(): void` | Clear all context subscribers; normally dispose owns this cleanup. |
| `hasElements(): boolean` / `dispose(): void` | Nonempty registry / permanent cleanup including owned tabindex and listeners. |

Context public fields: id:string, options:GamepadNavigationContextOptions, elements:Element[], focusedElementIndex:number, isActive:boolean, lastFocusedElement:Element or null. Prefer methods to direct mutation.

`GamepadNavigationContextOptions` requires navigationMode (spatial/horizontal/grid) and containerSelector (string or null) when an options object is supplied. With no object, defaults are spatial and null. Optional role (menu/content) influences routing. focusedClass defaults gamepad-focused, selectedClass gamepad-selected, useDataAttributes/wrapNavigation/autoDetectElements true, onlyViewport false, and useGamepadIndex effectively false. Contexts use smooth focus scrolling and do not accept service scrollBehavior. `GamepadContextManagerCallback` is `(newContext, oldContext) => void`, with oldContext nullable.

## Controller mappings

`CONTROLLER_MAPPINGS: ControllerMappings` is a frozen family table; use supplied helpers instead of mutating it. `ControllerType` is xbox/playstation/nintendo/unknown. Helpers require a valid family; unknown is the explicit fallback family, not permission to pass arbitrary strings.

| Function | Return |
| --- | --- |
| `getButtonName(index: number, controllerType: ControllerType): string` | Label or Button followed by index when unnamed. |
| `getAxisName(index: number, controllerType: ControllerType): string` | Label or Axis followed by index when unnamed. |
| `getPrimaryActionButtonIndex(controllerType: ControllerType): number` | Primary button index (Nintendo differs). |
| `getBackButtonIndex(controllerType: ControllerType): number` | Back/cancel index. |
| `getShoulderIndices(controllerType: ControllerType): { l1: number; r1: number }` | Fresh writable object. |
| `getDpadIndices(controllerType: ControllerType): { up: number; down: number; left: number; right: number }` | Fresh writable object. |

`ControllerMappings` has readonly xbox, playstation, nintendo and unknown entries. Each `ControllerMapping` contains readonly buttons:string[], axes:string[], validation:ControllerValidation and indices:ButtonIndices. `ControllerValidation` has readonly minButtons:number, minAxes:number and optional readonly idPatterns:RegExp[]. `ButtonIndices` has readonly primary:number, back:number, shoulder:ShoulderIndices and dpad:DpadIndices; the index types contain readonly numeric direction fields shown above. Mapping label arrays are readonly too.

## Styling

| Function | Contract |
| --- | --- |
| `addNavigationStyles(options?: NavigationStyleOptions): void` | Create/replace a DOM style element by scopeId; global CSS, not container-scoped. Requires document. |
| `removeNavigationStyles(scopeId?: string): void` | Remove matching ID; default gamepad-navigation-styles. |
| `getNavigationCSS(options?: NavigationStyleOptions): string` | Generate CSS without injecting DOM. |
| `getExampleCSS(): string` | Return customization examples. |
| `printCSSExamples(): void` | Print examples regardless of logger level. |

`NavigationStyleOptions` fields are optional strings: scopeId defaults gamepad-navigation-styles (injection/removal identity only); prefix defaults gamepad- (getNavigationCSS only); primaryColor defaults #007bff; focusWidth defaults 2px; animationDuration defaults 0.2s. addNavigationStyles uses fixed gamepad classes and does not honor prefix; getNavigationCSS does not use scopeId. Coordinate shared style ownership: service.destroy() does not remove styles. Supply valid trusted CSS values; helpers are not CSS sanitizers.

## Logger

`new Logger(level?: LogLevel)` defaults error. `logger` is the library-wide instance; `logger.setLevel(level)` also changes service diagnostics. `LogLevel` is silent/error/warn/info/debug in increasing verbosity. `setLevel(level: LogLevel): void` changes threshold; `enabled(level: Exclude<LogLevel, 'silent'>): boolean` lets callers guard expensive argument construction. `error(...args: unknown[]): void`, warn, info and debug print via corresponding console methods when enabled. Each service constructor with a defined logLevel changes this shared setting; independent Logger instances do not affect the library.

## Platform

`new BrowserPlatformAdapter()` reads current browser globals on each call. `defaultPlatformAdapter: PlatformAdapter` is the shared default; supply config.platform to replace it for an instance. The library cancels its scheduled frames, removes its listeners and disconnects its observer; it does not dispose an application-owned adapter. `WindowEventListener` is `(event: Event) => void`.

| PlatformAdapter member | Contract |
| --- | --- |
| `readonly isBrowser: boolean` | Whether window/document exist; false makes service init skip. |
| `now(): number` | Clock in milliseconds; use a consistent time origin for cooldowns. |
| `requestAnimationFrame(callback: FrameRequestCallback): number` | Schedule frame and return cancellation handle. |
| `cancelAnimationFrame(handle: number): void` | Cancel owned scheduled frame. |
| `getGamepads(): (Gamepad \| null)[]` | Live pads; browser adapter returns [] if API absent, may throw if blocked. |
| `addWindowListener(type: string, listener: WindowEventListener): void` / `removeWindowListener(type: string, listener: WindowEventListener): void` | Matching registration/removal. |
| `assignLocation(href: string): void` / `historyBack(): void` | Automatic navigation effects, even when notification subscribers exist; cancel beforeaction to suppress. |
| `createMutationObserver(callback: MutationCallback): MutationObserver \| null` | New observer or null if unsupported. |

DOM queries, geometry and focus remain browser DOM operations outside this seam. It is not a headless renderer.

## Navigation data types

`GridDimensions` contains rows:number and cols:number. `NavigationState` contains focusedElementIndex:number, elements:Element[], gridDimensions:GridDimensions, options:GamepadServiceOptions, nullable onFocus/onSelect callbacks `(element: Element, index: number) => void`, and optional isElementEligible:(Element)=>boolean, isRuntimeActive:()=>boolean and runtimeGeneration:()=>number. These types describe integration data; no public service getter returns a mutable NavigationState. Use service/context methods to operate navigation.

Configuration types `GamepadServiceOptions`, `GamepadServiceConfig`, `NavigationOptionsGroup`, `InputOptionsGroup`, `StylingOptionsGroup`, `StatusOptionsGroup`, `ScrollingOptionsGroup`, `ContextOptionsGroup` and `CustomEventsOptionsGroup` are defined by the [canonical configuration reference](CONFIGURATION.md).
