---
name: Gamepad Engine OS
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393f'
  surface-container-lowest: '#0c0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#282a2f'
  surface-container-highest: '#33353a'
  on-surface: '#e2e2e9'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#e2e2e9'
  inverse-on-surface: '#2e3036'
  outline: '#849588'
  outline-variant: '#3b4a3f'
  surface-tint: '#00e38f'
  primary: '#cdffdc'
  on-primary: '#003920'
  primary-container: '#00f59b'
  on-primary-container: '#006b41'
  inverse-primary: '#006d42'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#f4f1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#d3d3ff'
  on-tertiary-container: '#4749d5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#53ffab'
  primary-fixed-dim: '#00e38f'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005231'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#111318'
  on-background: '#e2e2e9'
  surface-variant: '#33353a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets developers, game designers, and platform engineers architecting gamepad-driven interfaces and low-latency input engines. It blends the structural rigor of developer command bars (such as Raycast) with the reactive, high-contrast spatial cues of modern console operating systems (SteamOS, Xbox Dashboard, PS5 UI).

### Core Aesthetic Pillars
- **Spatial Precision & Kinetic State:** Interfaces must clearly broadcast currently focused nodes for both 10-foot television viewports and high-density desktop displays. Navigational boundaries are razor-sharp with neon energy blooms to indicate hardware connectivity and spatial travel.
- **Hardware-Native Functionalism:** Surfaces mimic high-end carbon polymers and dark matte chassis finishes. Glass effects are restrained and non-decorative, applied strictly to preserve HUD layering without sacrificing render speed.
- **Diagnostic Transparency:** Real-time telemetry, deadzone calibrations, keymap chord graphs, and API references are treated with uniform engineering precision via monospaced accents and direct contrast hierarchies.

## Colors

The palette is engineered exclusively for an immersive, zero-eye-strain dark mode. Backgrounds step through precise charcoal tiers to construct optical elevation without reliant shadows.

### Primary Accents & Hardware Signals
- **Console Neon Green (`#00F59B`):** Denotes active polling, connected devices, spatial controller focus, and execution confirmation. Used sparingly for critical real-time states to maintain optical potency.
- **Cyber Blue (`#38BDF8`):** Applied to secondary interactive mechanics, spatial navigation vectors, wireframe controller bindings, and informational indicators.
- **Controller Indigo (`#6366F1`):** Represents structural boundaries, framework wrappers, API signatures, and deep systems plumbing.

### Surface Tonal Hierarchy
- **Canvas Base (`#0B0D12`):** Primary viewport backdrop; deepest midnight value.
- **Surface Level 1 / Dark Slate (`#121620`):** Default card surfaces, side panels, table rows, and resting control clusters.
- **Surface Level 2 / Elevated Slate (`#1A2234`):** Modals, tooltips, flyout palettes, command bars, and active code blocks.
- **Surface Level 3 / Highlight (`#242F48`):** Hover layers and resting selection wells.
- **Border Subtle (`rgba(255, 255, 255, 0.08)`): Base framing for cards and structural grids.
- **Border Pronounced (`rgba(56, 189, 248, 0.28)`):** Structural guides and inactive interactive perimeters.

### System Diagnostics
- **Warning Amber (`#F59E0B`):** Drift detection alerts, battery conservation modes, and throttling warnings.
- **Error / Disconnected Red (`#EF4444`):** Dropped frames, input thread timeouts, and button mapping collisions.
- **AI Skill Purple (`#A855F7`):** Predictive input smoothing, auto-calibration routines, and gesture heuristics.

## Typography

The typographic system separates structural display copy, long-form technical documentation, and mechanical runtime readouts into dedicated functional families.

### Type Pairings & Applications
- **Headings (Geist):** Geometric, stark, and engineered. Tight tracking (`-0.02em` to `-0.03em`) creates a compact, screen-native architecture for high-resolution displays.
- **Prose & Body (Inter):** Highly legible, neutral sans-serif that balances extensive documentation paragraphs, tables, and multi-column parameter registers.
- **Machine Readouts & Labels (JetBrains Mono):** Reserved for button glyph notations (e.g., `BTN_SOUTH`, `AXIS_L2`), telemetry rates (`1000Hz`, `0.4ms`), CLI scripts, and API parameter payloads. All caps-tracked labels reinforce hardware debug aesthetic.

## Layout & Spacing

The layout is built upon an uncompromising 8-point base module (subdivided to 4px for telemetry badges, inline tags, and split buttons). 

### Layout Grids
- **Desktop / 10-Foot HUD Mode (>= 1280px):** 12-column dynamic grid with `2rem` gutters and fluid outer margins capped at `1680px`. Left rail anchors persistent D-pad/stick navigational hierarchies, while the primary canvas displays interactive controllers, visualizers, and code mirrors.
- **Tablet / Split-Pane View (768px - 1279px):** 8-column layout with `1.5rem` gutters and `1.5rem` margins. Side docks collapse into drawer overlays triggered by shoulder button (`L1`/`R1`) or keyboard shortcut.
- **Mobile Viewport (< 768px):** 4-column layout with `1rem` gutters and `1rem` margins. Nested telemetry clusters switch from horizontal arrays to stacked vertical registers.

### Spatial Navigation Grid Philosophy
Every focusable block in the layout must calculate its spatial boundaries so directional thumbstick movements step logically between Cartesian neighbors. Gaps between grid tiles (`space-md` or `space-lg`) provide sufficient spatial buffer to prevent dual glow-bleed when nodes receive active focus.

## Elevation & Depth

This design system avoids traditional blurry drop shadows, which look washed out in deep dark interfaces. Depth is achieved via dark tonal layering, high-precision razor borders, and targeted luminescent backglows.

### The Z-Layer Continuum
- **Base Deck (0dp / `#0B0D12`):** Passive canvas background. No borders.
- **Panel Deck (1dp / `#121620`):** Modular containers, cards, and tool decks. Framed by a crisp 1px border (`rgba(255, 255, 255, 0.08)`).
- **Raised Module (2dp / `#1A2234`):** Flyout panels, contextual action shelves, code inspect windows. Border moves to `rgba(255, 255, 255, 0.14)`.
- **Command Overlays & Drawers (3dp / `#1A2234`):** Features backdrop-filter blur (`16px`) combined with dark slate tinting (`rgba(18, 22, 32, 0.85)`) to layer cleanly over active canvas elements.

### The Focus Ring & Glow Signature
Spatial controller interfaces demand instant recognition of active elements across long distances:
- **Focused State:** `box-shadow: 0 0 0 2px #00F59B, 0 0 16px rgba(0, 245, 155, 0.45);`
- **Secondary Spatial Track:** `box-shadow: 0 0 0 1px #38BDF8, 0 0 10px rgba(56, 189, 248, 0.3);`
- **Critical Interlock State:** `box-shadow: 0 0 0 2px #EF4444, 0 0 16px rgba(239, 68, 68, 0.45);`

## Shapes

The shape system adopts a technical, high-performance aesthetic: **Soft (`1`)** corner curves engineered to echo modern handheld hardware, gaming consoles, and display bezels.

### Radius Scale Rules
- **Base Components (`0.25rem` / 4px):** Micro buttons, status chips, monospaced inline code tokens, and input fields.
- **Containers & Panels (`0.5rem` / 8px):** Cards, API method containers, modal frames, and dynamic visualizers.
- **Floating Overlays & Island Bars (`0.75rem` / 12px):** Command palettes, bottom dock shelves, and toast notifications.
- **Fully Rounded (`9999px`):** Gamepad trigger meters, circular D-pad visualizers, and stick-boundary test circles.

## Components

### Buttons
- **Primary (Focus Action):** Solid `#00F59B` surface with `#0B0D12` bold typography. Hover/active shifts luminosity. Controller focus adds the signature dual neon green glow ring.
- **Secondary (Tooling):** Deep slate `#1A2234` background with 1px border (`rgba(255, 255, 255, 0.12)`) and `#38BDF8` text. Focus shifts border to `#38BDF8` with a cyber blue glow.
- **Ghost / Action Icon:** Transparent surface, white text at 70% opacity. Hover yields `#1A2234` fill. Keyboard/controller binding badges (e.g., `[A]`, `[Enter]`) are anchored to the trailing edge using JetBrains Mono in `#A855F7` or `#38BDF8`.

### Chips & Telemetry Badges
- **Status Indicator Chips:** Compact pill structures with a `0.25rem` radius. Background set to 10% accent opacity with a matching solid 1px border (e.g., Green for `POLLING_ACTIVE`, Amber for `DRIFT_COMPENSATED`, Red for `DISCONNECTED`). JetBrains Mono label text, uppercase.
- **Key Binding Pill:** Monospaced keyboard or gamepad key representation (`LB`, `RT`, `Cross`, `Circle`). Bordered in `rgba(255, 255, 255, 0.2)` with a subtle linear gradient simulating a mechanical keycap.

### Cards & Code Containers
- **API Spec & Parameter Cards:** Solid `#121620` background, 1px border `rgba(255, 255, 255, 0.08)`. Hover transitions border to `rgba(56, 189, 248, 0.4)`. Header bands partition endpoint routes or function signatures from description bodies using a solid 1px separator.
- **Code Mirrors:** Background `#07080B` (deeper than base canvas) to establish terminal recession. Left gutter displays line numbers in muted slate. Syntax highlighting uses `#00F59B` (strings/returns), `#38BDF8` (methods), `#A855F7` (keywords), and `#F59E0B` (constants).

### Inputs & Sliders
- **Deadzone / Calibration Sliders:** Track height 4px in `#1A2234`. Active range rendered in gradient `#38BDF8` to `#00F59B`. Thumb is a high-contrast 16px circular puck with an active `#00F59B` halo ring when selected.
- **Text & Value Fields:** Background `#121620`, border `rgba(255, 255, 255, 0.12)`, font Inter 14px with JetBrains Mono numbers. On focus, triggers the dual green focus glow and shifts border color to `#00F59B`.

### Checkboxes & Toggle Switches
- **Toggle Switches:** Track measures 40px × 22px with `#1A2234` resting background. Checked state switches to `#00F59B` with a `#0B0D12` toggle node. Focus deploys the system glow ring.
- **Checkboxes:** 18px square with a `0.25rem` radius. Inactive border is `rgba(255, 255, 255, 0.2)`. Checked state displays a solid `#00F59B` fill with an angled black checkmark.

### Gamepad Axis Visualizer (Domain-Specific)
- **Stick / Trigger Monitor:** 2D Cartesian coordinate plane rendered as a circle or crosshair box in `#121620` with fine vector gridlines (`rgba(255, 255, 255, 0.05)`). Real-time position displayed as an active glowing dot in `#00F59B` tracking stick deflection, with dynamic numeric readouts (`X: +0.42`, `Y: -0.88`) anchored in JetBrains Mono.
