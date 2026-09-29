---
type: "Reference"
title: "GamepadService methods"
description: "Choose service lifecycle, reset, scope, and shared-instance methods."
tags: ["service", "lifecycle"]
where: ["gamepad-ui-engine"]
sources:
  - title: "Public package exports"
    resource: "../../../src/index.ts"
  - title: "Service implementation"
    resource: "../../../src/service/GamepadService.ts"
  - title: "Factories"
    resource: "../../../src/factory.ts"
generated:
  by: process:maintain-documentation
  at: "2026-09-24T05:34:57.831Z"
doc_version: 1
status: draft
---
# GamepadService methods

Document version: 1 | Updated: 2026-09-24T05:34:57.831Z

Latest change: Organized this guide in the OKF knowledge base.

The current public methods are listed in [API.md](api.md#lifecycle-and-focus-methods). Use `GamepadService` directly when your application owns a component lifecycle. Use `gamepadService()` and its companion factory helpers for one shared page-level instance.

`destroy()` is full teardown. `resetInput()` is for an input-source reset or host recovery and preserves subscribers. `setActiveScope()` and `clearActiveScope()` provide explicit modal or contained-navigation scope control.
