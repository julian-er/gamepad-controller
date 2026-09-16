# Design System Specification: `gamepad-controller` Documentation Platform

## 1. Design Philosophy & Brand Identity

### Aesthetic: Obsidian Mint
- **Visual Identity:** Modern, elegant, developer-friendly dark mode (inspired by Vercel, Tailwind CSS docs, and Stripe). Balanced contrast without saturated fluorescent neons or aggressive glows.
- **Core Tenet:** Clarity, legibility, and effortless cognitive flow. Focus states are clear and tactile, guiding the user naturally through spatial navigation concepts without visual fatigue or informational overload.

---

## 2. Color Palette & Token Hierarchy

### Canvas & Surfaces (Obsidian Slate)
- **Base Canvas:** `#0A0E17` (Deep dark backdrop)
- **Surface / Cards:** `#0F131C` (Primary panel and card surface)
- **Surface Low:** `#181B25` (Elevated card containers and subtle sections)
- **Surface Container:** `#1E222D` (Active states and interactive panels)
- **Borders:**
  - Subtle: `rgba(255, 255, 255, 0.06)`
  - Default: `rgba(255, 255, 255, 0.10)`
  - Hover: `rgba(255, 255, 255, 0.20)`

### Accent Color (Mint & Complements)
- **Primary Brand Accent (Mint):** `#10B981` (Warm, natural emerald mint; used for active statuses, pills, and focus cues)
- **Mint Subtle:** `rgba(16, 185, 129, 0.10)` (Tag/badge backgrounds, selection tint)
- **Mint Border:** `rgba(16, 185, 129, 0.35)`
- **Secondary Tones:**
  - Sky Blue: `#38BDF8` (Types, parameters)
  - Soft Indigo: `#818CF8` (Informational cues)
  - Warning: `#F59E0B`
  - Danger: `#F43F5E`

### Focus & Accessibility
- Clean double ring without exaggerated neon bloom:
  `box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.1);`
  with smooth, subtle transition (`transform: translateY(-1px); transition: 150ms ease`).

---

## 3. Typography & Information Hierarchy

- **UI Headings & Body:** `Geist Sans` / `Inter`
- **Code & API Reference:** `JetBrains Mono` / `Fira Code`
- **Simplified Information Architecture:**
  1. **Clean Hero Playground:** Minimalist controller preview with on-screen D-Pad controls and a clean 4-target interactive destination grid.
  2. **3-Step "How It Works" Flow:** High-level, approachable conceptual steps (*Detect & Connect*, *Spatial Navigation*, *Smooth Interactions*) rather than verbose telemetry streams.
  3. **Quick Integration:** Tabbed code snippet under 10 lines of code (Vanilla TS, React Hook, Angular).
  4. **Essential AI Prompts:** 3 actionable prompt cards with clean copy triggers.
  5. **Core API Table:** Streamlined 4-method reference (`init`, `setActiveScope`, `on`, `destroy`).
