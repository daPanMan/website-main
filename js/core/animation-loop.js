// Main animation loop, star updates, cube rotation, light movement
import { scene, camera, renderer, controls, addBigTitle } from '../core/scene-setup.js';
import { cubes, titleObjects } from '../geometry/cube-logic.js';
import { starField, stars } from '../geometry/background-stars.js';

const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);
const pointLight = new window.THREE.PointLight(0xfff0e5, 1, 50);
pointLight.position.set(0, 5, 5);
scene.add(pointLight);

function updateStars() {
    for (let i = 0; i < stars.length * 0.3; i++) {
        let star = stars[Math.floor(Math.random() * stars.length)];
        star.position.z += 0.05;
        if (star.position.z > 50) {
            star.position.z = -50;
        }
    }
}

export function animate() {
    requestAnimationFrame(animate);
    if (window.bigTitle) {
        window.bigTitle.lookAt(camera.position);
        window.bigTitle.position.set(0, 0, -5);
    }
    titleObjects.forEach(title => {
        const cube = title.userData.cube;
        if (cube) {
            title.position.copy(cube.position);
            title.position.y += 2;
            title.lookAt(camera.position);
        }
    });
    starField.rotation.y += 0.0005;
    updateStars();
    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });
    const time = Date.now() * 0.001;
    pointLight.position.x = Math.sin(time) * 10;
    pointLight.position.z = Math.cos(time) * 10;
    controls.update();
    renderer.render(scene, camera);
    if (window.cssRenderer) window.cssRenderer.render(scene, camera);
}
animate();
