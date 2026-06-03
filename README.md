# Bishvileinu — Nonprofit Website · *Memory Builds Life*

A multi-page brochure website for the **Bishvileinu** nonprofit, which connects the memorial
initiatives for the fallen of Israel's War of Revival with Jewish communities around the world.
The design stays true to the original presentation (a cream / growth-green / sunrise-gold palette,
Heebo + Assistant typefaces, a "sun rising over a sprout" motif), and is built as a real website
with 2026-grade design capabilities.

> A static site (HTML/CSS/JS) with no build step — it opens and hosts anywhere (GitHub Pages, Netlify, Vercel, any static server).

## Structure

```
index.html      Home — landing page
about.html      About Us — background, growth, the three sides, the double meaning
how.html        How It Works — four steps, what we do, the continuity story, outcomes
join.html       Join — who it's for, the partnership model (3 tiers), the vision
contact.html    Contact — contact form (demo), contact details, FAQ
assets/
  styles.css    All design tokens and components (shared across all pages)
  main.js        navigation, dark mode, mobile menu, scroll animations, number counters,
                 lightbox, accordion, form, back-to-top, progress bar
  images/        the six photographs
  sun.svg        the sun icon (favicon)
```

## Site features

Sticky navigation with blur-on-scroll · active-page highlighting · full mobile menu · **dark mode** (persisted) ·
scroll progress bar · staggered reveal animations · animated number counters · **lightbox** for images ·
**FAQ accordion** · back-to-top button · smooth scrolling · contact form with validation and a success
message · semantic HTML + meta/Open Graph tags + favicon · support for `prefers-reduced-motion`.

## Running locally

```bash
python3 -m http.server 8000
# then open in your browser: http://localhost:8000
```

## What still needs completing (placeholders are marked on the site with a "To update" tag)

- **Real contact details** — email / phone / address (currently `info@bishvileinu.org.il` as a placeholder).
- **Social media links** in the footer (currently `#`).
- **Photographs** — the current images are AI-generated placeholders; replace them with real photos.
- **The contact form** — currently a client-side demo only (shows a success message, no submission).
  To connect a backend/service (Formspree / Web3Forms, etc.) there is a `DEMO ONLY` note in `assets/main.js`
  exactly where the `FormData` should be sent.

## Design

The color and font tokens are defined in `:root` at the top of `assets/styles.css`; dark mode is under
`html[data-theme="dark"]`. The core colors: growth-green `#178A5B`, sunrise-gold `#C0841C`,
navy `#22324E`, cream `#FBF7EF`.
