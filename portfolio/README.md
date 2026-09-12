# [YOUR NAME] — Portfolio

A single-purpose, dependency-free portfolio site built to the **"Frosted glass
cathedral at midnight"** design system in `DESIGN.md`. Plain HTML/CSS/JS —
no build step, no framework.

## Project structure

```
portfolio/
├── index.html            Page structure and copy (placeholders bracketed)
├── css/
│   ├── tokens.css        Design tokens transcribed 1:1 from DESIGN.md
│   ├── base.css           Reset, root typography, focus states
│   ├── components.css     Buttons, cards, badges, inputs, eyebrows, icon tiles
│   ├── layout.css         Header/nav, hero, sections, footer
│   └── animations.css     Reveal-on-scroll + hero load sequence
├── js/
│   └── main.js            Mobile menu, scroll reveal, view toggle, contact form
├── assets/
│   ├── icons/              Drop custom SVGs here if you replace the inline ones
│   └── images/              Drop your photo / project screenshots here
└── README.md
```

Nothing here needs a bundler. Open `index.html` directly, or serve the folder
with any static server (`npx serve .`, `python3 -m http.server`, Netlify,
Vercel, GitHub Pages, etc).

## Filling in your content

Every piece of content the design brief didn't supply is marked with an
**ALL_CAPS placeholder in brackets** — e.g. `[YOUR NAME]`, `[PROJECT_1_TITLE]`,
`[GITHUB_URL]`. Search `index.html` for `[` to find every one. Key ones:

| Placeholder | Where | Notes |
|---|---|---|
| `[YOUR NAME]` | `<title>`, nav logo, hero, about, footer | Appears ~6 times |
| `[YOUR TITLE]` | `<title>`, hero tagline, about | e.g. "Frontend Engineer" |
| `[WHAT_YOU_BUILD]` | Meta description, hero tagline | e.g. "design systems and product UI" |
| `[RESUME_URL]` | Header CTA | Link to a hosted PDF |
| `[GITHUB_URL]` / `[LINKEDIN_URL]` / `[EMAIL]` | Header, contact, footer | Update all instances |
| `[PROJECT_N_*]` | Selected Work cards (×4) | Title, one-line description, link, and a 16:10 image; the `onerror` attribute on each `<img>` hides broken images gracefully until you add real ones |
| `[YOUR_PHOTO]` | About section | 4:5 portrait; same graceful-fallback behavior |
| `[N]` | About stats | Years building / projects shipped / clients |

Add or remove project cards by copying/deleting an `<article class="project-card glass-card">` block — the CSS grid and the grid/list toggle both adapt automatically.

## Fonts

DESIGN.md specifies three licensed typefaces (aeonikPro, Untitled Sans,
dotDigital) that aren't publicly distributable, so the build ships their
listed metric-compatible substitutes via Google Fonts:

| Spec font | Loaded substitute | CSS variable |
|---|---|---|
| aeonikPro | Space Grotesk | `--font-aeonikpro` |
| Untitled Sans | Inter | `--font-untitled-sans` |
| dotDigital | JetBrains Mono | `--font-dotdigital` |

If you own licenses for the original faces, replace the `<link>` tags in
`index.html`'s `<head>` with `@font-face` declarations and point the same
three CSS variables in `css/tokens.css` at them — no other file needs to
change.

## Maintaining the aesthetic when you extend the site

- **Never hand-pick a new color.** Every color is a CSS variable in
  `css/tokens.css`, sourced from `DESIGN.md`'s token table. Reuse an existing
  variable; don't introduce a new hex value.
- **Violet is reserved.** `--color-void-violet` / `.btn-cta` is used exactly
  once in this build — the contact form's submit button — matching the
  spec's rule that it's the only chromatic, non-monochrome surface. Don't
  apply it to nav links, section CTAs, or decoration.
- **Borders are always the frosted hairline**, never a solid stroke:
  `box-shadow: var(--shadow-subtle)` (or one of the `--shadow-subtle-*`
  variants), not `border: 1px solid`.
- **Radius follows the component, not the whim**: `--radius-buttons` (999px)
  for every clickable pill, `--radius-cards` (16px) for cards/modals,
  `--radius-inputs` / `--radius-badges` (6px) for fields and tags,
  `--radius-iconcontainers` (9999px) for circular tiles. Don't mix families.
- **New sections should open with the eyebrow pattern**: `.eyebrow-row` +
  `.eyebrow` + a centered `.section-heading` with a max-width-640px body
  line — this is what gives every section the same "cathedral" rhythm.
- **Elevation is glow, not shadow.** Reuse `--elevation-card` /
  `--elevation-modal`; don't add a plain `box-shadow: 0 4px 12px black`.

## Deployment

Any static host works as-is:

- **Netlify / Vercel**: drag-and-drop the `portfolio/` folder, or connect the
  repo — no build command needed (leave the build command blank, publish
  directory `.` or `portfolio`).
- **GitHub Pages**: push `portfolio/`'s contents to the repo root (or a
  `docs/` folder) and enable Pages in repo settings.
- Set `[RESUME_URL]` to a hosted PDF (S3, Drive share link, or a copy placed
  in `assets/`) before publishing.

## Wiring up the contact form

`js/main.js` currently simulates a submission (validates, shows a success
message, resets the form) with no backend. To make it real, swap the
`window.setTimeout` block in the form handler for a `fetch()` call to:

- A form service (Formspree, Resend, Getform) — usually just a `fetch(url, { method: 'POST', body: new FormData(contactForm) })`, or
- Your own serverless function / API route.

Keep the existing disabled-state and status-message logic; only the network
call itself needs replacing.

## Accessibility & performance notes

- Skip link, visible focus rings, `aria-live` form status, and
  `prefers-reduced-motion` handling are already in place — keep them when
  editing.
- No JS framework, no build tooling, no icon font: total payload is a few
  KB of hand-written CSS/JS plus three Google Font families. Compress and
  lazy-load (`loading="lazy"` is already set) any project screenshots or
  portrait you add, and keep them under ~200KB each for a fast first paint.

---

## DESIGN.md compliance checklist

| Requirement (from DESIGN.md) | Status | Where implemented |
|---|---|---|
| Midnight canvas `#05060f` base, full-bleed | ✅ | `body` background, `tokens.css` |
| Blueprint grid layer, 1px lines, ~80–100px cells, edge-fade mask | ✅ | `.bg-grid`, `layout.css` |
| Conic-gradient spotlight halo at hero top | ✅ | `.bg-spotlight`, `layout.css` |
| aeonikPro (sub. Space Grotesk) for display headings only, weight 500 | ✅ | `--font-aeonikpro`, applied only to `h1`–`h4` |
| Untitled Sans (sub. Inter) for body/UI | ✅ | `--font-untitled-sans`, default `body` font |
| dotDigital (sub. JetBrains Mono) for eyebrow labels, 0.10em tracking | ✅ | `.eyebrow`, `components.css` |
| Skywash gradient (`#d8ecf8→#98c0ef`) on wordmark & largest headings only | ✅ | `.gradient-text`, applied to hero `h1` and all `.section-heading h2/h3` — never on body text or buttons |
| Type scale (12/14/16/18/24/28/44/48px) matches token table | ✅ | `tokens.css` |
| Single violet accent (`#663af3`), used only for auth/form submit CTA | ✅ | `.btn-cta`, used exclusively on the contact form's "Send message" button |
| No additional chromatic accents introduced | ✅ | Palette stays monochrome blue-white + the one violet CTA |
| Hairline borders = 1px inset `rgba(186,215,247,0.12)`, never solid strokes | ✅ | `--shadow-subtle` used throughout; no `border:` declarations on cards/buttons/inputs |
| Elevation via inset glow + dark halo, not conventional drop-shadow | ✅ | `--elevation-card`, `--elevation-modal` (three-layer inset+halo stacks per spec) |
| Buttons: 999px pill radius; cards/modals: 16px; badges/inputs: 6px; icon containers: 9999px — no mixing | ✅ | `components.css`, one radius token per component class |
| Section eyebrow flanked by fading hairlines, centered | ✅ | `.eyebrow-row::before/::after` |
| Section rhythm: eyebrow → 44–48px centered heading → single muted body line, max ~640px | ✅ | `.section-heading` |
| Section gap 120px, card padding 24px, element gap 16px | ✅ | `--section-gap`, `--card-padding`, `--element-gap` applied via `.section` / `.glass-card` / flex/grid gaps |
| Page max-width 1200px, centered | ✅ | `.container` |
| Glass Card (feature): 16px radius, ~3% frost tint, no hard border | ✅ | `.glass-card`, project + about-stat cards |
| Auth-form-style modal card: 16px radius, near-opaque dark fill, 3-layer shadow | ✅ | `.modal-card`, reused as the contact form container (only place this component's role fits a portfolio) |
| Text input: 6px radius, frost fill, focus raises border opacity | ✅ | `.field input/textarea`, `:focus` state |
| Feature icon tile: circular, ~56px, line-art mono glyph | ✅ | `.icon-tile`, skills row |
| Pill button (ghost + outlined variants) | ✅ | `.btn-ghost`, `.btn-outline` |
| Badge/tag: 6px radius, translucent fill, 12px text | ✅ | `.badge`, project tags |
| Theme toggle component (segmented pill control) | ✅ (repurposed) | Built as `.segmented` control for the Selected Work grid/list view — see note below |
| WorkOS/AuthKit-specific wordmark, "AuthKit" branding, product copy | ❌ intentionally omitted | This is a personal portfolio, not the AuthKit product — see note below |
| `[PROJECT_DATA]` / `[IMAGE_PATHS]` / `[SOCIAL_LINKS]` | ⚠️ Placeholders used | Bracketed throughout `index.html`, per your "Missing Data" instruction |

**Two intentional adaptations**, both allowed by your brief since DESIGN.md
is a style/token reference, not portfolio content:

1. **Theme Toggle → view toggle.** The spec's light/dark segmented control
   exists to demo the AuthKit product's own light-mode support, and the
   Do/Don't list explicitly says not to add light-theme colors to the core
   palette. Rather than build an unused dark/light switch, the same
   segmented-pill component is repurposed as a grid/list toggle for the
   Selected Work section — same visual language, an actual job to do here.
2. **Auth-Form Modal Card → contact form.** Its literal spec role is
   "floating login/signup card," but the elevation, radius, and — crucially
   — the violet CTA button are all scoped by the spec to *form submission*.
   The contact form is the only form-submit surface a portfolio has, so it's
   the correct (and only) place that component and the violet CTA appear.
