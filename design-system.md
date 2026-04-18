# ShipKit Design System — Established Round 1

## Overview
This document establishes the visual and interaction patterns for ShipKit, an internal fulfillment operator tool. All design decisions made in Round 1 (Pick List) become the contract for Rounds 2–8. This system is intentionally opinionated and complete — it does not evolve; it repeats.

---

## Color Palette

### Logo Brand (signature colors — appear 3–5 times per screen)
| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `--logo-cyan` | `#3fc5e7` | Primary action, interactive focus | Progress bars, chevrons, primary buttons, focus states |
| `--logo-purple` | `#7122c6` | Authority, brand elevation | Progress gradient (with cyan), category headers, elevated accents |

**Gradient**: `linear-gradient(135deg, #7122c6, #3fc5e7)` — use on primary buttons, progress fills, focused row edges, top-left brand mark.

### Neutral Foundation
| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `--black` | `#070908` | Deepest background | Page bg, always with atmosphere |
| `--dark-blue` | `#081B36` | Elevated surface 1 | Cards, main containers |
| `--dark-grey` | `#363D40` | Surface 2 | Row bases, inset elements |
| `--grey` | `#A7AEB2` | Muted text | Secondary labels, helper text |
| `--white` | `#F8FAF8` | Primary text | All primary content |

### Status (functional — reserved for exact purpose)
| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `--red` | `#C23320` | OUT / error | Out-of-stock rows, destructive actions, error states |
| `--orange` | `#DC7C40` | SHORT / warning | Short-stock rows, held items, warnings |
| `--green` | `#38B837` | shipped / success | Progress complete, checked states, success messages |
| `--info` | `#3E8CE4` | Informational | Neutral notifications (not in Pick List yet) |

### Accents (decorative — used with intent)
| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `--teal` | `#74CABF` | Soft info accent | Secondary markers (not prominent in Pick List) |
| `--lime` | `#F8FF6B` | Attention grabber | New items, fresh session banner (RARE) |
| `--purple` | `#6947B8` | Secondary purple | Echo of logo-purple, alternate accents |
| `--magenta` | `#DC5D8C` | Celebration | Picking Mode active state, celebration moments |
| `--pink` | `#F5BEE9` | Soft notification | Gentle notification surfaces |
| `--gold` | `#A85D00` | Pro / premium | Pro features, power-user affordances |

---

## Typography

### Font Choices
- **Display/Brand**: Source Serif 4 (Google Fonts) — characterful serif with italic variant, used for section titles, emphasis, completion states
- **UI/Body**: Space Mono (Google Fonts) — monospace, used for all UI labels, counts, technical text, and numeric displays
- **Numeric**: Space Mono with `font-variant-numeric: tabular-nums` — ensures aligned columns for stock, qty, timestamps

### Scale
| Use | Family | Size | Weight | Letter-spacing |
|-----|--------|------|--------|-----------------|
| Section title | Space Mono | 16px | 700 | 0.5px |
| Label / Group header | Space Mono | 10px | 700 | 1.5px |
| Body text | Source Serif 4 | 13px | 400 | 0px |
| Small helper | Space Mono | 11px | 400 | 0.3px |
| Tiny (badges) | Space Mono | 9px | 700 | 0.5px |

### Rules
- **Numbers always tabular**: `font-variant-numeric: tabular-nums`
- **Italic reserved for**: completion states, soft emphasis only
- **Emoji use**: Only in "done ✦", focus indicators, and status states

---

## Motion & Animation

### Easing Curve
**All transitions use**: `cubic-bezier(0.22, 1, 0.36, 1)` — confident ease-out. No bounce. No elasticity.

### Durations
| Action | Duration |
|--------|----------|
| Hover state change | 120ms |
| State change (opacity, color) | 250ms |
| Progress bar animation | 500ms |
| Collapse/expand | 300ms |
| Row stagger cap | 500ms total |

### Row Entrance
- Stagger: 25ms offset per row
- Cap: 500ms total (not cumulative after 20 rows)
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`

### Qty Pulse (on check)
- Duration: 300ms
- Scale: 1 → 1.15 → 1
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`

### Chevron Rotation
- Duration: 200ms
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Rotate: 0° ↔ -90°

---

## 10 Reusable Primitives

### 1. Row
**Atomic list row — used in: Pick List, Print Labels, Print Slips, Scan Log, Hold Queue, Batch Cards, Inventory, History**

**Variants**: ok · short · out · unmatched · checked · focused

**Base classes**:
```css
.pick-row {
  grid-template-columns: 20px 16px 1fr auto auto auto;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(54, 61, 64, 0.2);
  border: 1px solid rgba(167, 174, 178, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Focused variant**: Left border 3px cyan, glow shadow, bg brightens to `rgba(63, 197, 231, 0.1)`

---

### 2. StatusBadge
**Pills for SHORT/OUT/NO MATCH/LOW/HELD/CANCELLED/SHIPPED/PRO**

**Mapping**:
- SHORT / LOW / HELD → orange (#DC7C40)
- OUT / CANCELLED → red (#C23320)
- SHIPPED → green (#38B837)
- PRO → gold (#A85D00)
- NO MATCH / INFO → orange (#DC7C40)

**Base classes**:
```css
.pick-badge {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
```

---

### 3. ProgressStrip
**Sticky progress bar with counter — used by: Pick List, Print Labels, Print Slips, Scan Progress**

**Structure**:
- Sticky top, z-index 10
- Thin track (5px height)
- Animated fill with brand gradient
- Counter text in Space Mono, tabular-nums
- **100% state**: gradient becomes green, text italic, color green

**Base classes**:
```css
.pick-progress-track {
  height: 5px;
  background: rgba(163, 61, 228, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.pick-progress-fill {
  background: linear-gradient(90deg, #7122c6, #3fc5e7);
  transition: width 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.pick-progress-fill.complete {
  background: linear-gradient(90deg, #38b837, #10b981);
}
```

---

### 4. StepHeader
**Collapsible section header with number + title + state pill + optional right-side action button**

**Used by**: Steps 1–5 in Scan tab

**Base structure**:
- Flex row: [chevron] [title] [summary] [action-btn]
- Chevron rotates -90° on collapse
- Easing: 200ms, `cubic-bezier(0.22, 1, 0.36, 1)`

---

### 5. PackHeader
**Uppercase tracked micro-label with rule — used by: Pick List groups, Vault date groups, History date cards, Inventory color groups**

**Base classes**:
```css
.pick-group-header {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #3fc5e7;
  border-bottom: 1px solid rgba(63, 197, 231, 0.3);
  padding-bottom: 8px;
}

.pick-group-header.unmatched {
  color: #dc7c40;
}
```

**Variants**: Default (cyan) · unmatched (orange)

---

### 6. QtyBadge
**Prominent numeric pill (×N) — used by: Pick List qty, Scan pile counts, Inventory stock, Batch scan counts**

**Base classes**:
```css
.pick-qty-badge {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #3fc5e7;
  background: rgba(63, 197, 231, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}
```

**Behavior**: Pulses (scale 1.15) on check, 300ms, `cubic-bezier(0.22, 1, 0.36, 1)`

---

### 7. CategoryMarker
**Small colored indicator (dot / bar / chip) — used by: color dots in pick list, type icons in vault, zone markers in batch cards**

**Color dot**:
```css
.pick-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

**Fallback**: #666 (grey) for unmatched items

---

### 8. PrimaryButton
**With brand-gradient variant — used by: Smart Ship, Arm Scanner, Print actions, Picking Mode**

**Base**:
```css
.pick-mode-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #7122c6, #3fc5e7);
  border: none;
  border-radius: 6px;
  color: #f8faf8;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 120ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Active state** (Picking Mode on): `background: linear-gradient(135deg, #dc5d8c, #3fc5e7)`

---

### 9. EmptyState
**Treated with color and type tastefully — used by: empty pick list, empty hold queue, empty history, empty vault**

**Base classes**:
```css
.pick-empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #a7aeb2;
  font-size: 13px;
  border: 2px dashed rgba(63, 197, 231, 0.2);
  border-radius: 8px;
  font-style: italic;
  background: rgba(63, 197, 231, 0.02);
}
```

---

### 10. ToastMessage
**Notification patterns by status (success/warn/error/info)**

**Mapping**:
- Success → green (#38B837)
- Warning/Held → orange (#DC7C40)
- Error/Out → red (#C23320)
- Info → info-blue (#3E8CE4)

**Position**: Fixed bottom-right, 20px margin, 300ms fade

---

## Atmospheric Details (Established)

### 1. Gradient Mesh Background
```css
/* Logo-purple blob top-right at 5% opacity, 900px blur */
background: radial-gradient(ellipse at center, rgba(113, 34, 198, 0.05) 0%, transparent 70%);

/* Logo-cyan blob bottom-left at 3% opacity, 900px blur */
background: radial-gradient(ellipse at center, rgba(63, 197, 231, 0.03) 0%, transparent 70%);
```

### 2. SVG Grain Overlay
- 3% opacity over entire viewport
- Turbulence filter with 0.9 amplitude, 3 octaves
- Subtle texture only visible to eye at screen edges

### 3. Dashed Corner Marks
- 4 corners (top-left, top-right, bottom-left, bottom-right)
- 1px dashed border, 4px width/height
- Color: `--grey` (#A7AEB2) at 40% opacity
- Terminal-UI reference

### 4. ShipKit Brand Mark
- Top-left corner in display font (Source Serif 4) italic
- "ops" or "ShipKit" (1px brand-gradient underline)
- 30% opacity, pointer-events-none

### 5. Keyboard Hint Strip
**At bottom of Pick List**:
```html
[space] check · [j/↓] next · [k/↑] prev · [esc] exit
```
- Font: Space Mono 10px
- Color: grey with accent kbd styling
- Appears only when picking mode is active

---

## Interaction Patterns (Established)

### Check Row
1. User clicks checkbox or row
2. → sessionStorage updates immediately
3. → Opacity fades to 0.4
4. → Strike-through animates on color name
5. → Qty badge pulses (1 → 1.15 → 1 over 300ms)
6. → Focus auto-advances to next unchecked row

### Keyboard Navigation (when Picking Mode active)
- **Space**: Toggle focused row
- **J / ArrowDown**: Next unchecked row
- **K / ArrowUp**: Previous unchecked row
- **Esc**: Exit Picking Mode

### Progress at 100%
1. Progress fill animates from brand gradient → green
2. Counter text becomes italic and green
3. **Optional**: Single-line sweep animation, --magenta flash, or no extra flourish (designer's call)

### Group All Checked
1. "done ✦" marker appears at group header right
2. Header rule transitions to green
3. Marker fades in over 300ms

### Focus Row ("Now Picking")
- **Left edge**: 3px cyan border
- **Glow**: `box-shadow: inset 0 0 20px rgba(63, 197, 231, 0.1), 0 0 12px rgba(63, 197, 231, 0.15)`
- **Background**: `rgba(63, 197, 231, 0.1)`
- **Text**: Slightly brighter
- **Auto-advance**: Focus moves to next unchecked row when current row is checked

---

## What NOT to Do

1. ❌ Use rounded-2xl cards with 48px padding (generic SaaS feel)
2. ❌ Single-hue purple gradient heroes
3. ❌ Glassmorphism blur stacks
4. ❌ Icon-plus-text rows that look mobile
5. ❌ Use color outside its defined role (e.g., red for pending, green for warning)
6. ❌ Mix fonts beyond Source Serif 4 + Space Mono
7. ❌ Animate with spring physics or bounce easing
8. ❌ Use Inter, Roboto, Poppins, Geist, or system-ui
9. ❌ Add features that don't fit the aesthetic (too many icons, too much whitespace, etc.)
10. ❌ Stray from the established palette — no custom accent colors per-section

---

## Implementation Checklist for Rounds 2–8

- [ ] Import Source Serif 4 and Space Mono from Google Fonts
- [ ] Define CSS variables for all color tokens
- [ ] Implement ProgressStrip (if section has progress)
- [ ] Implement Row primitive with all variants
- [ ] Add PackHeader + group structure (if grouped)
- [ ] Use Space Mono for all labels, counts, timestamps
- [ ] Establish motion: 250ms state changes, 200ms hover, 500ms progress
- [ ] Add keyboard hint strip if applicable
- [ ] Test focus row treatment (luminous border + glow + auto-advance)
- [ ] Verify all status colors map correctly to functional meaning
- [ ] Proof: No colors used outside their defined role
- [ ] Proof: All motion uses `cubic-bezier(0.22, 1, 0.36, 1)` and durations match chart

---

## Contact

Design lock: Round 1, Pick List, established.
Questions on primitives or atmospheric details? Refer to this doc and the `pick-list.tsx` + `pick-list.css` source of truth.
