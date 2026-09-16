# Gamepad Controller consumer skills

`gamepad-controller` **1.0.0** is being prepared for its first publication and includes four portable consumer skills in the package’s `skills/` directory. They are guidance for an AI coding harness; installing the npm package does not register them automatically.

| Skill | Use it for |
| --- | --- |
| `gamepad-integrate` | Installing and initializing the library in vanilla JavaScript, React, or Angular. |
| `gamepad-navigation` | Cancellable actions, manual targets, dynamic UI, focus, and modal scopes. |
| `gamepad-webview2` | The WinUI/WebView2 custom-event snapshot transport. |
| `gamepad-debug` | Input, focus, host transport, configuration, and lifecycle diagnosis. |

Each folder is self-contained. Copy the whole folder, including `references/`, to **one** of these project-local destinations. Do not install the same skill into multiple destinations in one project: that can cause duplicate discovery.

| Harness | Destination |
| --- | --- |
| Codex | `.agents/skills/<skill-name>/` |
| Claude Code | `.claude/skills/<skill-name>/` |
| GitHub Copilot | `.github/skills/<skill-name>/` |

## Install from npm or a repository checkout

Choose the skill and harness before copying. The following examples use `gamepad-integrate` and Codex; replace both names as needed.

### Windows PowerShell

```powershell
$source = 'node_modules/gamepad-controller/skills/gamepad-integrate'
$destination = '.agents/skills/gamepad-integrate'

if (Test-Path -LiteralPath $destination) {
  throw "Skill already exists: $destination. Review, merge, or remove it deliberately."
}

New-Item -ItemType Directory -Force -Path '.agents/skills' | Out-Null
Copy-Item -Recurse -LiteralPath $source -Destination $destination
```

For a repository checkout, set `$source` to `skills/gamepad-integrate` in that checkout. Do not overwrite an existing skill folder without reviewing its local changes.

### macOS, Linux, or Git Bash

```sh
source_dir='node_modules/gamepad-controller/skills/gamepad-integrate'
destination='.agents/skills/gamepad-integrate'

test ! -e "$destination" || {
  printf 'Skill already exists: %s\n' "$destination" >&2
  exit 1
}
mkdir -p .agents/skills
cp -R "$source_dir" "$destination"
```

## Use in each harness

### Codex

Place the folder in `.agents/skills/<skill-name>/`. Ask, for example:

```text
Use $gamepad-integrate to add gamepad-controller to this React application and clean it up on unmount.
```

Codex skill support and automatic selection depend on the installed Codex version. Explicitly naming the skill is the most reliable invocation.

### Claude Code

Place the folder in `.claude/skills/<skill-name>/`. Ask, for example:

```text
Use the gamepad-navigation skill to keep gamepad focus inside this custom checkout dialog.
```

Claude Code discovers project skills according to its installed version and configuration. If it does not surface a copied skill, verify that the folder contains `SKILL.md` directly under the selected destination.

### GitHub Copilot

Place the folder in `.github/skills/<skill-name>/`. Ask, for example:

```text
Use gamepad-debug to find why selection fires twice after this component remounts.
```

GitHub Copilot agent-skill support varies by product and version. In repositories where the selected Copilot surface does not load project skills, use the copied `SKILL.md` as project guidance or upgrade to a supported surface.

## Update or remove

To update, compare the copied folder with the new package or checkout, then replace that single skill folder only after preserving any consumer-specific edits. To remove, delete only the selected copied skill directory (for example, `.agents/skills/gamepad-integrate`); it does not remove the npm package.

These skills were statically checked as portable Markdown folders. They were not executed inside Claude Code or GitHub Copilot from this repository.

## Harness references

The project-local destinations and invocation guidance above follow the current published harness documentation:

- [Codex: Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code: Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [GitHub Copilot: Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
