# Configuration

Use `GamepadServiceConfig` for constructor and factory input. `GamepadServiceOptions` describes flat service settings. Every field below is optional; table defaults describe an omitted field in `new GamepadService()`, not factory overrides.

## Groups

Flat keys and seven optional groups are supported. A defined grouped value overrides its flat equivalent. An undefined grouped field is ignored, so it cannot erase a flat value. Explicit flat undefined values do overwrite constructor defaults; omit optional fields instead of passing undefined. `service.options` is a readonly TypeScript view of the flattened options, not a deeply frozen live configuration API. Construct a new service when changing configuration.

```ts
import { GamepadService } from 'gamepad-controller';

const service = new GamepadService({
  navigation: { containerSelector: '#catalog', navigationMode: 'spatial' },
  input: { enableBackButton: false },
  styling: { autoAddStyles: true },
  status: { logLevel: 'error' },
});
service.init();
// Destroy when the view is removed.
```

## navigation

`NavigationOptionsGroup` is the type for the `navigation` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `navigationMode` | `'grid' \| 'spatial' \| 'horizontal'` | 'grid' | Choose row/column, geometric, or left/right movement. Dual-context setup uses horizontal menu and spatial content independently. |
| `wrapNavigation` | `boolean` | true | Allow boundary wrapping where the selected navigation algorithm supports it. |
| `deadzone` | `number` | 0.1 | Analog threshold on normalized axis magnitude; finite 0–1 inclusive. |
| `debounceTime` | `number` | 150 | Milliseconds between repeated movement steps; finite and nonnegative. |
| `autoDetectElements` | `boolean` | true | Discover focusable DOM controls automatically. setElements() switches to a manual registry; refresh retains that registry. |
| `enableNavigation` | `boolean` | true | Enable automatic movement, selection, back, shoulders and scrolling. False retains raw input/controller/error events and explicit methods. |
| `containerSelector` | `string \| null` | null | CSS discovery/scroll container. Null uses page scope. Render the container before init; a valid selector matching nothing is not a constructor error. |
| `onlyViewport` | `boolean` | false | Require targets to intersect the viewport as well as pass visibility/eligibility checks. |
| `useGamepadIndex` | `boolean` | false (downstream fallback) | Restrict discovery to elements with gamepad-index="true", retaining DOM order. This is an opt-in marker, not a numeric sort key. Manual registries are unaffected. |

## input

`InputOptionsGroup` is the type for the `input` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `enableBackButton` | `boolean` | true | Allow automatic back actions; cancel beforeaction to handle application routing. |
| `backButtonCooldown` | `number` | 300 | Milliseconds between back activations. Supply a finite nonnegative value; the constructor does not validate this numeric field. |
| `enableShoulderNavigation` | `boolean` | true | Allow shoulder menu navigation and page actions. |
| `shoulderCooldown` | `number` | 300 | Milliseconds between shoulder activations. Supply a finite nonnegative value; the constructor does not validate this numeric field. |

## styling

`StylingOptionsGroup` is the type for the `styling` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `focusedClass` | `string` | 'gamepad-focused' | One nonempty CSS class token; used when useDataAttributes is false. Supply matching CSS. |
| `selectedClass` | `string` | 'gamepad-selected' | One nonempty CSS class token for selection presentation when class rendering is used. |
| `useDataAttributes` | `boolean` | true | Render data-gamepad-focused/data-gamepad-selected instead of configured classes. |
| `autoAddStyles` | `boolean` | false | Inject optional global default styles at init. Styles are shared and persist after destroy; explicitly remove when no consumer needs them. |
| `scrollBehavior` | `'smooth' \| 'auto'` | 'smooth' (downstream fallback) | Focus-into-view scrolling in single-context mode. Auto avoids animation churn; dual-context focus uses its own smooth behavior. |

## status

`StatusOptionsGroup` is the type for the `status` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `statusElementId` | `string \| null` | null | Status element ID, without #. A truthy ID creates or reuses that element regardless of autoCreateStatusElement. Null leaves creation to autoCreateStatusElement. |
| `autoCreateStatusElement` | `boolean` | false | Allow creation of the status indicator when an existing target is unavailable. |
| `navigationMenuSelector` | `string` | '.nav-menu, nav, .navigation' | CSS selector used by single-context menu/shoulder behavior. Must be a nonempty string; syntax is not validated by the constructor. |
| `logLevel` | `LogLevel` | 'error' | silent, error, warn, info, or debug. Sets the shared logger for all services; each new constructor can change it. Runtime does not validate membership. |

## scrolling

`ScrollingOptionsGroup` is the type for the `scrolling` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `enableRightStickScroll` | `boolean` | true | Allow right-stick scrolling when automatic navigation is enabled. |
| `scrollSpeed` | `number` | 1 | Unitless multiplier for right-stick scrolling; finite and nonnegative. Zero produces no displacement. |
| `scrollDebounceTime` | `number` | 50 | Minimum milliseconds between right-stick scroll steps; finite and nonnegative. |

## context

`ContextOptionsGroup` is the type for the `context` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `gamepadContext` | `string` | 'default' | Nonempty presentation context written to the document; shared across services, not a registered context ID. |
| `enableDualContext` | `boolean` | false | Create menu and content contexts during init when navigation is enabled; initially activates content. |
| `menuContextSelector` | `string` | '.nav-menu, nav, .navigation' | CSS container for the horizontal menu context. Constructor checks selector syntax when a document exists. |
| `contentContextSelector` | `string \| null` | null | CSS container for the spatial content context; null means page scope. Use disjoint selectors to avoid overlapping controls. |

## customEvents

`CustomEventsOptionsGroup` is the type for the `customEvents` group.

| Key | Type | Effective default | Purpose and constraints |
| --- | --- | --- | --- |
| `useCustomEvents` | `boolean` | false (mode selection) | Choose custom DOM snapshots instead of the native Gamepad API. Not materialized in options when omitted. |
| `customConnectedEvent` | `string` | 'hubgamepadconnected' (listener fallback) | Window event name for a connection snapshot; nonempty string. |
| `customDisconnectedEvent` | `string` | 'hubgamepaddisconnected' (listener fallback) | Window event name for disconnect; nonempty string. |
| `customStateChangedEvent` | `string` | 'hubgamepadstatechanged' (listener fallback) | Window event name for complete ordered state snapshots; nonempty string. See the host transport contract. |

## Platform dependency

`platform?: PlatformAdapter` is accepted only on `GamepadServiceConfig`. It defaults to `defaultPlatformAdapter`, is captured separately, and is removed from `service.options`. It supplies time, frame scheduling, gamepads, window events, navigation and mutation observers. It does not abstract DOM querying/layout; a fake adapter with isBrowser true still needs a DOM. See [platform contracts](PUBLIC_API.md#platform).

## Validation and selector behavior

Construction throws TypeError for non-finite or negative debounceTime, deadzone, scrollSpeed or scrollDebounceTime; deadzone above 1 throws RangeError. All declared boolean options reject defined non-booleans. Focus/selection class tokens must be nonempty and contain no whitespace. Truthy navigationMode and scrollBehavior values are checked against their declared unions.

Container, menu-context and content-context selectors are syntax-checked only when a document exists and the value is truthy; unmatched selectors are allowed. navigationMenuSelector, custom event names and gamepadContext are checked as nonempty strings when non-null and defined. TypeScript types remain the contract: this validation is not a complete schema for untyped data. In particular cooldowns, statusElementId and logLevel are not fully runtime-validated. Do not feed unvalidated external JSON directly into configuration.

Automatic discovery excludes hidden, detached, disabled and inert targets; active explicit/native-modal scopes further constrain eligibility. Manual setElements() retains the supplied order and a copy of the array, with eligibility rechecked before actions. Explicit refresh() invalidates cached discovery after DOM changes. CSS class names and status IDs are tokens/IDs, whereas container and menu values are CSS selectors.

## Factory defaults

`gamepadService()` and `initGamepadForPage()` choose spatial navigation, statusElementId gamepad-status and automatic status creation. `initDualContextGamepad()` also enables dual contexts and defaults useDataAttributes to false. `initCustomEventGamepad()` defaults custom transport on and useDataAttributes false. All factory-supplied values can be overridden by caller options; defined grouped values retain precedence. Each factory replaces and destroys the shared instance. Direct class construction leaves ownership to the caller.

See [API contracts](API.md), [public helper contracts](PUBLIC_API.md), and [host usage](USAGE_VANILLA.md).
