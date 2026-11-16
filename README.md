# PokerIQ — "Duolingo for poker"

An interactive web app that teaches poker strategy through **24 bite-sized, gamified lessons**, from hand rankings to bluffing theory. Each lesson combines a short explanation with a hands-on exercise, and a new lesson unlocks every day to build a learning habit.

<!-- TODO: add screenshots or a short GIF here, e.g. docs/home.png and docs/lesson.gif -->

**Live demo:** https://ofekzagury.github.io/PokerIQ/ (all lessons unlocked, progress saved in your browser)

## Features

- **Structured curriculum** – 24 lessons in 11 chapters: hand rankings, betting flow, expected value, pot odds and implied odds, outs and the rule of 2 & 4, position, preflop and postflop play, board texture, bet sizing, semi-bluffs, check-raises, slow-plays and bluffing.
- **Learning by doing** – interactive exercises such as drag-and-drop hand ordering, odds calculations and decision drills, with instant feedback and animated transitions.
- **Daily unlock & progress tracking** – finishing a lesson unlocks the next one at midnight (Asia/Jerusalem time), with a countdown timer and a per-chapter progress view.
- **Accounts** – simple email-based sign-up / sign-in with cookie sessions (proof-of-concept auth, no passwords).
- **Product analytics** – Google Analytics 4 events plus a server-side NDJSON event log: lesson start / completion / abandonment, attempt numbers and *active* time per lesson (the stopwatch pauses when the tab is hidden).

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS 4, Radix UI / shadcn-style components, Framer Motion, @hello-pangea/dnd |
| Backend | Node.js, Express, cookie sessions, Luxon (time zones) |
| Storage | JSON file per user (`server/data/users/`), NDJSON analytics log |
| Analytics | Google Analytics 4 |

## Getting started

**Requirements:** Node.js 20+.

```bash
git clone https://github.com/OfekZagury/PokerIQ.git
cd PokerIQ

# Backend (http://localhost:5174)
cd server
npm install
npm run dev

# Frontend (http://localhost:5173) – in a second terminal
cd ..
cp .env.example .env      # optional: GA4 ID / backend URL
npm install
npm run dev
```

Production build: `npm run build` (output in `dist/`).

### Demo mode

`VITE_DEMO_MODE=true npm run build` creates a backend-free build: the user service keeps progress in `localStorage`, all lessons are unlocked and routing uses hash URLs so it works on static hosting. The `deploy-demo` workflow publishes this build to GitHub Pages on every push to `main`.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE` | `.env` | `http://localhost:5174` | Backend URL used by the frontend |
| `VITE_GA_ID` | `.env` | – | Google Analytics 4 measurement ID (optional) |
| `PORT` | `server/.env` | `5174` | Backend port |
| `FRONT_ORIGIN` | `server/.env` | `http://localhost:5173` | Allowed CORS origin |

## Project structure

```
├── src/
│   ├── Pages/          # Home, Login and the 24 lesson pages (Game1 … Game24)
│   ├── Components/     # shared UI: playing cards, poker table, progress cards, timer
│   ├── lib/            # analytics wrapper, helpers
│   ├── hooks/          # useActiveStopwatch (active time per lesson)
│   └── services/       # API client
└── server/
    └── server.js       # auth, progress / daily unlock, analytics endpoints
```

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Create an account and start a session |
| `POST` | `/login` | Sign in an existing user |
| `POST` | `/logout` | End the session |
| `GET` | `/me` | Current user and progress |
| `POST` | `/complete-game` | Mark a lesson complete and schedule the next unlock |
| `POST` | `/analytics/track` | Append an analytics event to the NDJSON log |
