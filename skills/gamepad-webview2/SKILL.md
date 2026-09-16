---
name: gamepad-webview2
description: Configure and troubleshoot the gamepad-controller 1.0.0 custom-event snapshot protocol for a WinUI/WebView2 host.
---

# WebView2 host input

Use this skill when a WinUI/WebView2 or comparable native host forwards gamepad input to a page using `gamepad-controller` **1.0.0**. The custom events are a transport, not an authentication boundary.

Read [references/host-protocol.md](references/host-protocol.md) for the exact event names, payload schema, page setup, reset/recovery requirements, and host trust boundary. Preserve full snapshots and their delivery order. Do not replace them with partial button updates.
