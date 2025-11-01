// Main entry point for the website
import { scene, camera, renderer, controls, addBigTitle } from './core/scene-setup.js';
import { playSound, bgm, zoomInSound, zoomOutSound } from './features/audio-controls.js';
import { setupCubes } from './geometry/cube-logic.js';
import { starField, createStars } from './geometry/background-stars.js';
import { animate } from './core/animation-loop.js';
import { gamepad } from './geometry/gamepad.js';
import { linkedInGeometry } from './geometry/linkedin.js';
import { mainPageGeometry } from './geometry/mainpage.js';

// Setup big title
const bigTitle = addBigTitle("This is\nJohn Pan");
window.bigTitle = bigTitle;

// Setup cubes (example specs)
const cubeSpecs = [
    { type: mainPageGeometry(), label: "My LinkedIn", url: './html/linkedIn.html', userData: { title: "LinkedIn" } },
    { type: linkedInGeometry(), label: "Email", url: './html/email.html', userData: { title: "Email" } },
    { type: gamepad(), label: "Gamepad", url: './html/pong.html', userData: { title: "Pong" } }
    // Add more as needed
];
setupCubes(cubeSpecs);

// Start animation loop
animate();

// Basic cube click handler
function onCubeClick(event) {
  console.log('Cube clicked!', event);
}
window.onCubeClick = onCubeClick;
window.addEventListener('click', onCubeClick);
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onCubeClick(event);
}, { passive: false });

// Additional UI, event, and iframe logic can be imported and initialized here