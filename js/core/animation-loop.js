// Main animation loop, star updates, object rotation, light movement
import { scene, camera, renderer, controls } from '../core/scene-setup.js';
import { cubes, clickTargets, titleObjects, subObjects, subTitles } from '../geometry/cube-logic.js';
import { starField, stars } from '../geometry/background-stars.js';

// --- Hover rotation tracking ---
const hoverRaycaster = new window.THREE.Raycaster();
const hoverMouse = new window.THREE.Vector2();
let hoveredIndex = -1;           // index into cubes[]
const hoverVelX = new Map();     // per-cube residual velocity X
const hoverVelY = new Map();     // per-cube residual velocity Y
let prevMouseX = 0, prevMouseY = 0;
const HOVER_SPEED   = 0.0015;    // how much cursor delta maps to rotation
const DAMPING       = 0.96;      // how quickly hover momentum decays
const DEFAULT_SPEED = 0.005;     // normal idle rotation speed

window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    hoverMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    hoverMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    hoverRaycaster.setFromCamera(hoverMouse, camera);
    const hits = hoverRaycaster.intersectObjects(clickTargets, false);

    if (hits.length > 0) {
        const hit = hits[0].object;
        const pi = hit.userData._parentIndex;
        const idx = pi !== undefined ? pi : cubes.indexOf(hit);
        if (idx >= 0) {
            hoveredIndex = idx;
            hoverVelY.set(idx, (hoverVelY.get(idx) || 0) + dx * HOVER_SPEED);
            hoverVelX.set(idx, (hoverVelX.get(idx) || 0) + dy * HOVER_SPEED);
        }
    } else {
        hoveredIndex = -1;
    }
});

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

    // Big title always faces camera
    if (window.bigTitle) {
        window.bigTitle.lookAt(camera.position);
        window.bigTitle.position.set(0, 0, -5);
    }

    // Floating titles follow their parent objects
    titleObjects.forEach(title => {
        const obj = title.userData.cube;
        if (obj) {
            title.position.copy(obj.position);
            title.position.y += 2;
            title.lookAt(camera.position);
        }
    });

    // Stars
    starField.rotation.y += 0.0005;
    updateStars();

    // Rotate all 3D objects — hovered ones follow cursor momentum, others idle-spin
    cubes.forEach((obj, i) => {
        const vx = hoverVelX.get(i) || 0;
        const vy = hoverVelY.get(i) || 0;
        const hasVel = Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001;

        if (hasVel) {
            obj.rotation.x += vx;
            obj.rotation.y += vy;
            hoverVelX.set(i, vx * DAMPING);
            hoverVelY.set(i, vy * DAMPING);
        } else {
            obj.rotation.x += DEFAULT_SPEED;
            obj.rotation.y += DEFAULT_SPEED;
            hoverVelX.delete(i);
            hoverVelY.delete(i);
        }
    });

    // Orbiting point light
    const time = Date.now() * 0.001;
    pointLight.position.x = Math.sin(time) * 10;
    pointLight.position.z = Math.cos(time) * 10;

    // Sub-geometry rotation and title tracking
    subObjects.forEach(obj => {
        obj.rotation.x += 0.004;
        obj.rotation.y += 0.006;
    });
    subTitles.forEach(title => {
        const obj = title.userData.cube;
        if (obj) {
            title.position.copy(obj.position);
            title.position.y += 1.8;
            title.lookAt(camera.position);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
