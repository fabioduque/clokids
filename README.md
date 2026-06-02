# Learn to Read Clocks — Kids App

A small, friendly web app that helps children (ages 4–10) learn to **read an analog clock and tell the time**. The interface is in **European Portuguese** (the app teaches Portuguese time‑telling), and it runs entirely in the browser — no backend, no accounts.

🔗 Live: `https://fabioduque.github.io/learn-to-read-clocks-kids-app/` (after the first deploy)

## Features

- **Free play** — a big analog clock synced with a digital one (24‑hour large, 12‑hour small, plus the time spelled out in words). Set any time by **dragging the hands** or **tapping the numbers**. A ☀️/🌙 toggle switches morning ↔ afternoon/evening.
- **Adjustable precision** — the minute hand can snap to **quarter hours (15 min)**, **5 minutes**, or **every minute**, so a child can progress gradually.
- **Quiz** — short rounds of 5 questions in two directions: read the analog clock and pick the digital time, or read a digital time and pick the matching clock. Correct answers are celebrated with stars; getting 4/5 unlocks the next level.
- **Read aloud** — a button speaks the time using the device's Portuguese voice (hidden automatically if none is available).
- **Visual aids** — colour‑coded hands (red = hours, blue = minutes) with a small legend, and the 24‑hour numbers shown inside the dial.
- **Progress** — best score per level is saved on the device (localStorage); there's a reset button to start over.
- **Accessible & responsive** — works with touch and mouse, mobile‑first (bottom navigation on phones), and respects `prefers-reduced-motion`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for gentle animations
- [Vitest](https://vitest.dev/) for unit tests
- Web Speech API for the read‑aloud voice

The core time logic (snapping, hand angles, and the Portuguese number/word formatting) lives in `src/lib/` as pure, fully‑tested functions; the React components only render what that logic produces.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the unit tests
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Deployment

Pushing to `main` builds and publishes the app to **GitHub Pages** via the workflow in `.github/workflows/deploy.yml`. Enable Pages once under **Settings → Pages → Source: GitHub Actions**. Asset paths are relative (`base: './'` in `vite.config.ts`), so the app works from the repository subpath.
