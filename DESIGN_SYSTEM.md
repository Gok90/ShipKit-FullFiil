# ShipKit Design System — Pick List Foundation (Round 1)

## Overview
This document defines the visual primitives and component patterns established by the Pick List component. These will scale across 12+ sections of ShipKit in follow-up rounds.

---

## Color Palette

### Semantic Colors
- **`--cyan-accent`**: `#3fc5e7` — Primary action, highlights, focus states. Used for item quantity badges, headers, progress fill
- **`--emerald`**: `#10b981` — Success, completion states, checkmarks, "done" tags
- **`--amber`**: `#f59e0b` — Warning states (SHORT items, NO MATCH badges)
- **`--red`**: `#ef4444` — Critical states (OUT items)

### Surface Layers
- **`--bg`**: `#0f0a1a` — Canvas
- **`--surface`**: `#1a1230` — Card base
- **`--surface2`**: `#2d1f42` — Hover lift
- **`--surface3`**: `#3d2d52` — Pressed/elevated
- **`--border`**: `#5a4a7a` — Dividers

### Text
- **`--text`**: `#ffffff` — Primary
- **`--muted`**: `#b8a7d0` — Secondary

---

## Typography

### Font Stack
- **UI**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Mono**: `'JetBrains Mono', monospace` (tracking numbers, stock, quantities)

### Scale
- **Label**: `text-xs` (10px)
- **Metadata**: `text-xs` (12px)
- **Body**: `text-sm` (14px)
- **Heading**: `text-base` (16px)

### Weight
- **Regular**: 400
- **Medium**: 500 (badges, labels)
- **Semibold**: 600 (headers, highlights)
- **Bold**: 700 (row titles, call-to-action text)

---

## Components & Patterns

### Row Base
All clickable rows (pick items, file uploads, batch cards) follow this pattern:
```
[checkbox] [icon/dot] [primary | secondary] [status badge] [qty badge]
```

**States:**
- **Normal**: `bg-slate-800/30 border-slate-600/40`, text slate-200
- **Hover**: Border brightens to `slate-500/60`
- **Checked**: `opacity-50`, checkbox fills emerald
- **SHORT**: `bg-amber-950/40 border-amber-700/40`, text amber-300
- **OUT**: `bg-red-950/40 border-red-700/40`, text red-300
- **UNMATCHED**: `bg-slate-800/40 border-slate-600/40`, text slate-400

### Progress Indicator
- **Track**: `h-1 bg-slate-800 rounded-full`
- **Fill**: Animates width with `duration-300`, color changes on complete
  - In-progress: `bg-cyan-500`
  - Complete (100%): `bg-emerald-500`
- **Label**: `text-xs text-slate-300 font-mono`, right-aligned

### Badge System
Three badge types:
1. **Status Badge** (SHORT, OUT, NO MATCH): `text-xs font-bold px-2 py-1 rounded`, contextual bg + text
2. **Quantity Badge**: `text-sm font-bold text-cyan-400 px-2 py-1 bg-cyan-950/40 rounded`
3. **Group Tag** (✓ done): `text-xs text-emerald-400 flex items-center gap-1`

### Header Patterns
- **Section Header**: `text-xs font-bold tracking-wider uppercase` + contextual color (cyan for normal, amber for unmatched)
- **Group completion**: Show `✓ done` tag inline when all items in group are checked

### Interactions
- **Collapse**: ChevronDown icon rotates -90deg on toggle, smooth transition
- **Checkbox click**: Fires item toggle immediately, no loading state
- **Keyboard**: Tab through rows, Space to toggle, arrow keys to navigate
- **Select All**: "All" / "Clear" button toggles entire list state

---

## Spacing & Layout

### Density
- **Header gap**: `gap-4` (16px between left/center/right sections)
- **Row gap**: `space-y-1` (4px between items)
- **Group gap**: `space-y-3` (12px between groups)
- **Padding**: `px-4 py-3` (16px horizontal, 12px vertical)

### Responsive
- No breakpoints in this component; designed for warehouse/desktop first
- Mobile: May implement full-screen picking mode in future

---

## Animation & Motion

All animations under 400ms, no bounce (linear or ease).

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Progress fill | width | 300ms | ease-out |
| Chevron collapse | rotate | 200ms | ease |
| Checkbox | scale + fill | 200ms | ease-out |
| Group completion tag | fade-in | 200ms | ease-out |
| Row hover | border-color | 150ms | ease |

---

## Accessibility

- **Focus**: All interactive elements have visible focus ring (`outline-2 outline-offset-2`)
- **Color contrast**: All text meets WCAG AA (4.5:1 minimum)
- **Keyboard nav**: Full tabindex support, Space to toggle, arrow keys for lists
- **ARIA**: `role="button"` on clickable rows, `aria-pressed` on toggle buttons
- **Screen readers**: All labels/badges semantic

---

## Reusable Primitives (for future rounds)

These will be extracted into shared components/utilities:

1. **`<RowBase />`** — Checkbox + icon + info + badges + qty
2. **`<ProgressBar />`** — Track + animated fill + percentage label
3. **`<BadgeGroup />`** — Status (SHORT/OUT) + quantity + group completion
4. **`<GroupHeader />`** — Title + optional completion tag
5. **`<HeaderRow />`** — Filter buttons + progress + collapse toggle
6. **Color swatches** — Circular or square dot with fallback gray
7. **Status badge utilities** — Mapped `PickStatus` → colors/text

---

## Data Contract

The `PickListData` shape is consumed as-is from `buildPickListData()`:

```typescript
interface PickListData {
  totalToPull: number;     // Sum of all reqQty
  short: number;           // Count of status: 'short'
  out: number;             // Count of status: 'out'
  groups: PackGroup[];
}

interface PackGroup {
  packName: string;        // "2pk", "4pk", "UNMATCHED"
  items: PickItem[];
}

interface PickItem {
  color: string;           // "Black", "Charcoal"
  colorHex: string | null; // "#000000" or null
  reqQty: number;          // 3, 8, 12, etc.
  stock: number | null;    // 5, 0, or null (unknown)
  status: PickStatus;      // "ok" | "short" | "out" | "unmatched"
  checkKey: string;        // "pick_Black_2pk"
}
```

---

## States & Modes

### Collapsed
- Only header visible, chevron rotates -90deg
- All content hidden with `display: none`

### Picking Mode
- Button changes to red "⏹ Exit"
- (Can be extended for full-screen, voice guidance, or haptic feedback)

### Progress Completion
- When `percentage === 100`:
  - Progress bar color changes to emerald
  - Footer shows "All N items picked" with checkmark
  - Could trigger celebration UI in parent

---

## Extensibility

This component is designed for:
- **Template string rendering** (backend builds HTML strings)
- **React port** (this version)
- **Vue/Svelte** (future)

The `SAMPLE_GROUPS` data shape is stable and testable independently.

---

## Next Steps

In Round 2+, extract:
1. RowBase component with status mapper
2. ProgressBar primitive
3. BadgeGroup utility
4. Settings for spacing/sizing (adjust for density if needed)

All color tokens are already CSS variables, allowing easy theming.
