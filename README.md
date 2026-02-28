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
│   │   ├── scene-setup.js          # Camera, renderer, CSS3DRenderer, controls
│   │   ├── scene.js                # Scene singleton
│   │   ├── animation-loop.js       # RAF loop, title tracking, star rotation
│   │   ├── animation.js            # GSAP animation helpers
│   │   ├── controls.js             # OrbitControls setup
│   │   ├── events.js               # Window event handlers
│   │   └── lights.js               # Scene lighting
│   ├── features/
│   │   ├── audio-controls.js       # Volume slider, mute toggle, SFX
│   │   ├── audio.js                # Audio sound map
│   │   ├── chatbox.js              # AI chat UI
│   │   ├── chatbot-config.js       # Chatbot personality & responses
│   │   └── iframe-display.js       # In-scene iframe overlay (CSS3DObject)
│   └── geometry/
│       ├── cube-logic.js           # Core: positions, expand/collapse, raycasting
│       ├── geometryManager.js      # Re-exports all geometry factories
│       ├── background-stars.js     # Star field skybox
│       ├── mainpage.js             # "About Me" geometry
│       ├── linkedin.js             # LinkedIn geometry
│       ├── email.js                # Email "@" geometry (3D text)
│       ├── record.js               # Vinyl record geometry
│       ├── gamepad.js              # Game controller geometry
│       ├── pong.js                 # Pong ball geometry
│       ├── pig-game.js             # Dice geometry
│       └── mini-game.js            # Unity mini-game cube
│
├── pages/                      # Sub-pages loaded in iframe
│   ├── email.html
│   ├── linkedin.html
│   ├── spotify.html
│   ├── pong.html
│   ├── pig-game/                   # Pig Game (standalone mini-app)
│   │   ├── index.html
│   │   ├── script.js
│   │   ├── style.css
│   │   └── dice-[1-6].png
│   └── unity/                      # Unity WebGL game
│       ├── index.html
│       ├── Build/
│       └── TemplateData/
│
└── scripts/                    # Dev/deploy shell scripts
    ├── localrun.sh                 # Local HTTP server
    ├── localrun_mobile.sh          # Mobile emulator via Edge
    └── update.sh                   # Git push helper
```

---

### To-Do List
1. ~~add nested geometries, namely new shapes show up after clicking a single shape~~
2. ~~change title fonts, and maybe add some animations~~
3. put more infos of me on there
4. ~~after finishing the website, make it mobile-friendly~~