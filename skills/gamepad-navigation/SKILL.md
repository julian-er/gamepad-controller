---
name: gamepad-navigation
description: Implement gamepad-ui-engine 1.0.0 navigation policy, manual targets, dynamic focus, and explicit modal scopes.
---

# Gamepad navigation behavior

Use this skill for consumer-owned navigation behavior with `gamepad-ui-engine` **1.0.0**. Keep application policy in the application and use the public event and service APIs below.

Read [references/navigation.md](references/navigation.md) for runnable examples and invariants. `beforeaction` is synchronous: call `preventDefault()` before starting application work. An `action` event only reports an automatic action that already completed.

Treat `setElements()` as a persistent, ordered base registry. Dynamic DOM and modal scope details are in the reference. Native modal dialogs are scoped automatically when the browser supports `:modal`; applications can add nested custom scopes with `setActiveScope()` and unwind them with `clearActiveScope()`.
