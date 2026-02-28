// Main animation loop, star updates, object rotation, light movement
import { scene, camera, renderer, cssRenderer, controls } from '../core/scene-setup.js';
import { cubes, clickTargets, titleObjects, subObjects, subTitles, subClickTargets } from '../geometry/cube-logic.js';
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

function handlePointerMove(clientX, clientY) {
    const dx = clientX - prevMouseX;
    const dy = clientY - prevMouseY;
    prevMouseX = clientX;
    prevMouseY = clientY;

    hoverMouse.x = (clientX / window.innerWidth) * 2 - 1;
    hoverMouse.y = -(clientY / window.innerHeight) * 2 + 1;

    hoverRaycaster.setFromCamera(hoverMouse, camera);

    // Check sub-objects first (when expanded), then main objects
    let handled = false;
    if (subClickTargets.length > 0) {
        const subHits = hoverRaycaster.intersectObjects(subClickTargets, false);
        if (subHits.length > 0) {
            const hit = subHits[0].object;
            const si = hit.userData._subIndex;
            const subObj = si !== undefined ? subObjects[si] : hit;
            const subKey = 'sub_' + subObjects.indexOf(subObj);
            hoveredIndex = -1; // not a main cube
            hoverVelY.set(subKey, (hoverVelY.get(subKey) || 0) + dx * HOVER_SPEED);
            hoverVelX.set(subKey, (hoverVelX.get(subKey) || 0) + dy * HOVER_SPEED);
            handled = true;
        }
    }
    if (!handled) {
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
    }
}

window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
});

// Touch-based rotation for mobile (single-finger drag on objects)
let touchRotateActive = false;
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
        touchRotateActive = true;
    }
}, { passive: true });
window.addEventListener('touchmove', (e) => {
    if (touchRotateActive && e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });
window.addEventListener('touchend', () => {
    touchRotateActive = false;
}, { passive: true });

const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);
const pointLight = new window.THREE.PointLight(0xfff0e5, 0.7, 50);
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
        if (window.innerWidth < 768) {
            // Mobile: pin title at top of vertical list
            window.bigTitle.position.set(0, 8, -5);
        } else {
            window.bigTitle.position.set(0, 0, -5);
        }
    }

    // Floating titles follow their parent objects
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // Hide per-geometry titles on mobile
        titleObjects.forEach(title => {
            if (title.element) title.element.style.display = 'none';
        });
        subTitles.forEach(title => {
            if (title.element) title.element.style.display = 'none';
        });
    } else {
        titleObjects.forEach(title => {
            if (title.element) title.element.style.display = 'block';
            const obj = title.userData.cube;
            if (obj) {
                title.position.copy(obj.position);
                title.position.y += 2;
                title.lookAt(camera.position);
            }
        });
        subTitles.forEach(title => {
            if (title.element) title.element.style.display = 'block';
            const obj = title.userData.cube;
            if (obj) {
                title.position.copy(obj.position);
                title.position.y += 1.8;
                title.lookAt(camera.position);
            }
        });
    }

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

    // Sub-geometry rotation — hovered ones follow cursor momentum, others idle-spin
    subObjects.forEach((obj, i) => {
        const key = 'sub_' + i;
        const vx = hoverVelX.get(key) || 0;
        const vy = hoverVelY.get(key) || 0;
        const hasVel = Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001;

        if (hasVel) {
            obj.rotation.x += vx;
            obj.rotation.y += vy;
            hoverVelX.set(key, vx * DAMPING);
            hoverVelY.set(key, vy * DAMPING);
        } else {
            obj.rotation.x += 0.004;
            obj.rotation.y += 0.006;
            hoverVelX.delete(key);
            hoverVelY.delete(key);
        }
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
    cssRenderer.render(scene, camera);
}
animate();
