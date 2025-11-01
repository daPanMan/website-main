import { camera, renderer, cssRenderer } from './scene.js';

export function initEvents() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', onTouchStart);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
    // Handle click events
}

function onTouchStart(event) {
    event.preventDefault();
    // Handle touch events
}