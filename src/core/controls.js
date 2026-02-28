import { camera, renderer } from './scene.js';

export const controls = new THREE.OrbitControls(camera, renderer.domElement);

export function initControls() {
    Object.assign(controls, {
        enableDamping: true,
        dampingFactor: 0.05,
        enableZoom: true,
        zoomSpeed: 1.2,
        enableRotate: false,
        enablePan: false
    });
}