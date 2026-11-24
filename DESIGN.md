# Design System — IELTS Max

## Visual World: British Examination Hall & Studio Dispatch

IELTS Max operates as a calm, high-legibility academic examination and study workspace rather than a generic SaaS dashboard. Every surface separates long-form reading comfort from operational precision through hairline borders, tabular numerals, and a committed Oxford Ink Navy navigation shell.

## Color Tokens

### Light Theme (Archival Examination Paper)
- **Canvas Ground (`--background`):** `#F8F7F4` (warm archival alabaster)
- **Work Sheets (`--card`, `--popover`):** `#FFFFFF` with `1px solid #E5E2DC` hairline rules
- **Persistent Navigation Shell (`--shell`):** `#0F2537` (Oxford Ink Navy) with `#F3F6F9` foreground and `#9DB2C4` muted labels
- **Primary Action & Completion (`--primary`):** `#0D6E6E` (British Exam Teal)
- **Active Selection Tint (`--accent`):** `#E6F2F1` with `#094D4D` text
- **IELTS Test Milestones & Streaks (`--milestone`):** `#B45309` on `#FEF3C7`
- **Success / Stamped State (`--success`):** `#166534` on `#DCFCE7`
- **Isolated Destructive (`--destructive`):** `#B91C1C` (outline-only until hover/focus in admin tables)

### Dark Theme (Respects OS `prefers-color-scheme` + Settings Override)
- **Canvas Ground:** `#0C141C`
- **Elevated Sheets:** `#131F2B` with `1px solid #243444` hairlines
- **Shell Rail:** `#091118`
- **Primary Action:** `#14B8A6`
- **Milestone Accent:** `#F59E0B` on `#2D210B`

Color scheme switching uses `<meta name="color-scheme" content="light dark">` synchronized with `:root` CSS rules and a 3-state control (`System`, `Light`, `Dark`) inside the Display & Account Settings dialog.

## Typography

- **UI & Navigation (`--font-figtree`):** Figtree — clean humanist geometric sans for dense controls, tables, and navigation.
- **Long-Form Reading & Exam Passages (`--font-source-serif`):** Source Serif 4 — constrained to 65–72ch measure with `1.75–1.8` line-height for articles, podcasts, and IELTS reading passages.
- **Timers, Scores, Band Figures & Question Numbers (`--font-jetbrains-mono`):** JetBrains Mono with `font-variant-numeric: tabular-nums` so counters and tables never jitter.
- **Heading & Prose Wrapping:** `text-wrap: balance` on `h1–h3`; `text-wrap: pretty` on `p, li`.

## Signature Components & Responsive Architecture

1. **24-Day Examination Passport Matrix:** 24 fixed-structure day cells displaying stamped completion, open status, locked status, logged duration, and amber-flagged IELTS Test Days (`06`, `12`, `18`, `24`).
2. **Navigation Shell:** 256px Oxford Ink Navy fixed rail on desktop (`lg+`) transforming into a sticky top header and safe-area-padded 6-tab bottom bar on mobile (`env(safe-area-inset-bottom)` + `scroll-padding-bottom`), with `44px` minimum touch targets under `@media (pointer: coarse)`.
3. **Single-Row Scrollable Skill Tabs (`.task-tablist`):** Never wraps onto multiple rows; uses a 3px `border-block-end` pseudo-element on `[aria-selected="true"]` for non-color WCAG 1.4.1 compliance.
4. **Container-Query Responsive Tables (`.responsive-table-wrap`):** Admin rosters, submission queues, and cohort leaderboards use `container-type: inline-size` with sticky headers on desktop and automatic stacked cards with `data-label` prefixes below `640px`.
5. **Computer-Delivered IELTS Exam Runner:** Split-pane Passage + Questions on desktop switching cleanly to a Passage/Questions toggle on mobile, paired with a sticky bottom question-number tick rail and scratchpad notes.
