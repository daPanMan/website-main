# website-main
## -> **https://jpswag.com**

## My personal website showing my shenanigans

An interactive 3D portfolio built with Three.js, GSAP, and CSS3DRenderer. Features floating geometry navigation, sub-page expansion, an AI chatbox, and full mobile support.

---

## Project Structure

```
website-main/
├── index.html                  # Main entry point
├── about.html                  # About Me page (loaded in iframe)
├── CNAME                       # Custom domain config
├── README.md
│
├── assets/                     # Static assets
│   ├── audio/
│   │   ├── website.mp3             # Background music
│   │   ├── zoom-in.wav             # Zoom-in SFX
│   │   └── zoom-out.wav            # Zoom-out SFX
│   ├── css/
│   │   └── style.css               # Global styles + mobile media queries
│   ├── favicon/
│   │   ├── favicon.ico
│   │   ├── android-chrome-*.png
│   │   ├── apple-touch-icon.png
│   │   └── site.webmanifest
│   ├── fonts/
│   │   └── helvetiker_bold.typeface.json
│   └── textures/
│       ├── stars.jpg               # Skybox background
│       ├── linkedin.png            # LinkedIn logo texture
│       ├── gmail.png               # Gmail logo texture
│       ├── insta.png               # Instagram logo texture
│       ├── snap.png                # Snapchat logo texture
│       ├── disk.png                # Record/vinyl texture
│       ├── tennis.jpg              # Pong ball texture
│       ├── unity.jpg               # Unity mini-game texture
│       ├── dice-[1-6].png          # Pig Game dice face textures
│       └── CB.png
│
├── src/                        # JavaScript source (ES modules)
│   ├── main.js                     # Entry point — cube specs & bootstrap
│   ├── ui-intro.js                 # Intro overlay & enter button
│   ├── core/
│   │   ├── scene-setup.js          # Camera, renderer, CSS3DRenderer, controls, title gimmicks
│   │   ├── scene.js                # Scene singleton
│   │   ├── animation-loop.js       # RAF loop, title tracking, star rotation, mobile scroll
│   │   ├── animation.js            # GSAP animation helpers
│   │   ├── controls.js             # OrbitControls setup
│   │   ├── events.js               # Window event handlers
│   │   └── lights.js               # Scene lighting
│   ├── features/
│   │   ├── audio-controls.js       # Volume slider, mute toggle, SFX
│   │   ├── audio.js                # Audio sound map
│   │   ├── chatbox.js              # AI chatbox UI & Groq API integration
│   │   ├── chatbot-config.js       # Chatbot identity, personality & API config
│   │   └── iframe-display.js       # In-scene iframe overlay (CSS3DObject)
│   └── geometry/
│       ├── cube-logic.js           # Core: positions, expand/collapse, raycasting, drag detection
│       ├── geometryManager.js      # Re-exports all geometry factories
│       ├── background-stars.js     # Star field skybox
│       ├── mainpage.js             # "About Me" geometry
│       ├── linkedin.js             # LinkedIn rounded box with texture
│       ├── email.js                # "Contact Me" @ geometry (3D text)
│       ├── gmail.js                # Gmail rounded rectangle with texture
│       ├── insta.js                # Instagram rounded square with texture
│       ├── snap.js                 # Snapchat rounded square with texture
│       ├── record.js               # Vinyl record geometry
│       ├── gamepad.js              # Game controller geometry
│       ├── pong.js                 # Pong ball geometry
│       ├── pig-game.js             # Dice geometry
│       └── mini-game.js            # Unity mini-game cube
│
├── pages/                      # Sub-pages loaded in iframe
│   ├── email.html                  # Contact form (EmailJS)
│   ├── linkedin.html               # LinkedIn profile card
│   ├── insta.html                  # Instagram profile card
│   ├── snap.html                   # Snapchat profile card
│   ├── spotify.html                # Spotify embed
│   ├── pong.html                   # Pong game
│   ├── pig-game/                   # Pig Game (standalone mini-app)
│   │   ├── index.html
│   │   ├── script.js
│   │   ├── style.css
│   │   ├── pig-game-flowchart.png
│   │   └── dice-[1-6].png
│   └── unity/                      # Unity WebGL game
│       ├── index.html
│       ├── Build/
│       └── TemplateData/
│
└── scripts/                    # Dev/deploy shell scripts
    ├── localrun.sh                 # Local HTTP server
    └── update.sh                   # Git push helper
```

---

## AI Chatbot
---

## Testing

A small Node‑based test harness exercises the `src/features/iframe-display.js`
module. This is particularly useful for catching the issue where the Unity
WebGL page would hang network requests and prevent subsequent iframe loads.

Run the tests with:

```bash
node tests/run-tests.mjs
```

The tests cover:

1. `showIframe` opening the overlay and setting the correct URL.
2. `hideIframe` hiding the overlay and resetting/clearing the iframe source.
3. Ensuring a *fresh* `<iframe>` element is created after each hide (important
   for unloading Unity's heavy code).
4. Interrupting a hide with a new show (simulates quick user navigation).

---

## Running locally

The bundled `scripts/localrun.sh` spawns a simple Python HTTP server.  By
default it uses a multi-threaded handler (`ThreadingHTTPServer` on Python
3.7+) so that large asset downloads (the Unity build is hundreds of
megabytes) don't block other requests.  If your environment falls back to the
single-threaded server, you may observe exactly the problem you described –
while Unity is downloading, the server will not respond to other pages, which
appears as “iframe pages won’t load”.

If you still see this behaviour, run another server that supports concurrency
(e.g. `python -m http.server` on Python 3.7+, `npx http-server`, `live-server`,
etc.) or wait for the Unity requests to complete before navigating away.  The
issue is with the local server, not the website code itself.

---

### Browser compatibility

The CLI games (Euchre, Tic‑Tac‑Toe) are written using modern JavaScript
features such as `class`, `async/await`, and `const`. Older browsers (Internet
Explorer, some embedded browsers) will throw a syntax error and the page will
remain blank.  A simple feature test is run at the top of `pages/euchre.html`
which displays a warning message if the browser is too old.  Additionally, the
page must be served over HTTP — opening it directly via `file://` will show a
notice asking you to run the local server (`scripts/localrun.sh` or similar).
(The game logic itself is stored in a `<script type="text/template">` and
is injected/evaluated only after the checks complete; this prevents any
syntax errors during the initial HTML parse.)  If you encounter "game doesn't
load" errors, try again with a current Chrome, Firefox, Safari, or Edge build
and ensure you're accessing the site via `http://` rather than `file://`.

---

### AI Chatbot
The site features a fully AI-driven chatbot that lets visitors have real conversations with a digital version of you.

### Architecture

| Layer | File | Role |
|-------|------|------|
| Config | `src/features/chatbot-config.js` | Identity, personality, bio data, API settings, system prompt |
| Runtime | `src/features/chatbox.js` | UI, conversation history, Groq API calls, rate limiting |
| Styles | `assets/css/style.css` | Chatbox layout, AI vs non-AI bubble colors |

### Provider — Groq (free tier)

- **Model:** `llama-3.1-8b-instant` via Groq's OpenAI-compatible REST API
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Free-tier limits:** 30 requests/min, 15 000 tokens/min
- **Auth:** Bearer token in `Authorization` header

### How it works

1. User sends a message → added to `conversationHistory` as `{ role: 'user', content }`.
2. A messages array is built: system prompt + last 20 conversation turns.
3. `fetch()` POST to Groq → response streamed back as a chat completion.
4. Assistant reply appended to history; history trimmed at 30 messages.
5. Reply displayed in a green-tinted bubble (`.chat-msg.bot.ai`); error fallbacks use the default blue bubble.

### Rate limiting

- **Client-side:** 1.5 s minimum between API calls (`MIN_API_INTERVAL`).
- **429 handling:** If Groq returns 429, the user sees a friendly "too many messages" message and the failed turn is rolled back from history.

### Goodbye auto-close

When the user sends a goodbye-like message (`bye`, `cya`, `peace`, `gtg`, `ttyl`, `goodnight`, etc.), the chatbot responds normally and then auto-collapses the chatbox after a 2-second delay.

### Customization

All personality, bio facts, and API settings live in `chatbot-config.js`. To swap providers, change `api.provider`, `api.model`, `api.apiKey`, and `api.endpoint` — the runtime code uses the standard OpenAI chat completions format.


---

## Pig Game

A two-player dice game built with vanilla JavaScript, accessible from the **Games** sub-menu.

### Rules

- Players take turns rolling a single die.
- On each turn the roll value is added to that player's **Current** score.
- Rolling a **1** forfeits the entire current score and passes the turn.
- Pressing **Hold** banks the current score into the player's **Total** and passes the turn.
- First player to reach **100 total points** wins (🥳), and the game auto-resets after 2 seconds.
- **New Game** resets everything immediately.

### Tech

| File | Role |
|------|------|
| `pages/pig-game/index.html` | Two-panel layout (Player 1 / Player 2), dice image, action buttons |
| `pages/pig-game/script.js` | Game logic — roll, hold, switch, victory check |
| `pages/pig-game/style.css` | Split-screen styling with active-player highlight |
| `pages/pig-game/dice-[1-6].png` | Dice face images |

### 3D Geometry

Represented in the scene by a dice mesh (`src/geometry/pig-game.js`) that loads the six face textures onto a box.

---

## Euchre

A terminal-style web port of a **C++ Euchre card game** originally written for UMich EECS 280, accessible from the **Games** sub-menu. The implementation is faithful to the original CLI program.

### Game Overview

Euchre is a 4-player trick-taking card game played in teams (players 0 & 2 vs players 1 & 3) with a 24-card pack (9 through Ace of each suit).

### Features

- **Interactive setup** — choose shuffle/noshuffle, points to win (1–100), and 4 player names with type (Simple AI or Human).
- **Faithful card logic** — right bower, left bower, trump suit, and led-suit comparison all match the original C++ implementation.
- **Simple AI strategy** — orders up trump with ≥ 2 face cards in suit (round 1) or ≥ 1 (round 2 / screw-the-dealer), leads highest non-trump, follows suit with highest card, and discards lowest.
- **Human player support** — shows indexed hand, prompts for suit/pass, card selection, and dealer discard.
- **Screw-the-dealer** — dealer in round 2 is forced to order up (cannot pass), preventing deadlocks.
- **Scoring** — 1 point per hand won, 2 for a march (all 5 tricks), 2 for euchring the opposing team. First team to reach the target score wins.
- **Deal pattern** — 3-2-3-2, then 2-3-2-3 with in-shuffle (7 iterations), matching the original Pack implementation.

### Input Tolerance

All text inputs are fault-tolerant:

| Input | Accepted formats |
|-------|-----------------|
| Shuffle mode | `shuffle`, `Shuffle`, `SHUFFLE`, `noshuffle`, etc. (case-insensitive) |
| Player type | `Simple`, `simple`, `s`, `Human`, `human`, `h` |
| Suit | Full name (`Hearts`), singular (`heart`), initial (`h`) — all case-insensitive |
| Pass | `pass`, `Pass`, `PASS`, etc. |
| Card index | Re-prompts on NaN or out-of-range values with valid range hint |
| Player name | Cannot be empty |
| Round 2 suit | Upcard's suit is rejected (cannot re-pick the turned-down suit) |

### Tech

| File | Role |
|------|------|
| `pages/euchre.html` | Self-contained terminal UI + full game engine (~670 lines) |
| `src/geometry/euchre.js` | 3D icon — fan of 5 playing cards with a gold trump gem |

### Terminal UI

Dark-themed fullscreen terminal (Consolas/Courier) with color-coded output: cyan prompts, pink cards, blue player names, red trump, yellow results, green scores. Input is accepted via a command-line-style text field at the bottom.

---

### 1D Combat Simulator & Guess My Number

Two additional games were added under the Games submenu.

* **1D Combat Simulator** is a text-based Spartan vs. Athenian battle
  simulator. Enter army sizes and watch an ASCII fight play out with
  casualty tracking. Ported from the original C++ project in
  `1D-Combat-Simulator-main`.
* **Guess My Number** is a browser-based guessing game (1–20) including
  score/highscore logic. This mirrors the original `Guess-My-Number-main`
  page and stylesheet exactly.

Both appear as new sub-items in the gamepad cube and use simple cube
icons with invisible hit spheres for easy clicking.

### To-Do List
1. ~~add nested geometries, namely new shapes show up after clicking a single shape~~
2. ~~change title fonts, and maybe add some animations~~
3. put more infos of me on there
4. ~~after finishing the website, make it mobile-friendly~~