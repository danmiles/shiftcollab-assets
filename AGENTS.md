<!--
Component / Artifact: Shift Collab - Assets Repository Master Instructions (AGENTS.md)
Repository: shiftcollab-assets
Version: v5.0
Date: 2026-11-05
Changelog:
- Tailored exclusively for shiftcollab-assets (ConvertCalculator CDN Engine deployed via Cloudflare Pages).
- Locked target file scope to css/calc__matching-funnel__styles.css and js/calc__matching-funnel__scripts.js.
- Codified ADHD Clinic (#adhd-clinic_form) ID-scoping rules and dark ivy theme protections.
- Codified mobile in-flow footer architecture (banning position: fixed viewport traps on mobile).
- Enforced strict ES6+ (no var), no :root blocks, and zero Cyrillic in code/comments.
-->

# shiftcollab-assets

This repository hosts production frontend assets (CSS & JS) for the **Shift Collab ConvertCalculator Matching & Intake Funnels** (`/start`, `/a/start-today`, `/clinic/adhd`, `/clinics/*`). 

Assets are automatically deployed globally via **Cloudflare Pages** (`shiftcollab-assets.pages.dev`) upon pushing to the `main` branch.

---

## 1. REPOSITORY STRUCTURE & TARGET FILES

All modifications in this repository MUST strictly target only these two core assets:
1. **Unified Stylesheet:** `css/calc__matching-funnel__styles.css`
2. **Unified Logic Engine:** `js/calc__matching-funnel__scripts.js`

*Do NOT create secondary stylesheet duplicates, unprompted build folders, or random HTML embeds.*

---

## 2. CORE ARCHITECTURAL RULES & GUARDRAILS

### 1. Mobile In-Flow Footer Architecture (STRICT)
- **Absolute Ban on `position: fixed` on Mobile (`max-width: 768px`):**
  - The mobile questionnaire footer (`.form-get-started_footer`) MUST sit in natural document flow (`position: relative !important; bottom: auto !important;`) inside the card container.
  - NEVER use `position: fixed` to dock the footer to the viewport on mobile—iOS WebKit 3D transforms inside ConvertCalculator break viewport containment and trap fixed elements.
  - Set `border-radius: 0 !important;` on the mobile footer so the parent Webflow card cleanly clips the corners via its own `border-radius` and `overflow: hidden`.
  - Maintain generous vertical breathing room (`padding: 16px 14px !important;`) on mobile portrait (`max-width: 479px`).

### 2. ADHD Clinic Scoped Theming (`#adhd-clinic_form`)
- **Strict ID Scoping:** All clinic-specific overrides MUST be scoped exclusively to `#adhd-clinic_form`.
- **Canvas Colors:** Enforce Dark Ivy (`#16434a` / `var(--ivy-title-color)`) on `.calculator`, `.cc-calculator`, `.cc`, and view containers. Never let global `#cloud` (`#e7e6e1`) leak into the clinic card.
- **Start Button:** Must remain brand Peach (`var(--peach, #eea880)`) with Ivy text (`#16434a`) and Sand hover (`var(--sand, #b36e48)`). On mobile screens (`< 440px`), enforce `white-space: nowrap !important;` and compact padding (`14px 26px !important;`) to prevent text wrapping.
- **Range Slider:** Must retain its white pill container (`#adhd-clinic_form .sc-KzItE { background-color: var(--pure-white, #ffffff) !important; padding: 20px !important; }`).
- **No Decorative Arrow:** The start button arrow (`.start-page_button-arrow`) MUST be suppressed under `#adhd-clinic_form` (`display: none !important;`).

### 3. Decorative CTA Arrow (`.start-page_button-arrow`)
- Displayed ONLY on main intake funnels (`/start`), pointing into the "START NOW" CTA.
- Desktop (`min-width: 992px`): Positioned absolutely above-left of the CTA button. Coordinates must stay safely inside the container bounds to avoid `overflow: hidden` clipping.
- ADHD Clinic: Strictly hidden.

### 4. Navigation Button Alignment & Fallback Safety
- In `.footer_content`, always use `margin-right: auto !important; max-width: 45% !important;` on `.footer_progress-bar`.
- The navigation buttons (`.footer_button-wrapper` with PREVIOUS/NEXT and `[data-selector-element-id='P2DRnZJbuvYuLmo6f']` with SEE YOUR RESULTS) must remain grouped together on the far right.
- NEVER apply unconditional `display: flex !important;` or `display: block !important;` to `[data-selector-element-id='P2DRnZJbuvYuLmo6f']`. Always respect ConvertCalculator's native hidden classes (`.cc__element--hidden`, `style*="display: none"`).
- **DOM Integrity (Zero Node Reparenting):** Never use `document.body.appendChild()` or move footer DOM nodes out of ConvertCalculator. Tearing nodes out of its React tree breaks event delegation and degrades buttons to static fallback links (`<a href="convertcalculator.com">`).

---

## 3. CODE HYGIENE & CODING STANDARDS

1. **Modern JavaScript (Strictly No `var`):**
   - Use `const` by default, `let` only for reassignment. Never use `var`.
   - Native ES6+ across all evergreen browsers.
2. **Absolute Ban on `:root` Variable Blocks:**
   - NEVER declare `:root { ... }` or re-declare CSS variables.
   - Consume native tokens directly via `var(--ivy-title-color)`, `var(--peach)`, `var(--pure-white)`, etc.
3. **Language Protocol (Zero Cyrillic in Code):**
   - ALL code, CSS rules, FormulaScript, JSON, regex, and code comments (`// ...`, `/* ... */`) **MUST BE 100% IN ENGLISH**.
4. **Mandatory Artifact Versioning:**
   - Increment the file version header on every commit and update the `Changelog:` bullet points accurately.