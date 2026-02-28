// Main entry point for the website
import { scene, camera, renderer, controls, addBigTitle } from './core/scene-setup.js';
import { playSound, bgm, zoomInSound, zoomOutSound } from './features/audio-controls.js';
import { setupCubes } from './geometry/cube-logic.js';
import { starField, createStars } from './geometry/background-stars.js';
import { animate } from './core/animation-loop.js';
import { gamepad } from './geometry/gamepad.js';
import { linkedInGeometry } from './geometry/linkedin.js';
import { mainPageGeometry } from './geometry/mainpage.js';
import { emailGeometry } from './geometry/email.js';
import { pongBall } from './geometry/pong.js';
import { pigGameDice } from './geometry/pig-game.js';
import { miniGameCube } from './geometry/mini-game.js';
import { recordGeometry } from './geometry/record.js';
import './ui-intro.js';

// Setup big title
const bigTitle = addBigTitle("This is\nJohn Pan");
window.bigTitle = bigTitle;

// Setup interactive 3D objects
const cubeSpecs = [
    { type: mainPageGeometry(), label: "About Me", url: './about.html', userData: { title: "About Me" } },
    { type: linkedInGeometry(), label: "LinkedIn", url: './pages/linkedin.html', userData: { title: "LinkedIn" } },
    { type: emailGeometry(), label: "Email", url: './pages/email.html', userData: { title: "Email" } },
    { type: recordGeometry(), label: "My Tracks", url: './pages/spotify.html', userData: { title: "My Tracks" } },
    {
        type: gamepad(), label: "Games", url: './pages/pong.html',
        userData: { title: "Games" },
        subItems: [
            { factory: () => pongBall(),     label: "PONG",              title: "PONG",              url: './pages/pong.html' },
            { factory: () => pigGameDice(),  label: "Pig Game with Dice", title: "Pig Game with Dice", url: './pages/pig-game/index.html' },
            { factory: () => miniGameCube(), label: "My 3D Mini Game",   title: "My 3D Mini Game",   url: './pages/unity/index.html' },
        ]
    }
];
setupCubes(cubeSpecs);

// Start animation loop
animate();

// Additional UI, event, and iframe logic can be imported and initialized here