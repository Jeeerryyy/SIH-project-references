---
name: MCCPHP Master Design System
colors:
  primary: "#0D1B2A"
  secondary: "#64748B"
  surface: "#FFFFFF"
  on-surface: "#1E293B"
  accent: "#2563EB"
  cta: "#FF6A38"
  success: "#06D6A0"
  error: "#EF4444"
  purple: "#5438DC"
  canvas: "#DBE4EF"
typography:
  body-md:
    fontFamily: Inter, "Noto Sans Devanagari", sans-serif
    fontSize: 13px
    fontWeight: 400
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  full: 9999px
---

# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## Master UI/UX Design System Specification

---

## 1. Visual Theme & Atmosphere

The **MCCPHP Design System** embodies state-scale healthcare authority, clinical calm, modern minimalism, and effortless public utility. Drawing directly from the refined **"Follow-Up" layout philosophy** and the **Maharashtra Connected Care & Public Health Platform** mandate, this visual language balances high-density clinical data with generous breathing room, clean structural cards, and high-contrast accessibility.

The aesthetic combines:
1. **The Organic Canvas Environment:** A soothing, soft blue-gray background (`#DBE4EF`) anchored by subtle geometric and organic shapes (`#3E5675` and `#06D6A0`), creating a grounded, modern backdrop.
2. **The Floating Window Architecture:** Content lives inside an elevated, smooth-cornered white card (`#FFFFFF`) featuring an internal ultra-deep navy navigation rail (`#0D1B2A`).
3. **Intentional Accent Color Coding:** 
   - **Primary Action Orange (`#FF6A38`):** High-priority clinical commits, saves, and launch triggers.
   - **Vital Teal (`#06D6A0`):** Milestone completions, positive vital trends, and synced offline states.
   - **Clinical Royal Blue (`#2563EB`):** Navigation tabs, active step underlines, and interactive links.
   - **Emergency Alert Red (`#EF4444`):** Panic alerts, high-risk flags, resuscitation triggers, and the top-level red circular `(+)` quick-action button.
   - **Boarding Pass Purple (`#5438DC`):** High-visibility queue tokens, OPD boarding passes, and cryptographic QR stubs.
4. **Devanagari Bilingual Harmony:** Typography pairs **Inter** for crisp numerals, codes, and English labels with **Noto Sans Devanagari** for Marathi (प्राथमिक भाषा) and Hindi health instructions.

---

## 2. Color Palette & Roles

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MCCPHP CORE COLOR SPECTRUM                                │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│ Deep Navy Primary │ Clinical Blue     │ Vital Teal        │ Primary Action Orange      │
│ #0D1B2A           │ #2563EB           │ #06D6A0           │ #FF6A38                    │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Ticket Purple     │ Emergency Red     │ Soft Canvas       │ Surface Card               │
│ #5438DC           │ #EF4444           │ #DBE4EF           │ #FFFFFF                    │
└───────────────────┴───────────────────┴───────────────────┴────────────────────────────┘
```

### Primary & Navigation Neutrals
- **Navy Deepest / Sidebar** (`#0D1B2A`): The signature rail neutral used for internal sidebars, branding, and structural authority.
- **Navy Dark Secondary** (`#1E293B`): Primary text color for all headings, labels, and high-emphasis data.
- **Navy Canvas Accent** (`#3E5675`): Secondary organic backdrop shape tint.

### Accent & Interaction Colors
- **Clinical Royal Blue** (`#2563EB`): Primary navigation color for active tabs, selected cards, and informational links.
- **Blue Hover** (`#1D4ED8`): Darker blue for active hover and press feedback.
- **Blue Light Tint** (`#F0F7FF` / `#EFF6FF`): Background fill for active/selected cards and informational badges.
- **Primary Action Orange** (`#FF6A38`): High-energy accent reserved for primary CTAs, continue buttons, and emergency token calls.
- **Orange Hover** (`#F05A28`): Deepened orange for button hover states.
- **Orange Light Tint** (`#FFF2ED`): Background fill for orange badges and active step indicators.

### Clinical Status & Semantic Colors
- **Vital Teal / Success** (`#06D6A0`): Signifies verified ABHA identity, completed care milestones, normal lab results, and synced offline records.
- **Teal Light Tint** (`#E6FAF5` / `#DCFCE7`): Background for active patient badges and success alerts.
- **Emergency / Panic Red** (`#EF4444`): High-risk maternal flags, critical lab panic values (e.g. Platelets < 20k), allergy hard-stops, and the red circular `(+)` quick-action button.
- **Red Light Tint** (`#FEF2F2` / `#FEE2E2`): Background for emergency patient chips and danger-sign alerts.
- **Warning Amber** (`#F59E0B`): Pending laboratory results, draft encounters, and secondary cautions.
- **Ticket Royal Purple** (`#5438DC`): OPD queue boarding passes, token headers, and verification QR code stubs.

### Grayscale & Surfaces
- **App Outer Canvas** (`#DBE4EF`): Soft, eye-friendly light blue-gray background.
- **Pure White Surface** (`#FFFFFF`): Floating window cards, component containers, and form inputs.
- **Subtle Gray Background** (`#F8FAFC`): Table headers, overview summary boxes, and form editor cards.
- **Border Light** (`#E2E8F0` / `#E5E9F0`): Clean container dividers and card outlines.
- **Border Medium** (`#CBD5E1`): Input field borders, inactive button outlines, and milestone circles.
- **Text Primary** (`#1E293B`): Dark slate for 100% readable typography.
- **Text Muted** (`#64748B`): Secondary labels, clinical descriptions, and metadata.
- **Text Light / Placeholder** (`#94A3B8`): Subtitles, date tags, and drag grip icons.

---

## 3. Typography Rules

### Font Families
- **Primary Latin & Numerals**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`
- **Primary Devanagari (Marathi / Hindi)**: `Noto Sans Devanagari`, `sans-serif`
- **Monospace (UHID / Barcode / Tokens)**: `JetBrains Mono`, `Consolas`, `monospace`

### Type Hierarchy Matrix

| Role | Font Family | Size | Weight | Line Height | Letter Spacing | Context / Usage |
|---|---|---|---|---|---|---|
| **Display Title** | Inter | `28px` | `800` | `34px` | `-0.5px` | Hub hero titles, main platform landing |
| **Card Main Title** | Inter / Noto Sans | `18px` | `700` | `24px` | `-0.2px` | Card header titles (`Timeline for Patient...`) |
| **Section Header** | Inter / Noto Sans | `15px` | `700` | `20px` | `0px` | Form editor headers, summary box headers |
| **Subsection Header** | Inter | `13px` | `600` | `18px` | `0px` | Question titles, table column values |
| **Breadcrumb Text** | Inter | `14px` | `700` | `18px` | `0px` | Top navigation hierarchy (`All Care Pathways / ...`) |
| **Tab Item** | Inter | `13px` | `600` | `18px` | `0px` | Follow-up horizontal tab strip |
| **Body Standard** | Inter / Noto Sans | `13px` | `400` | `19px` | `0px` | Clinical notes, patient history descriptions |
| **Body Small** | Inter / Noto Sans | `12px` | `400` | `16px` | `0px` | Subtitles, helper text, table cell secondary info |
| **Micro Caption / Tag** | Inter | `10px–11px`| `700` | `14px` | `+0.5px` | Upper-case meta tags (`CLINICAL ROLE`, `EXERCISES`) |
| **Token Monospace** | JetBrains Mono | `13px–14px`| `700` | `16px` | `0.5px` | Patient UHID (`MH-2026-004291`), Tokens (`#A-42`) |
| **Airport Big Code** | Inter | `32px` | `800` | `32px` | `1px` | Boarding pass origin/dest (`OPD ➔ R104`) |

---

## 4. Component Stylings & Behaviors

### 1. The Floating Window Layout Shell
- **Outer Canvas:** `.dashboard-canvas-wrapper` / `.followup-canvas`
  - Background: `#DBE4EF` with circular organic gradient shapes (`top-right: #3E5675`, `bottom-left: #06D6A0`).
- **Main Floating Window Card:** `.dashboard-window-card` / `.followup-window-card`
  - Background: `#FFFFFF`
  - Border Radius: `14px` (`var(--radius-lg)`)
  - Box Shadow: `0 25px 50px -12px rgba(15, 23, 42, 0.25)`
  - Max Width: `1240px` (centered)
  - Display: Flex row (`sidebar + content body`)

### 2. Slim Navy Internal Navigation Rail
- Width: `68px`
- Background: `#0D1B2A` (solid deep navy)
- Top Brand Logo: Circular white pill (`38px × 38px`) with blue health emblem.
- Nav Icon Buttons: `40px × 40px`, color `#778DA9`, border-radius `10px`.
  - **Hover:** Background `rgba(255, 255, 255, 0.1)`, color `#FFFFFF`.
  - **Active:** Background `rgba(255, 255, 255, 0.12)`, color `#FFFFFF`.
- Bottom User Avatar: Circular `36px × 36px` avatar with doctor initials (`RP`), background `#3B82F6`.

### 3. Top Breadcrumb Bar & Quick-Action Button
- Container: Flex row, space-between, bottom margin `20px`.
- Breadcrumbs: `14px font-weight: 700`, dark slate `#1E293B` with `#94A3B8` slashes.
- **Red Circular Action Button (`.red-circle-add-btn`):**
  - Diameter: `32px × 32px` circle.
  - Border: `2px solid #EF4444`.
  - Color: `#EF4444`.
  - **Hover:** Background `#EF4444`, Color `#FFFFFF`.

### 4. Horizontal Tab Navigation Strip
- Container: Bottom border `1px solid #E2E8F0`, gap `32px`, margin-bottom `28px`.
- Tab Item: `font-size: 13px font-weight: 600`, color `#64748B`, padding-bottom `12px`.
- **Active State:**
  - Color: `#2563EB` (Primary Blue).
  - Indicator: Continuous `3px` solid `#2563EB` pill line at bottom (`border-radius: 4px 4px 0 0`).

### 5. Horizontal Stepper & Milestone Track (Follow-Up Timeline)
- **Base Track Line:** Height `6px`, background `#E2E8F0`, rounded `9999px`.
- **Progress Fill Line:** Height `6px`, background `#06D6A0` (Vital Teal).
- **Milestone Circular Nodes:**
  - Diameter: `36px × 36px` with `4px` white halo ring.
  - Inactive: Border `2px solid #CBD5E1`, background `#FFFFFF`, text `#64748B`.
  - Completed: Background `#06D6A0`, border `#06D6A0`, text `#FFFFFF` (`🚀` or `✓`).
  - Active Percentage: Background `#06D6A0`, text `#FFFFFF` (`18%`).
- **Sub-Event Flag Pins:**
  - Positioned below the base line with flag icon (`🚩`).
  - Green pin (`#06D6A0`) for completed field checkups (e.g. *Feb 5 ASHA Home Visit*).
  - Red pin (`#EF4444`) for critical clinical triggers (e.g. *May 23 Lab Alert*).
- **Footer Countdown Chip:** `⏱ Left: 5 Months to Complete Care Cycle`.

### 6. Buttons & Actions

**Primary Action Button (Orange)**
- Background: `#FF6A38`
- Text Color: `#FFFFFF`
- Padding: `8px 20px` (Compact) / `10px 24px` (Standard)
- Border Radius: `10px` (`var(--radius-md)`)
- Box Shadow: `0 2px 4px rgba(255, 106, 56, 0.25)`
- **Hover:** Background `#F05A28`, Box Shadow `0 4px 10px rgba(255, 106, 56, 0.35)`, `transform: translateY(-1px)`

**Secondary Action Button (White Bordered)**
- Background: `#FFFFFF`
- Text Color: `#1E293B`
- Border: `1px solid #CBD5E1`
- Padding: `8px 18px`
- Border Radius: `10px`
- **Hover:** Background `#F1F5F9`, Border Color `#94A3B8`

**Clinical Blue Outline Button**
- Background: `#FFFFFF`
- Text Color: `#2563EB`
- Border: `1px solid #BFDBFE`
- Padding: `7px 16px`
- Border Radius: `8px`
- **Hover:** Background `#EFF6FF`, Border Color `#2563EB`

**Token Action Pill**
- Background: `#2563EB` (or `#EF4444` for emergency)
- Text Color: `#FFFFFF`
- Padding: `3px 10px`
- Border Radius: `9999px`
- Font Size: `11px font-weight: 600`

### 7. Form Inputs & 0–5 Rating Scale Bubbles
- **Input Fields:** Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `6px`, padding `9px 12px`, font-size `13px`. Focus: Border `#2563EB` with `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`.
- **0–5 Rating Bubbles:**
  - Container: Oval white pill with `#E2E8F0` border, gap `5px`, padding `3px 8px`.
  - Bubble: `22px × 22px` circle, border `1px solid #CBD5E1`, text `#64748B`, font-size `10px font-weight: 600`.
  - **Selected Bubble:** Background `#2563EB`, Border `#2563EB`, Text `#FFFFFF`.

### 8. OPD Queue Boarding Pass Ticket (`queue-ticket.html`)
- **Card Container:** Width `380px`, border-radius `18px`, shadow `0 20px 40px -10px rgba(84, 56, 220, 0.28)`.
- **Header Banner (`#5438DC`):** Dotted map watermark, airport route codes (`OPD ➔ R104`), glowing cyan dots (`#00F5D4`), scheduled times (`5:30 PM`).
- **Middle Body:** 2-column passenger & token metadata (`Ramesh Pawar`, `#A-42`, `RX8470 • MH-2026-004291`).
- **Perforated Tear Strip:** Semicircular cutout notches on left and right borders (`24px × 24px`), centered dashed line with `OPD BOARDING PASS` watermark text.
- **Bottom Stub:** Terminal/Wing metadata + high-density purple SVG QR code (`#5438DC`) stamped with date.

### 9. Data Tables & Progress Mini-Bars
- **Table Container:** Rounded `10px`, border `1px solid #E2E8F0`, header `#F8FAFC`.
- **Progress Track:** Width `100px`, height `5px`, border-radius `9999px`, background `#E2E8F0`.
- **Fill Variants:** Teal (`#06D6A0` for 100%), Amber (`#F59E0B` for pending), Blue (`#2563EB` for triage).

### 10. Floating Assistance Chat Bubble
- Position: Fixed bottom right (`bottom: 20px; right: 24px`).
- Size: `36px × 36px` circle with `#CBD5E1` border and `#FFFFFF` fill.
- Icon: Speech bubble `💬`, hover color `#2563EB`.

---

## 5. Layout & Spacing Principles

### 8px Spacing Grid System
- `4px`: Micro-gaps between rating bubbles, tag padding.
- `8px`: Standard button gap, breadcrumb slash spacing, tab icon gaps.
- `12px`: Spacing between form labels and inputs, option card icon margins.
- `16px`: Grid column gaps, table cell padding.
- `20px`: Navigation rail vertical icon spacing.
- `24px`: Form card interior padding, sidebar padding.
- `32px`: Floating window interior content padding, tab strip gaps.
- `40px`: Outer canvas vertical padding.

### Border Radius Scale
- `0px`: Rigid table cells, full-width dividers.
- `6px` (`var(--radius-sm)`): Form inputs, tag pills, small buttons.
- `10px` (`var(--radius-md)`): Standard buttons, option cards, summary boxes.
- `14px` (`var(--radius-lg)`): Main floating window card, large containers.
- `18px` (`var(--radius-xl)`): Boarding pass ticket container.
- `9999px` (`var(--radius-full)`): Circular avatars, rating bubbles, red `(+)` button, progress bars.

---

## 6. Depth & Elevation Matrix

| Level | Shadow CSS Property | Applied Components |
|---|---|---|
| **Flat (0)** | `none` | Canvas background, sub-panels, input fields |
| **Subtle (1)** | `0 1px 2px 0 rgba(0, 0, 0, 0.04)` | Standard table containers, option cards |
| **Medium (2)** | `0 4px 6px -1px rgba(0, 0, 0, 0.07)` | Hovered option cards, floating chat bubble |
| **Elevated (3)** | `0 10px 15px -3px rgba(0, 0, 0, 0.08)` | Modal overlays, dropdown menus |
| **Window (4)** | `0 25px 50px -12px rgba(15, 23, 42, 0.25)` | Main floating dashboard card |
| **Ticket (5)** | `0 20px 40px -10px rgba(84, 56, 220, 0.28)` | Perforated boarding pass ticket |

---

## 7. Design System Do's and Don'ts

### ✅ Do
- **Follow the Floating Window Architecture:** Always nest portal screens within the `.dashboard-window-card` / `.followup-window-card` floating container.
- **Maintain the Navy Sidebar (`#0D1B2A`):** Keep the slim internal navigation rail anchored on the left across all portals.
- **Use Action Orange (`#FF6A38`) for Primary CTAs Only:** Reserve orange exclusively for main completion actions (`Continue →`, `Save Encounter`, `Launch Protocol`).
- **Support Devanagari Typography:** Ensure Marathi text is crisp using `Noto Sans Devanagari` with generous line-heights (`1.5+`).
- **Use Red for Emergency & Quick-Add Only:** The red color is strictly reserved for danger-sign triage flags, platelet crash alerts, and the signature circular `(+)` quick-add button.
- **Keep Progress Lines Continuous:** Horizontal timeline steppers must use the solid `#E2E8F0` track with `#06D6A0` active fill and checkmark circular badges.

### ❌ Don't
- **Don't use full-screen harsh dark modes:** The base theme relies on the soft blue-gray canvas (`#DBE4EF`) with crisp white floating cards.
- **Don't mix button corner radii:** Use `10px` for standard buttons and `9999px` for pill chips.
- **Don't use orange for informational links:** Use Clinical Blue (`#2563EB`) for all secondary links and active tab indicators.
- **Don't clutter data tables:** Keep table cells clean with subtle row hover (`#FAFBFC`) and standard `100px` mini progress tracks.
- **Don't omit Marathi translations on clinical prompts:** MCCPHP is a Maharashtra state platform—always provide bilingual English/Marathi labels for citizen-facing and field prompts.

---

## 8. Agent Prompt & Implementation Quick Guide

When generating or extending any of the **9 MCCPHP Frontend Portals** (Citizen, Clinical EMR, Facility Admin, SHOC War Room, ASHA PWA, Pharmacy, Lab, Telemedicine, Audit):

1. **Outer Frame:** Wrap the page in `.dashboard-canvas-wrapper` with `.canvas-shape-top-right` and `.canvas-shape-bottom-left`.
2. **Main Card:** Use `.dashboard-window-card` (`max-width: 1240px`).
3. **Left Rail:** Include `.window-internal-sidebar` with the circular brand mark, icon stack, and user avatar.
4. **Header:** Include `.window-breadcrumbs` with the red circular `.red-circle-add-btn` on the right.
5. **Tabs:** Use `.dashboard-tab-strip` with `.dashboard-tab-item.active` having the bottom `3px solid #2563EB` indicator.
6. **Actions:** Primary actions use `.btn-primary-orange` (`#FF6A38`), secondary use `.btn-secondary-white`, links use `#2563EB`.
7. **Clinical Vitals / Timeline:** Use `.timeline-base-line` and `.milestone-badge-circle.completed` in Vital Teal (`#06D6A0`).
8. **Tokens & Passes:** Use the perforated boarding pass structure with `#5438DC` purple header and QR code stub.
