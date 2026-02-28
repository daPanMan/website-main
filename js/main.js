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
import './ui-intro.js';

// Setup big title
const bigTitle = addBigTitle("This is\nJohn Pan");
window.bigTitle = bigTitle;

// Setup interactive 3D objects
const cubeSpecs = [
    { type: mainPageGeometry(), label: "About Me", url: './about.html', userData: { title: "About Me" } },
    { type: linkedInGeometry(), label: "LinkedIn", url: './html/linkedIn.html', userData: { title: "LinkedIn" } },
    { type: emailGeometry(), label: "Email", url: './html/email.html', userData: { title: "Email" } },
    {
        type: gamepad(), label: "Games", url: './html/pong.html',
        userData: { title: "Games" },
        subItems: [
            { factory: () => pongBall(),     label: "PONG",              title: "PONG",              url: './html/pong.html' },
            { factory: () => pigGameDice(),  label: "Pig Game with Dice", title: "Pig Game with Dice", url: './html/Pig-Game-with-Dice/index.html' },
            { factory: () => miniGameCube(), label: "My 3D Mini Game",   title: "My 3D Mini Game",   url: './html/unity/index.html' },
        ]
    }
];
setupCubes(cubeSpecs);

// Start animation loop
animate();

// Additional UI, event, and iframe logic can be imported and initialized here