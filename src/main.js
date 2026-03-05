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
import { gmailGeometry } from './geometry/gmail.js';
import { instaGeometry } from './geometry/insta.js';
import { snapGeometry } from './geometry/snap.js';
import { pongBall } from './geometry/pong.js';
import { pigGameDice } from './geometry/pig-game.js';
import { miniGameCube } from './geometry/mini-game.js';
import { snakeGeometry } from './geometry/snake.js';
import { tictactoeGeometry } from './geometry/tictactoe.js';
import { euchreGeometry } from './geometry/euchre.js';
import { combatSimulatorGeometry } from './geometry/combat-simulator.js';
import { guessNumberGeometry } from './geometry/guess-number.js';
import { recordGeometry } from './geometry/record.js';
import './ui-intro.js';

// Setup big title
const bigTitle = addBigTitle("This is\nJohn Pan");
window.bigTitle = bigTitle;

// Setup interactive 3D objects
const cubeSpecs = [
    { type: mainPageGeometry(), label: "About Me", url: './about.html', userData: { title: "About Me" } },
    {
        type: emailGeometry(), label: "Contact Me", url: './pages/email.html',
        userData: { title: "Contact Me" },
        subItems: [
            { factory: () => linkedInGeometry(), label: "LinkedIn",  title: "LinkedIn",  url: './pages/linkedin.html' },
            { factory: () => gmailGeometry(),  label: "Email",     title: "Email",     url: './pages/email.html' },
            { factory: () => instaGeometry(),   label: "Instagram", title: "Instagram", url: './pages/insta.html' },
            { factory: () => snapGeometry(),    label: "Snapchat",  title: "Snapchat",  url: './pages/snap.html' },
        ]
    },
    { type: recordGeometry(), label: "My Tracks", url: './pages/spotify.html', userData: { title: "My Tracks" } },
    {
        type: gamepad(), label: "Games", url: './pages/pong.html',
        userData: { title: "Games" },
        subItems: [
            { factory: () => pongBall(),     label: "PONG",              title: "PONG",              url: './pages/pong.html' },
            { factory: () => pigGameDice(),  label: "Pig Game with Dice", title: "Pig Game with Dice", url: './pages/pig-game/index.html' },
            { factory: () => miniGameCube(), label: "My 3D Mini Game",   title: "My 3D Mini Game",   url: './pages/unity/index.html' },
            { factory: () => snakeGeometry(), label: "Snake",             title: "Snake",             url: './pages/snake.html' },
            { factory: () => tictactoeGeometry(), label: "Tic Tac Toe",     title: "Tic Tac Toe",     url: './pages/tictactoe.html' },
            { factory: () => euchreGeometry(), label: "Euchre",           title: "Euchre",           url: './pages/euchre.html' },
            { factory: () => combatSimulatorGeometry(), label: "1D Combat",    title: "1D Combat Simulator", url: './pages/1d-combat-simulator/index.html' },
            { factory: () => guessNumberGeometry(), label: "Guess #",        title: "Guess My Number",    url: './pages/guess-my-number/index.html' },
        ]
    }
];
setupCubes(cubeSpecs);

// Start animation loop
animate();

// Additional UI, event, and iframe logic can be imported and initialized here