---
type: "Feature Guide"
title: "Gamepad action detection"
description: "Understand button edges, held input, cancellation, and action completion."
tags: ["input", "actions"]
where: ["gamepad-ui-engine"]
sources:
  - title: "Input pipeline"
    resource: "../../../src/input/InputPipeline.ts"
  - title: "Action dispatch"
    resource: "../../../src/actions/ActionDispatcher.ts"
generated:
  by: process:maintain-documentation
  at: "2026-09-24T05:34:57.831Z"
doc_version: 1
status: draft
---
# Gamepad action detection

Document version: 1 | Updated: 2026-09-24T05:34:57.831Z

Latest change: Organized this guide in the OKF knowledge base.

Primary selection is press-edge based: holding the primary button produces one automatic selection and requires release before another. Directional navigation and right-stick scrolling may repeat while held according to their debounce options.

Raw button edges emit `buttondown` and `buttonup`. Analog movement and held-input repeats do not require new button edges. Automatic actions use the common synchronous `beforeaction` event and completion `action` event. See [API.md](../foundations/api.md#events) for the action object and cancellation contract.

For changes-only custom hosts, send full press and release snapshots in order. The library retains held directional and scrolling state between unchanged snapshots; explicit release, disconnect, or `resetInput()` clears it.
