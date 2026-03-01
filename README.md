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

### API Keys

API keys are **not** stored in this repo. For current keys and credentials, check the **Auth Keys** Google Doc.

---

### To-Do List
1. ~~add nested geometries, namely new shapes show up after clicking a single shape~~
2. ~~change title fonts, and maybe add some animations~~
3. put more infos of me on there
4. ~~after finishing the website, make it mobile-friendly~~