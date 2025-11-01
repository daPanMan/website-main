// Universe background, moving stars, mouse/touch drag, pinch-to-zoom
import { scene, camera } from '../core/scene-setup.js';

const textureLoader = new window.THREE.TextureLoader();
const spaceTexture = textureLoader.load('textures/stars.jpg');
const starGeometry = new window.THREE.SphereGeometry(50, 64, 64);
const starMaterial = new window.THREE.MeshBasicMaterial({ map: spaceTexture, side: window.THREE.BackSide });
export const starField = new window.THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

export const stars = [];
export function createStars() {
    const starGeometry = new window.THREE.SphereGeometry(0.1, 8, 8);
    const starMaterial = new window.THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 300; i++) {
        const star = new window.THREE.Mesh(starGeometry, starMaterial);
        star.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        stars.push(star);
        scene.add(star);
    }
}
createStars();

let isDragging = false;
let lastX = 0, lastY = 0;
let targetRotationX = 0, targetRotationY = 0;

window.addEventListener('mousedown', (event) => {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
});
window.addEventListener('mouseup', () => {
    isDragging = false;
});
window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        let deltaX = (event.clientX - lastX) * 0.002;
        let deltaY = (event.clientY - lastY) * 0.002;
        targetRotationX += deltaX;
        targetRotationY += deltaY;
        lastX = event.clientX;
        lastY = event.clientY;
        starField.rotation.y += (targetRotationX - starField.rotation.y) * 0.05;
        starField.rotation.x += (targetRotationY - starField.rotation.x) * 0.05;
    }
});
// ... Add touch and pinch logic as in original script ...
