---
name: RunJS
description: Fast, client-side, developer-first coding playground and learning environment
colors:
  primary: "#171d26"
  primary-hover: "#242c38"
  primary-dark: "#f0f6fc"
  primary-dark-hover: "#e6edf3"
  neutral-bg: "#f6f8fa"
  neutral-bg-dark: "#0b0f14"
  surface: "#ffffff"
  surface-dark: "#11161d"
  surface-elevated: "#ffffff"
  surface-elevated-dark: "#161c24"
  border: "#d8dee4"
  border-dark: "#252d3a"
  border-focus: "#f59e0b"
  border-focus-dark: "#f59e0b"
  text-primary: "#171d26"
  text-primary-dark: "#f0f6fc"
  text-secondary: "#57606a"
  text-secondary-dark: "#919bb0"
  text-muted: "#8c959f"
  text-muted-dark: "#647085"
  accent-js: "#f59e0b"
  accent-ts: "#3b82f6"
  accent-react: "#06b6d4"
  accent-html: "#f97316"
  accent-amber: "#f59e0b"
  status-success: "#10b981"
  status-warning: "#f59e0b"
  status-error: "#f43f5e"
  status-info: "#3b82f6"
  status-async: "#a855f7"
typography:
  sans:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  navbar-height: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
---

# Design System

<!-- impeccable:design-schema 1 -->

## Overview

RunJS employs a clean, high-density, tool-first interface tailored for developers and learners. The visual tone is utilitarian, calm, and uncluttered, prioritizing editor workspace area, code legibility, responsive parity across desktop and mobile devices, and fast visual feedback. The UI implements full light and dark mode parity driven by semantic CSS custom properties.

## Colors & Palette Strategy

RunJS applies a purposeful, role-based color strategy where color encodes action, domain identity, execution phase, and operational status rather than decorative slop.

### 1. Surface & Canvas Neutral Hierarchy
- **Canvas `--bg-app`**: `#f6f8fa` (light) / `#0b0f14` (dark) — Deep base canvas for code editors and application split-panes.
- **Surface `--bg-surface`**: `#ffffff` (light) / `#11161d` (dark) — Primary toolbars, card surfaces, and data tables.
- **Elevated Surface `--bg-surface-elevated`**: `#ffffff` (light) / `#161c24` (dark) — Modals, dropdown menus, and popovers.
- **Interactive Hover `--bg-surface-hover`**: `#f1f4f8` (light) / `#1c232d` (dark).
- **Active Selection `--bg-surface-active`**: `#e7ecf2` (light) / `#242c38` (dark).
- **Muted Inset `--bg-surface-muted`**: `#f3f5f8` (light) / `#0e1218` (dark) — Table headers, sub-tabs, and terminal trays.

### 2. Borders & Focus Rings
- **Subtle `--border-subtle`**: `#ebf0f4` (light) / `#1a2029` (dark) — Inset dividers and internal cell rules.
- **Default `--border-default`**: `#d8dee4` (light) / `#252d3a` (dark) — 1px container boundaries.
- **Hover `--border-hover`**: `#b6bec6` (light) / `#374254` (dark).
- **Focus Ring `--border-focus`**: Amber `#f59e0b` (`focus-visible:ring-2 focus-visible:ring-amber-500/60`).

### 3. Text Hierarchy & WCAG AA Contrast Rule
- **Primary Text `--text-primary`**: `#171d26` (light) / `#f0f6fc` (dark) — High-contrast body copy and code symbols.
- **Secondary Text `--text-secondary`**: `#57606a` (light) / `#919bb0` (dark) — Supporting labels, hints, and explanations.
- **Muted Text `--text-muted`**: `#8c959f` (light) / `#647085` (dark) — Monospace IDs, shortcuts, and metadata captions.
- **Contrast Guarantee**: Raw 500-level hues (e.g. `text-amber-500`, `text-emerald-500`, `text-cyan-500`) have insufficient contrast (<4.5:1) against white surfaces. All functional labels and badge texts use paired shades: `text-{color}-600 dark:text-{color}-400`.

### 4. Domain & Tool Identities
- **JavaScript & RunJS Core**: Amber (`#f59e0b`, text: `text-amber-600 dark:text-amber-400`, surface: `bg-amber-500/10 border-amber-500/20`). Primary run action uses solid amber (`bg-amber-500 hover:bg-amber-400 text-black`).
- **TypeScript**: Blue (`#3b82f6`, text: `text-blue-600 dark:text-blue-400`, surface: `bg-blue-500/10 border-blue-500/20`). Primary run action uses solid blue (`bg-blue-600 hover:bg-blue-500 text-white`).
- **React + Vite**: Cyan (`#06b6d4`, text: `text-cyan-600 dark:text-cyan-400`, surface: `bg-cyan-500/10 border-cyan-500/20`).
- **HTML / CSS / Web**: Orange (`#f97316`, text: `text-orange-600 dark:text-orange-400`, surface: `bg-orange-500/10 border-orange-500/20`).

### 5. Semantic Status & Diagnostic Roles
- **Success / Accepted / Easy / O(1)**: Emerald (`#10b981`, text: `text-emerald-600 dark:text-emerald-400`, surface: `bg-emerald-500/10 border-emerald-500/20`).
- **Warning / Attempted / Medium / O(n)**: Amber (`#f59e0b`, text: `text-amber-600 dark:text-amber-400`, surface: `bg-amber-500/10 border-amber-500/20`).
- **Error / Wrong Answer / Hard / O(n²)**: Rose (`#f43f5e`, text: `text-rose-600 dark:text-rose-400`, surface: `bg-rose-500/10 border-rose-500/20`).
- **Async / Microtasks / Deep Dives / TLE**: Purple (`#a855f7`, text: `text-purple-600 dark:text-purple-400`, surface: `bg-purple-500/10 border-purple-500/20`).

## Typography

- **Interface Font**: Inter (`--font-sans`), system fallback (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
- **Code & Terminal Font**: System monospace (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`).
- **Scale**:
  - Caption / Micro: `10px` – `12px` (badges, counts, metadata pills, tab headers).
  - Body / Controls: `13px` – `14px` (editor controls, form inputs, button labels, table rows).
  - Headers / Titles: `16px` – `20px` (modal headers, view headlines, cards).
  - Large Headings: `24px` – `32px` (landing hero, welcome screens).

## Layout

- **Fixed Navigation Bar**: 48px height (`h-7vh` / `var(--spacing-7vh)`), pinned at top with border bottom, flex container for branding, direct route links, dropdown menus, and utility actions.
- **Full Viewport Workspaces**: Playgrounds utilize remaining viewport height (`calc(100vh - 48px)`).
- **Splitpanes & Resizing**:
  - Split views use custom draggable gutters (6px width/height).
  - Responsive stacking: vertical layout on mobile devices, side-by-side on viewport `sm` and above.
- **Modals & Dialogs**: Centered overlay with backdrop blur (`dialog::backdrop` with `rgba(0, 0, 0, 0.6)` and `blur(4px)`).

## Elevation & Depth

- **Flat/Tonal Layering**: RunJS avoids heavy skeuomorphic shadows, relying primarily on borders (`var(--border-default)`) and background contrast layers.
- **Shadow Tokens**:
  - Subtle: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (dark: `rgba(0, 0, 0, 0.3)`).
  - Card: `0 4px 6px -1px rgba(0, 0, 0, 0.07)` (dark: `rgba(0, 0, 0, 0.4)`).
  - Elevated / Modal: `0 10px 25px -5px rgba(0, 0, 0, 0.08)` (dark: `rgba(0, 0, 0, 0.5)`).

## Shapes

- **Borders & Corner Radii**:
  - Micro Badges & Tags: `rounded-md` (`6px`) or `rounded-full` for numeric counters.
  - Buttons, Inputs & Cards: `rounded-lg` (`8px`).
  - Floating Tooltips & Menus: `rounded-xl` (`12px`).
- **Dividers**: 1px solid dividers throughout tables, split panels, and header bars.

## Components

- **Badges**: Inline-flex pills with icons, category text, and enclosed count bubble. Active states apply 15% opacity accent fill with 40% border.
- **Buttons**:
  - Primary: Solid background (`bg-[var(--color-primary)]`), text contrast, `rounded-lg`, subtle transition on hover.
  - Secondary/Ghost: Surface background with subtle border, transitioning to hover surface background.
- **Inputs & Search**:
  - Clear icon on left, optional trailing action/clear button. Focus applies 2px ring with 30% border-focus opacity.
- **Modals**:
  - Rounded container (`rounded-xl` or `rounded-2xl`), elevated shadow, explicit header with close icon, content body, and sticky footer action buttons.

## Do's and Don'ts

### Do's
- Use semantic CSS variables (`var(--bg-surface)`, `var(--text-primary)`, `var(--border-default)`) for any new UI element to maintain automatic dark mode parity.
- Keep toolbar and control density tight (`px-2.5 py-1.5` or `px-3 py-2`) to maximize code view area.
- Ensure desktop and mobile parity: any interactive feature on desktop must degrade into a mobile-friendly drawer, accordion, or responsive stack.

### Don'ts
- Do not introduce hardcoded light/dark hex colors directly inside Tailwind utilities (avoid `bg-white` or `bg-gray-900`; use `bg-[var(--bg-surface)]` or semantic tokens).
- Do not use oversized margins or padding in IDE workspace views that reduce code editor real estate.
- Do not add intrusive animated decorative elements that distract from coding or problem solving.
