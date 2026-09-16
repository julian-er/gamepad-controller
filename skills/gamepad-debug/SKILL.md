---
name: gamepad-debug
description: Diagnose gamepad-controller 1.0.0 input, focus, custom-host transport, and lifecycle failures in a consumer application.
---

# Debug gamepad-controller

Use this skill to diagnose an application using `gamepad-controller` **1.0.0**. Start by collecting the smallest reproducible sequence; do not change application behavior before distinguishing browser input, host transport, lifecycle, and focus policy.

Read [references/diagnostics.md](references/diagnostics.md) for an event probe and symptom-to-cause checks. For a WinUI/WebView2 bridge, use the full snapshot sequence from the `gamepad-webview2` skill.
