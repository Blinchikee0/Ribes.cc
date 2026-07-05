# Ribes — Landing Page

A single-page marketing site for **Ribes**, a marketplace and runtime for local AI models
(Steam model: browse → one-click install → run on your own GPU).

Every claim on the page is sourced from the Ribes Concept & Architecture document —
no invented stats, no fake testimonials.

## Stack

- **Static HTML + CSS + vanilla JS** — no build step; open `index.html` or serve the folder.
- **GSAP 3 + ScrollTrigger** (CDN) — scroll reveals, pinned horizontal lifecycle, parallax, scrub effects.
- **Lenis** (CDN) — smooth scrolling, synced with ScrollTrigger.
- **Google Fonts** — Space Grotesk (display), Inter (body), JetBrains Mono (code).
- **Unsplash** — duotone-treated photography (each image hides itself gracefully if unavailable).

## Structure

```
ribes-site/
├── index.html            # all sections, single page
└── assets/
    ├── css/main.css      # design system + components (matte violet, derived from the logo)
    ├── js/main.js        # loader, particles, animations, interactions
    └── img/              # logo assets, favicon
```

## Page sections

Loader → Hero (nebula + particle mesh + live product window) → Marquee → Manifesto (scroll-fill) →
Platform features + interactive hardware-gate simulator → Store bento → Architecture layers →
Lifecycle (vertical sequence, 7 states with progress line) → How it works (with thumbnails) →
Photo wall (auto-scroll) → Local-vs-cloud comparison → Bridge protocol (typing terminal, live metrics) →
Security → Engineering honesty → Client tour (tabs) → Developers (tabbed code + copy button) →
FAQ → Marquee → Download (OS auto-detect) → CTA → Footer.

## Interactive features

- **Hardware-gate simulator** — drag a VRAM slider, get the launcher's verdict (`FITS` / `TIGHT` /
  `CPU-FALLBACK`) computed against the SDK example manifest.
- **Quick-jump palette** — press `Ctrl+K` (or `/`) to search and jump to any section.
- **Copy button** on the developer code panels.
- **OS auto-detect** moves the "detected for you" badge to the visitor's platform.

## Behavior notes

- **Graceful degradation:** all content is visible without JavaScript; if a CDN fails, the page
  still works (loader auto-dismisses via an 8-second safety timeout).
- **`prefers-reduced-motion`:** loader, particles, parallax, typing and scroll animations are
  disabled; stats render their final values immediately.
- **Custom cursor, tilt, magnetic buttons** activate only on fine-pointer (mouse) devices.
- The pinned horizontal lifecycle section falls back to native horizontal scroll below 900 px.

## Serve locally

```
python -m http.server 4173 --directory .
```
