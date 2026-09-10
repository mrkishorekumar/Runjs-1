---
name: RunJS
description: Fast, client-side, developer-first coding playground and learning environment
colors:
  primary: "#0f172a"
  primary-hover: "#1e293b"
  primary-dark: "#f0f6fc"
  primary-dark-hover: "#e6edf3"
  neutral-bg: "#f8fafc"
  neutral-bg-dark: "#0e1117"
  surface: "#ffffff"
  surface-dark: "#161b22"
  surface-elevated: "#ffffff"
  surface-elevated-dark: "#1f242c"
  border: "#e2e8f0"
  border-dark: "#30363d"
  border-focus: "#3b82f6"
  border-focus-dark: "#388bfd"
  text-primary: "#0f172a"
  text-primary-dark: "#f0f6fc"
  text-secondary: "#475569"
  text-secondary-dark: "#8b949e"
  text-muted: "#94a3b8"
  text-muted-dark: "#6e7681"
  accent-js: "#facc15"
  accent-ts: "#3b82f6"
  accent-amber: "#f59e0b"
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

## Colors

The palette is anchored around neutral monochrome slates with crisp borders and purposeful language/state accents.

- **Surface & Background**:
  - Light mode: Canvas `--bg-app` (`#f8fafc`), Surface `--bg-surface` (`#ffffff`), Elevated `--bg-surface-elevated` (`#ffffff`), Hover `--bg-surface-hover` (`#f1f5f9`).
  - Dark mode: Canvas `--bg-app` (`#0e1117`), Surface `--bg-surface` (`#161b22`), Elevated `--bg-surface-elevated` (`#1f242c`), Hover `--bg-surface-hover` (`#262c36`).
- **Borders**:
  - Subtle `--border-subtle` (`#f1f5f9` / `#21262d`), Default `--border-default` (`#e2e8f0` / `#30363d`), Hover `--border-hover` (`#cbd5e1` / `#484f58`).
  - Focus Ring `--border-focus` (`#3b82f6` in light / `#388bfd` in dark).
- **Text & Contrast**:
  - Primary text `--text-primary` (`#0f172a` / `#f0f6fc`).
  - Secondary text `--text-secondary` (`#475569` / `#8b949e`).
  - Muted text `--text-muted` (`#94a3b8` / `#6e7681`).
- **Brand & Domain Accents**:
  - JavaScript Yellow (`#facc15` / `amber-500`).
  - TypeScript Blue (`#3b82f6`).
  - Active/Favorite states use amber tint overlays (`amber-500/15`).

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
