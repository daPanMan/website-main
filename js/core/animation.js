import { scene, camera, renderer, cssRenderer } from './scene.js';
import { controls } from './controls.js';

export function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Render both renderers
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}