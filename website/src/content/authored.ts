import type { Doc } from './types';
import { angularExamples, reactExamples, vanillaExamples, integrationExamples } from '../examples';

export const authoredDocs: Doc[] = [
    {
        id: 'introduction',
        group: 'GETTING STARTED',
        title: 'gamepad-ui-engine',
        summary:
            'A small, focused engine for controller-driven interfaces. Bring spatial navigation, native focus, and predictable input to your web application.',
        sections: [
            {
                id: 'release-status',
                title: 'First release: 1.0.0',
                body: [
                    'Version 1.0.0 is the first published release. Install it from npm, or build a local tarball to try unreleased changes using the [building guide](#/docs/building).',
                ],
            },
            {
                id: 'overview',
                title: 'Built for the way you play',
                body: [
                    'Turn ordinary buttons, links, and inputs into a controller-navigable interface. gamepad-ui-engine discovers eligible elements, routes directional input, and keeps browser focus in sync.',
                    'Use it in Angular, React, a vanilla web application, or a native WebView. The library owns input and navigation; your application owns the experience.',
                ],
            },
            {
                id: 'how-it-works',
                title: 'How it works',
                rows: [
                    ['01 · Connect', 'Native Gamepad API or a custom-event host bridge supplies controller snapshots.'],
                    ['02 · Navigate', 'Spatial, grid, or horizontal navigation chooses the next eligible target.'],
                    [
                        '03 · Interact',
                        'Selection, cancellation, focus, and lifecycle events connect to your application.',
                    ],
                ],
                headers: ['Step', 'What happens'],
            },
            { id: 'quick-integration', title: 'Quick integration', examples: integrationExamples },
            {
                id: 'requirements',
                title: 'Before you begin',
                body: [
                    'Use a browser that exposes the Gamepad API, on localhost or HTTPS. Connect a controller and press a button to let the browser expose it to the page. Embedded applications may need their host to allow gamepad access.',
                    'No controller nearby? The playground includes an explicitly labeled simulation that sends snapshots through the library’s real custom-event transport.',
                ],
            },
        ],
    },
    {
        id: 'installation',
        group: 'GETTING STARTED',
        title: 'Installation',
        summary: 'From your first install to the first focus ring.',
        sections: [
            {
                id: 'install',
                title: 'Install from npm',
                code: 'npm install gamepad-ui-engine',
                language: 'Terminal',
            },
            {
                id: 'local-install',
                title: 'Try unreleased changes',
                body: [
                    'To test changes that are not published yet, install dependencies in the repository checkout, build and pack; then install that tarball into your application. See [Building and packaging](#/docs/building) for the full procedure.',
                ],
                code: 'pnpm install\npnpm run build\npnpm pack\n# In your application directory:\nnpm install /path/to/gamepad-controller/gamepad-ui-engine-1.0.0.tgz',
                language: 'Terminal',
            },
            {
                id: 'initialize',
                title: 'Create a service',
                examples: integrationExamples,
                body: [
                    'Initialize after the target elements exist in the DOM. A direct instance gives your component ownership of its lifecycle.',
                ],
            },
            {
                id: 'styles',
                title: 'Make focus visible',
                code: '[data-gamepad-focused="true"],\n.is-focused {\n  outline: 2px solid #10b981;\n  outline-offset: 4px;\n}\n\n[data-gamepad-selected="true"] {\n  background: #10b981;\n  color: #0a0e17;\n}',
                language: 'SCSS',
                body: [
                    'By default the library uses data attributes for focus styles. Set useDataAttributes: false to use focusedClass and selectedClass instead. The framework setup examples opt into the default stylesheet. You can also opt into the library’s styling helpers with autoAddStyles: true. Keep visible keyboard focus styling as well.',
                ],
            },
        ],
    },
    {
        id: 'angular',
        group: 'GETTING STARTED',
        title: 'Angular integration',
        summary: 'Create an owned service after the view is ready, and tear it down with the component.',
        sections: [
            {
                id: 'angular-component',
                title: 'Standalone component',
                examples: angularExamples,
                body: [
                    'See [Angular lifecycle documentation](https://angular.dev/guide/components/lifecycle) for view initialization and teardown.',
                    'Select Angular for a complete component with real focusable targets. Install gamepad-ui-engine in your Angular project and import CatalogComponent into the parent standalone component.',
                    'Initialize on the client after the DOM exists. For server-rendered applications, guard browser-only initialization and wait until hydration is complete. Do not inject GamepadService as though it were an Angular-provided service.',
                ],
            },
            {
                id: 'angular-updates',
                title: 'Subscriptions and rendered updates',
                body: [
                    'Register service.on listeners before init() so initial events are observed. When a callback changes application state, use your Angular application’s change-detection mechanism.',
                    'After Angular renders a changed collection, call refresh(). Constructor execution is too early to initialize navigation. ngOnDestroy must destroy the owned instance; do not leave a shared service polling a removed view.',
                ],
            },
        ],
    },
    {
        id: 'vanilla',
        group: 'GETTING STARTED',
        title: 'Vanilla JavaScript / TypeScript',
        summary: 'Use the public ES module directly with ordinary DOM elements.',
        sections: [
            {
                id: 'vanilla-mount',
                title: 'Mount and dispose a view',
                examples: vanillaExamples,
                body: [
                    'The Vanilla TS example is also valid plain JavaScript. Save it as catalog.js in a bundled ES-module app, create the shown HTML first, and call dispose() when removing the view.',
                    'npm install gamepad-ui-engine installs an ES module. A bare import needs a bundler or an explicit browser import map; it is not resolved by an unconfigured script tag.',
                ],
            },
            {
                id: 'page-lifecycle',
                title: 'Page lifecycle and back/forward cache',
                body: [
                    'For a long-lived page, replace the example’s final mount call with the following lifecycle handlers. Framework and SPA views should use their own mount/unmount lifecycle instead.',
                ],
                code: "let disposePage = mountCatalog();\nwindow.addEventListener('pagehide', () => disposePage());\nwindow.addEventListener('pageshow', (event) => {\n  if (event.persisted) disposePage = mountCatalog();\n});",
                language: 'JavaScript',
            },
        ],
    },
    {
        id: 'react',
        group: 'GETTING STARTED',
        title: 'React integration',
        summary: 'One effect. One service. A lifecycle that belongs to your component.',
        sections: [
            { id: 'component', title: 'Your first component', examples: reactExamples },
            {
                id: 'subscriptions',
                title: 'Subscribe before initialization',
                code: "service.on('focus', (element, index) => {\n  console.log('Focused target', index, element);\n});\nservice.on('select', (element, index) => {\n  console.log('Selected target', index, element);\n});\nservice.init();",
                body: [
                    'See [React useEffect documentation](https://react.dev/reference/react/useEffect) for effect cleanup. Register listeners and manual targets in the same effect before init(). destroy() clears both. Construct a fresh service on remount, including React Strict Mode’s development remount.',
                ],
            },
            {
                id: 'dynamic-content',
                title: 'Dynamic content',
                body: [
                    'The service observes its container for DOM changes. For an explicit update after application changes, call refresh(). For a manual ordered target list, call setElements(elements). Hidden, disabled, detached, inert, and out-of-scope targets are skipped.',
                ],
                code: 'service.refresh();\n\n// Or manage the ordered target registry yourself:\nservice.setElements([...document.querySelectorAll("#catalog button")]);',
            },
        ],
    },
    {
        id: 'playground',
        group: 'CORE CONCEPTS',
        title: 'Interactive playground',
        summary:
            'Connect a controller or run the host-input simulation. Every focus movement is handled by gamepad-ui-engine.',
        sections: [
            {
                id: 'controls',
                title: 'Take control',
                body: [
                    'Choose Native controller and start the demo to use hardware. Move with the left stick or D-pad and select with the primary button. The browser may require a button press before reporting a device.',
                    'Choose Simulated input to use the on-screen D-pad. Arrow keys work while a demo tile is focused. Enter selects through the host transport. Stop releases input and destroys the service.',
                ],
                rows: [
                    ['Xbox', 'A selects · B goes back · D-pad moves'],
                    ['PlayStation', 'Cross selects · Circle goes back · D-pad moves'],
                    ['Generic / arcade', 'Button names and layout vary by device; inspect the reported mapping.'],
                ],
                headers: ['Controller', 'Standard controls'],
            },
            {
                id: 'truthful-state',
                title: 'Reading the preview',
                body: [
                    'The controller silhouette is a visual skin, not a remapping configuration. A simulated session is always labeled. Native axis values come from the browser; action and focus logs come from the service. No synthetic performance or connectivity metrics are displayed.',
                ],
            },
        ],
    },
    {
        id: 'navigation',
        group: 'CORE CONCEPTS',
        title: 'Spatial navigation',
        summary: 'Give directional input a predictable destination.',
        sections: [
            {
                id: 'modes',
                title: 'Choose a navigation mode',
                headers: ['Mode', 'Use it for'],
                rows: [
                    [
                        'spatial',
                        'Directional navigation based on element geometry: dashboards and irregular card layouts.',
                    ],
                    ['grid', 'Regular collections with row and column navigation.'],
                    ['horizontal', 'A linear horizontal strip, toolbar, or menu.'],
                ],
            },
            {
                id: 'configuration',
                title: 'Configure movement',
                code: "const service = new GamepadService({\n  navigation: {\n    containerSelector: '#catalog',\n    navigationMode: 'spatial',\n    wrapNavigation: true,\n    deadzone: 0.15,\n    debounceTime: 150,\n  },\n});",
                body: [
                    'deadzone filters small stick deflections; debounceTime controls the interval between repeated movement. Grouped options take precedence over flat options.',
                ],
            },
            {
                id: 'scopes',
                title: 'Constrain focus with scopes',
                code: "service.setActiveScope(document.querySelector('#settings'));\n// After closing this scope, restore the prior scope and focus:\nservice.clearActiveScope();",
                body: [
                    'Each non-null explicit scope saves the previous scope and focus. clearActiveScope() unwinds one scope. setActiveScope(null) clears directly. A native modal dialog also supplies an automatic scope; targets must satisfy both when an explicit scope is active.',
                ],
            },
            {
                id: 'contexts',
                title: 'Menu and content contexts',
                code: "const service = new GamepadService({\n  enableDualContext: true,\n  menuContextSelector: '#menu',\n  contentContextSelector: '#content',\n});\nservice.on('contextswitch', (current, previous) => {\n  console.log(current.id, previous?.id);\n});\nservice.init();",
                body: [
                    'Dual-context mode separates a horizontal menu from spatial content. Use contexts for persistent navigation regions and explicit scopes for temporary focus restrictions.',
                ],
            },
        ],
    },
    {
        id: 'events',
        group: 'API & INTEGRATION',
        title: 'Events & actions',
        summary: 'Observe input, intercept actions, and keep application behavior explicit.',
        sections: [
            {
                id: 'subscribe',
                title: 'Subscribe and unsubscribe',
                code: "const unsubscribe = service.on('focus', (element, index) => {\n  console.log(index, element);\n});\n\nunsubscribe();\n// Or remove a known callback with service.off(name, callback).",
            },
            {
                id: 'action-order',
                title: 'Cancel before the effect',
                body: [
                    'Button-triggered actions emit their raw edges before beforeaction. Analog movement and held-input repeats do not need a fresh edge. After cancellation checks, at most one effect runs and action reports successful completion; cancelled or unsuccessful effects do not emit action. Cancellation must happen synchronously. An action listener cannot undo a completed effect. A failed beforeaction callback suppresses the default effect.',
                ],
                code: "service.on('beforeaction', (event) => {\n  if (event.type === 'back') {\n    event.preventDefault();\n    closeSettings();\n  }\n});\n\nservice.on('action', (event) => {\n  console.log(event.type, event.direction, event.defaultPrevented);\n});",
            },
            {
                id: 'event-reference',
                title: 'Event reference',
                headers: ['Event', 'Callback arguments'],
                rows: [
                    [
                        'beforeaction / action',
                        'GamepadActionEvent: type, gamepad, target, direction?, button?, defaultPrevented, preventDefault()',
                    ],
                    ['focus / select', 'element, index'],
                    ['controllerconnect / controllerdisconnect', 'gamepad'],
                    ['buttondown / buttonup', 'buttonIndex, gamepad'],
                    ['backbutton', 'No arguments'],
                    ['navigationrequest', 'href, element; observation does not cancel browser navigation'],
                    ['navigationmenuopen', 'button'],
                    ['contextswitch', 'newContext, oldContext'],
                    ['gamepaderror', 'error'],
                ],
            },
        ],
    },
    {
        id: 'controllers',
        group: 'API & INTEGRATION',
        title: 'Controller mappings',
        summary: 'Use the library’s controller labels and action indices.',
        sections: [
            {
                id: 'families',
                title: 'Supported mapping families',
                headers: ['Family', 'Primary', 'Back', 'Shoulders'],
                rows: [
                    ['Xbox', 'A · 0', 'B · 1', 'LB / RB · 4 / 5'],
                    ['PlayStation', 'Cross · 0', 'Circle · 1', 'L1 / R1 · 4 / 5'],
                    ['Nintendo', 'B · 0', 'A · 1', 'L / R · 4 / 5'],
                    ['Unknown / generic', 'Fallback labels', 'Device-dependent', 'Inspect the controller mapping'],
                ],
            },
            {
                id: 'helpers',
                title: 'Read labels from the library',
                code: "import {\n  getButtonName, getAxisName, getDpadIndices,\n  getPrimaryActionButtonIndex, CONTROLLER_MAPPINGS,\n} from 'gamepad-ui-engine';\n\ngetButtonName(0, 'playstation'); // 'Cross'\ngetAxisName(0, 'xbox');          // 'Left Stick X'\ngetDpadIndices('xbox');         // up, down, left, right\ngetPrimaryActionButtonIndex('xbox'); // 0",
                body: [
                    'Detection considers device identifiers and minimum button/axis counts. Browser and device mappings can differ. The generic arcade preview does not imply that every physical arcade stick exposes a standard mapping.',
                ],
            },
        ],
    },
    {
        id: 'host-bridge',
        group: 'API & INTEGRATION',
        title: 'Custom-event host bridge',
        summary: 'Bring native WebView input through a validated snapshot transport.',
        sections: [
            {
                id: 'setup',
                title: 'Enable custom events',
                code: "const service = new GamepadService({\n  containerSelector: '#app',\n  useCustomEvents: true,\n});\nservice.init();",
            },
            {
                id: 'snapshots',
                title: 'Send complete snapshots',
                code: "const gamepad = {\n  index: 0, id: 'Xbox host controller',\n  connected: true, mapping: 'standard',\n  buttons: Array.from({ length: 17 }, () => ({\n    pressed: false, value: 0, touched: false,\n  })),\n  axes: [0, 0, 0, 0],\n  timestamp: performance.now(),\n};\nwindow.dispatchEvent(new CustomEvent('hubgamepadstatechanged', {\n  detail: { gamepad },\n}));",
                body: [
                    'Send a full baseline first, then a full snapshot whenever any button or axis changes, including releases. Preserve delivery order. The initial baseline avoids phantom primary selection: a primary button held in it must be released and pressed again.',
                    'index must be a nonnegative safe integer; axes must be finite in [-1, 1]; button values must be finite in [0, 1]. Boolean fields must be booleans and mapping must be an empty string or standard. Malformed snapshots are rejected without partial mutation.',
                ],
            },
            {
                id: 'recovery',
                title: 'Disconnect and recover',
                body: [
                    'Default transport names are hubgamepadconnected, hubgamepaddisconnected, and hubgamepadstatechanged. Silence does not release held directional input in a changes-only stream. Send a release or disconnect, or call resetInput(). Send a fresh baseline after recovery.',
                ],
                code: "window.dispatchEvent(new CustomEvent('hubgamepaddisconnected', {\n  detail: { gamepad },\n}));\n\n// Or explicitly clear input while retaining configuration:\nservice.resetInput();",
            },
        ],
    },
    {
        id: 'api',
        group: 'API & INTEGRATION',
        title: 'API reference',
        summary: 'The public service surface, grounded in the local 1.0.0 source.',
        sections: [
            {
                id: 'lifecycle',
                title: 'Lifecycle',
                headers: ['Method', 'Behavior'],
                rows: [
                    ['init()', 'Attach listeners and start. Repeated calls while active are ignored.'],
                    ['destroy()', 'Remove owned resources; clear subscribers, targets, focus, contexts, and input.'],
                    [
                        'resetInput()',
                        'Clear devices and pending snapshots while preserving configuration and subscribers.',
                    ],
                ],
            },
            {
                id: 'focus-methods',
                title: 'Elements & focus',
                headers: ['Method', 'Behavior'],
                rows: [
                    ['setElements(elements)', 'Copy and store an ordered manual target registry.'],
                    ['getElements()', 'Return a copy of registered or discovered targets.'],
                    ['refresh() / detectElements()', 'Re-evaluate navigation targets.'],
                    ['navigateToIndex(index)', 'Explicitly focus a target; returns success.'],
                    ['getCurrentElement() / getCurrentIndex()', 'Query the current target and index.'],
                    ['setActiveScope(scope)', 'Push a non-null explicit scope; null clears directly.'],
                    ['clearActiveScope()', 'Restore the prior explicit scope and focus.'],
                    [
                        'getControllerType() / getControllerTypes()',
                        'Query the current controller family or connected families.',
                    ],
                ],
            },
            {
                id: 'factories',
                title: 'Shared-instance helpers',
                body: [
                    'gamepadService(containerSelector?, options?), initGamepadForPage(options?), and initDualContextGamepad(options?) create an initialized shared instance. initCustomEventGamepad(options?) enables host transport. A factory call replaces the previous shared instance; cleanupGamepadService() destroys it.',
                    'Prefer a directly owned GamepadService for isolated React components. Do not create overlapping active services over the same interface.',
                ],
            },
        ],
    },
    {
        id: 'lifecycle',
        group: 'RESOURCES',
        title: 'Lifecycle & troubleshooting',
        summary: 'Keep input predictable across mounts, reconnects, and changing interfaces.',
        sections: [
            {
                id: 'cleanup',
                title: 'Always clean up',
                body: [
                    'Call destroy() when the component unmounts. It removes the service’s listeners and polling loop and clears subscribers, focus, manual targets, and contexts. To reuse an instance after destruction, register listeners and manual targets again before init().',
                    'resetInput() is different: it clears connected input and button-edge state while retaining configuration and subscriptions.',
                ],
            },
            {
                id: 'troubleshooting',
                title: 'When input does not appear',
                headers: ['Symptom', 'Check'],
                rows: [
                    [
                        'No device detected',
                        'Connect a controller, focus the page, and press a controller button. Use localhost or HTTPS.',
                    ],
                    [
                        'Gamepad API blocked',
                        'Listen for gamepaderror and check the embedding host’s gamepad permission policy.',
                    ],
                    [
                        'No visible focus',
                        'Enable autoAddStyles or style [data-gamepad-focused="true"], and ensure the target is eligible. With useDataAttributes: false, style focusedClass instead.',
                    ],
                    [
                        'Focus moves unexpectedly',
                        'Check for overlapping services, held inputs, scope restrictions, or missing releases in host snapshots.',
                    ],
                    ['Clicks trigger twice', 'Avoid duplicating application click behavior inside select listeners.'],
                    ['Controls stop after remount', 'Construct a fresh service and register listeners in each effect.'],
                ],
            },
        ],
    },
];
