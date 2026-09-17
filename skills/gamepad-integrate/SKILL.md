---
name: gamepad-integrate
description: Integrate gamepad-ui-engine 1.0.0 in a vanilla JavaScript, React, or Angular browser application, including safe lifecycle cleanup.
---

# Integrate gamepad-ui-engine

Use this skill when the user wants to add or initialize `gamepad-ui-engine` in a browser application. It covers the public API of version **1.0.0**. Use imports from `gamepad-ui-engine`; do not rely on package internals.

Create a service after the target DOM exists, subscribe before `init()`, and call `destroy()` when that application feature is discarded. `destroy()` clears subscriptions, input state, and manual targets. A later `init()` starts a fresh lifecycle, so re-register them first.

Choose the framework section in [references/integration.md](references/integration.md). For host-fed input, read the `gamepad-webview2` skill instead. For custom policy or modal behavior, read the `gamepad-navigation` skill.

Keep the user in control of the application’s structure and cleanup location. Do not install packages, alter application routing, or add styling unless the request calls for it.
