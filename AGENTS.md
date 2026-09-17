# Repository guidance

Preserve unrelated working-tree changes. Read the relevant source and existing tests before
editing, and keep changes within the requested task.

Agents proposing branches or pull requests must follow [CONTRIBUTING.md](CONTRIBUTING.md) for
branch naming, required checks, commit/PR title format, and the PR template — `main` is
protected by a repository ruleset (see [RELEASING.md](RELEASING.md#one-time-setup)) and only
takes changes through a green PR.

## Consumer skills

For library integration work, including the documentation site's interactive examples, read
the applicable canonical skill below **and its linked reference material** before implementing.
Combine skills when a task crosses these boundaries.

| Task | Skill | Reference |
| --- | --- | --- |
| Initialize a vanilla, React, or Angular consumer; own service cleanup | [gamepad-integrate](skills/gamepad-integrate/SKILL.md) | [Integration](skills/gamepad-integrate/references/integration.md) |
| Customize actions, dynamic targets, focus, or modal scopes | [gamepad-navigation](skills/gamepad-navigation/SKILL.md) | [Navigation](skills/gamepad-navigation/references/navigation.md) |
| Produce or consume custom-event snapshots, including browser simulation | [gamepad-webview2](skills/gamepad-webview2/SKILL.md) | [Host protocol](skills/gamepad-webview2/references/host-protocol.md) |
| Diagnose input, focus, transport, or lifecycle failures | [gamepad-debug](skills/gamepad-debug/SKILL.md) | [Diagnostics](skills/gamepad-debug/references/diagnostics.md) |

Browser simulation uses the snapshot protocol; it does not require a native WebView2 host.
For example, a React demo needs integration guidance; adding simulated input also needs the
host protocol. Read navigation guidance when the demo adds custom actions or dialogs.

These links are repository guidance, not automatic harness skill registration. Read the
existing `skills/` folders directly here; keep them self-contained and do not copy them into
`.agents/skills` or change harness configuration for repository work. Optional installation
for consumer projects is documented in [Consumer skills](docs/AGENT_SKILLS.md).

## Public API and validation

Consumer examples and website runtime code must import from the `gamepad-ui-engine` public
entry point, not private library modules. Check behavior against the current
[public exports](src/index.ts) and [API guide](docs/API.md).

Use the existing commands and maintenance guidance in [Building](docs/BUILDING.md) for
library changes and the [website README](website/README.md) for documentation-site changes.
Run checks appropriate to the affected behavior; UI interactions need browser verification
as well as automated tests. Record actual results and unverified hardware/browser limits,
following the site's [verification record](website/VERIFICATION.md). Documentation and
sample claims must match the current public API.
