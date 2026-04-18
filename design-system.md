# ShipKit Design System — Round 1

## Tokens

| Token | Value | Usage |
|-------|-------|-------|
| **bg** | `#0f0a1a` | Page background |
| **surface** | `#1a1230` | Card/panel bg |
| **surface-2** | `#2d1f42` | Row/element bg |
| **surface-3** | `#3d2d52` | Hover/active state bg |
| **border** | `#5a4a7a` | Dividers, borders |
| **accent** | `#5ce0d0` | Primary teal — rare, precious |
| **secondary** | `#a78bfa` | Violet — gradients, accents |
| **teal** | `#3fc5e7` | Group headers, focus borders |
| **green** | `#10b981` | Success, complete state |
| **yellow** | `#f59e0b` | Warning — SHORT, unmatched |
| **red** | `#ef4444` | Error/critical — OUT |
| **text** | `#ffffff` | Primary text |
| **muted** | `#b8a7d0` | Secondary text, hints |
| | | |
| **shadow-card** | `0 8px 32px -8px rgba(92,40,160,0.3), 0 2px 8px rgba(0,0,0,0.4)` | Card elevation |
| **shadow-glow** | `0 0 24px rgba(92,224,208,0.15)` | Focus glow on rows |
| **shadow-inset** | `inset 0 1px 0 rgba(255,255,255,0.04)` | Subtle inner highlight |
| | | |
| **ease** | `[0.22, 1, 0.36, 1]` | All motion (cubic-bezier) |
| **stagger-delay** | `25ms` | Row entrance (cap 500ms) |
| **row-hover-transition** | `120ms` | Row state changes |
| **progress-transition** | `500ms` | Progress bar width |
| **pulse-duration** | `300ms` | Qty badge on check |
| **chevron-rotation** | `200ms` | Collapse toggle |

### Fonts (Google Fonts / Fontshare)

```tailwind
fontFamily: {
  display: ["'Instrument Serif'", "serif"],
  sans:    ["'General Sans'", "sans-serif"],
  mono:    ["'JetBrains Mono'", "monospace"],
}
```

## Primitives

### 1. **Row** (base primitive)

The foundation for all list items across the app. Used by: pick list, print labels, print slips, scan log, batch cards, held queue, inventory.

**Tailwind classes:**
```
flex items-center gap-3 px-3 py-2 rounded-lg border-l-2
bg-surface-2 border-l-transparent hover:bg-surface-3
transition-all duration-150 cursor-pointer
```

**States:**
```jsx
// OK (default)
<div className="bg-surface-2 border-l-transparent text-text" />

// SHORT (warning)
<div className="bg-gradient-to-r from-[#3d2e00] to-[#2d1f42] border-l-yellow-500 text-yellow-400" />

// OUT (error)
<div className="bg-gradient-to-r from-[#3d1515] to-[#2d1f42] border-l-red-500 text-red-400" />

// Unmatched
<div className="bg-surface-2 border-l-dashed border-l-muted text-muted" />

// Checked (any state + opacity)
<div className="opacity-40 line-through" />

// Focused (ok state + glow)
<div className="border-l-accent shadow-glow" />
```

### 2. **ProgressStrip** (sticky progress bar)

Persistent progress indicator. Used by: pick list, print labels, print slips, scan session.

**Tailwind:**
```
h-1 w-full rounded-full bg-white/6 overflow-hidden
motion:width 0.5s cubic-bezier(0.22,1,0.36,1)
bg-gradient-to-r from-accent to-secondary
```

**At 100%:** Solid `bg-green`, shimmer stops, counter becomes `italic text-green`.

### 3. **StatusBadge** (pill indicator)

Semantic status label. Used by: pick list (SHORT/OUT/NO MATCH), held queue (expired/expiring), inventory (LOW/OUT), history (cancelled/disputed).

**Tailwind:**
```
px-2 py-0.5 rounded-md text-xs font-semibold border-0
```

**Variants:**
```jsx
// SHORT
<span className="bg-yellow-500/20 text-yellow-400">SHORT</span>

// OUT
<span className="bg-red-500/20 text-red-400">OUT</span>

// NO MATCH
<span className="bg-yellow-500/20 text-yellow-400">NO MATCH</span>
```

### 4. **QtyBadge** (large teal pill)

Quantity indicator with accent glow. Used by: pick list (×N required), pile cards (card count), inventory (stock count).

**Tailwind:**
```
px-3 py-1 rounded-lg bg-teal/20 text-teal font-mono font-semibold
```

**Pulse animation:** scale 1 → 1.15 → 1, 300ms ease, triggers on check only.

### 5. **PackHeader** (uppercase group label)

Reusable section divider. Used by: pick list groups (2PK, 4PK, UNMATCHED), vault dates, history dates.

**Tailwind:**
```
text-xs font-bold tracking-widest uppercase border-b border-teal/30 pb-2
text-teal
```

**Complete state:** Add `text-green italic` "done ✦" tag (fade in 300ms).

### 6. **StepHeader** (collapsible section header)

Found in Step 1-5 cards. Structure: chevron + step-num + title + state badge.

**Tailwind:**
```
flex items-center gap-2 pb-4 border-b border-border/40
```

Chevron rotates -90° on collapse, 200ms ease.

### 7. **Kbd** (keyboard hint)

Text-only keyboard legend. Used by: pick list, scan session, vault.

**Tailwind:**
```
text-xs font-mono text-muted
```

Example: `[space] check · [j/k] move · [esc] exit`

### 8. **Checkbox** (shadcn primitive)

Custom checkbox with green accent-color on check.

**Tailwind:**
```
h-5 w-5 accent-green cursor-pointer
focus:outline-2 focus:outline-accent/40 focus:outline-offset-2
```

### 9. **ColorDot** (visual indicator)

Small circular swatch for color variant. Used in: pick list, inventory.

**Tailwind:**
```
h-3 w-3 rounded-full flex-shrink-0
style={{ backgroundColor: colorHex }}
```

Gray (`bg-gray-600`) for unmatched.

### 10. **Atmosphere** (page-level)

Subtle ambient gradient mesh + noise for depth.

**CSS:**
```css
/* Radial gradient mesh (fixed) */
::before {
  radial-gradient(ellipse at top-right 6%, rgba(167,139,250,0.12));
  radial-gradient(ellipse at bottom-left 4%, rgba(63,197,231,0.08));
  800px blur;
}

/* SVG noise at 3% opacity */
::after {
  feTurbulence numOctaves="3"
  opacity: 3%
}

/* Dashed corner marks (4 corners, 4px segments, 40% opacity) */
border-l/top/r/bottom 2px muted opacity-40
```

## Motion Values (as constants)

```typescript
// Easings
export const EASE = [0.22, 1, 0.36, 1];

// Durations (ms)
export const DURATION = {
  stagger: 25,      // per row
  stagger_cap: 500, // max total entrance
  hover: 120,
  progress: 500,
  pulse: 300,
  chevron: 200,
  fade: 300,
};

// Variants (motion/react)
export const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * DURATION.stagger, DURATION.stagger_cap),
      duration: 400,
    },
  }),
};

export const pulseVariants = {
  rest: { scale: 1 },
  pulse: { scale: 1.15, transition: { duration: DURATION.pulse, ease: EASE } },
};
```

## Example Snippets

### Row (Pick List Item)

```jsx
<motion.div
  custom={index}
  initial="hidden"
  animate="visible"
  variants={rowVariants}
  className={`
    flex items-center gap-3 px-3 py-2 rounded-lg border-l-2
    transition-all duration-${DURATION.hover}
    ${checked ? 'opacity-40' : ''}
    hover:bg-surface-3 cursor-pointer
    ${status === 'short' ? 'bg-gradient-to-r from-[#3d2e00] to-[#2d1f42] border-l-yellow-500 text-yellow-400' : ''}
    ${status === 'out' ? 'bg-gradient-to-r from-[#3d1515] to-[#2d1f42] border-l-red-500 text-red-400' : ''}
    ${focused ? 'border-l-accent shadow-glow' : 'bg-surface-2 border-l-transparent'}
  `}
  onClick={() => toggle(key)}
>
  <Checkbox checked={checked} onChange={toggle} className="accent-green" />
  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex }} />
  <div className="flex-1">
    <div className="font-medium">{color}</div>
    <div className="text-xs opacity-70">stock: {stock}</div>
  </div>
  {status === 'short' && <Badge className="bg-yellow-500/20 text-yellow-400">SHORT</Badge>}
  <motion.div
    animate={checked ? 'pulse' : 'rest'}
    variants={pulseVariants}
    className="px-3 py-1 rounded-lg bg-teal/20 text-teal font-mono font-semibold"
  >
    ×{qty}
  </motion.div>
</motion.div>
```

### ProgressBar (100% complete)

```jsx
<div className="h-1 w-full rounded-full bg-white/6 overflow-hidden">
  <motion.div
    animate={{
      width: '100%',
      background: '#10b981',
    }}
    transition={{ duration: 500, ease: EASE }}
    className="h-full"
  />
</div>
<p className="text-xs font-mono italic text-green">complete ✓</p>
```

### PackHeader (done state)

```jsx
<div className="flex items-center gap-2 border-b border-teal/30 pb-2">
  <span className="text-xs font-bold tracking-widest uppercase text-teal">2PK</span>
  {allGroupItemsChecked && (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 300, ease: EASE }}
      className="text-xs font-semibold text-green italic"
    >
      done ✦
    </motion.span>
  )}
</div>
```

## Constraints (Do Not Violate)

- **Fonts:** No Inter, Roboto, Poppins, Geist, Space Grotesk, system-ui.
- **Gradients:** Never purple-to-pink primary. Teal-to-violet accents only.
- **Hover:** Never `scale-105 shadow-xl`. Use `surface-2 → surface-3` + border brightening.
- **Motion:** No spring, no bounce. Always `ease [0.22, 1, 0.36, 1]`.
- **Spacing:** Tight + breathable, never overcrowded or sparse.
- **Icons:** Text symbols only (✓, ✦, ×). Never emoji.
- **Shadows:** `shadow-card` for elevation, `shadow-glow` for focus, `shadow-inset` for subtle depth.

---

**Next rounds will follow this system. Do not deviate; extend.**
