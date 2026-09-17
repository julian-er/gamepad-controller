# Navigation patterns for gamepad-ui-engine 1.0.0

## Cancellable actions

`beforeaction` runs synchronously before an automatic effect. The event is:

```ts
type GamepadActionEvent = {
  type: 'move' | 'select' | 'back' | 'shoulder' | 'scroll';
  gamepad: Gamepad;
  target: Element | null;
  direction?: 'up' | 'down' | 'left' | 'right';
  button?: string;
  defaultPrevented: boolean;
  preventDefault(): void;
};
```

For button-triggered actions the order is raw edge, `beforeaction`, at most one automatic effect, then `action` on successful completion. Analog input and held-input repeats do not require a fresh edge. Cancelled or unsuccessful effects do not emit `action`. A listener's presence does not cancel anything; calling `preventDefault()` does. A throwing pre-action listener suppresses that action's default effect. Do async work only after cancelling synchronously.

```ts
service.on('beforeaction', (event) => {
  if (event.type !== 'select' || !(event.target instanceof HTMLButtonElement)) return;

  event.preventDefault();
  void submitWithApplicationRouter(event.target);
});

service.on('action', (event) => {
  console.info('Automatic action completed:', event.type);
});
```

Holding the primary button selects once per press; releasing it is required before another automatic selection. Held direction and right-stick input may repeat according to the configured debounce settings.

## Manual elements and dynamic UI

```ts
const targets = [
  document.querySelector('#shipping')!,
  document.querySelector('#payment')!,
  document.querySelector('#confirm')!,
];

service.setElements(targets);
targets.length = 0; // does not alter the service registry

// After an application-rendered DOM change:
service.refresh();
```

`setElements()` copies the supplied array. Its order is retained as the base index order, and hidden or detached references stay registered. Returned `getElements()` arrays cannot mutate the registry. A target becomes usable again when it is attached and eligible; do not resubmit it just because it was briefly hidden.

The service skips ineligible targets, including detached, hidden, disabled, inert, or out-of-scope elements. It rechecks eligibility before focus or activation. Browser focus follows gamepad focus for eligible `HTMLElement` targets, and an eligible keyboard or pointer focus transition becomes the next gamepad-navigation origin.

## Native and custom modal scopes

An open native `<dialog>` that matches `:modal` is automatically treated as the navigation scope. If native focus is already inside a modal, that modal wins; otherwise the last matching open modal in document order is used. Use `setActiveScope()` for custom dialogs, nested application scopes, or browsers where native `:modal` support is unavailable. When both are active, a target must be inside both scopes.

For a custom dialog, make inactive UI inert using the application’s normal dialog behavior, then set the explicit scope after the dialog is visible:

```ts
const dialog = document.querySelector('#checkout-dialog') as HTMLElement;
const launch = document.querySelector('#open-checkout') as HTMLElement;

function openCheckout() {
  launch.setAttribute('aria-expanded', 'true');
  dialog.hidden = false;
  service.setActiveScope(dialog);
  service.refresh();
}

function closeCheckout() {
  dialog.hidden = true;
  // Restore the background UI's inert state before restoring its focus.
  service.clearActiveScope();
  launch.setAttribute('aria-expanded', 'false');
  launch.focus();
  service.refresh();
}
```

`setActiveScope(scope)` limits automatic focus and navigation to descendants of `scope`. Each new non-null scope saves the previous scope and focus target. `clearActiveScope()` restores the preceding explicit scope and restores its prior focus when it is eligible; when the explicit stack is empty, native `:modal` detection applies again. Passing `null` to `setActiveScope()` clears the current explicit scope directly, so use `clearActiveScope()` to unwind a nested scope.

For a native `<dialog>`, normal `showModal()`/`close()` behavior is sufficient where `:modal` is supported. Call `setActiveScope(dialog)` after `showModal()` only when an explicit application scope is required, and pair it with `clearActiveScope()` after close.
