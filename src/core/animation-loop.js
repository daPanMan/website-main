// Main animation loop, star updates, object rotation, light movement
import { scene, camera, renderer, cssRenderer, controls } from '../core/scene-setup.js';
import { cubes, clickTargets, titleObjects, subObjects, subTitles, subClickTargets } from '../geometry/cube-logic.js';
import { starField, stars } from '../geometry/background-stars.js';
import { DEFAULT_ROTATE_SPEED, HOVER_SPEED, HOVER_DAMPING, HOVER_VELOCITY_THRESHOLD } from '../core/constants.js';

// --- Mobile vertical scroll (native-scroll driven) ---
window.mobileScrollY = 0;        // current scroll offset (world units)
const SCROLL_MAX = 18;           // total scrollable range in world units (flat 2D plane)

// Map native scroll position → world units
function updateMobileScrollFromNative() {
    const maxPx = document.body.scrollHeight - window.innerHeight;
    if (maxPx <= 0) return;
    window.mobileScrollY = (window.scrollY / maxPx) * SCROLL_MAX;
}
if (window.innerWidth < 768) {
    window.addEventListener('scroll', updateMobileScrollFromNative, { passive: true });
}

// Utility: scroll the page to a target mobileScrollY value
window.scrollMobileTo = function(targetY, smooth) {
    const maxPx = document.body.scrollHeight - window.innerHeight;
    if (maxPx <= 0) return;
    const targetPx = (Math.max(0, Math.min(SCROLL_MAX, targetY)) / SCROLL_MAX) * maxPx;
    window.scrollTo({ top: targetPx, behavior: smooth ? 'smooth' : 'instant' });
};

// --- Hover rotation tracking ---
const hoverRaycaster = new window.THREE.Raycaster();
const hoverMouse = new window.THREE.Vector2();
let hoveredIndex = -1;           // index into cubes[]
const hoverVelX = new Map();     // per-cube residual velocity X
const hoverVelY = new Map();     // per-cube residual velocity Y
let prevMouseX = 0, prevMouseY = 0;

// HOVER_SPEED, HOVER_DAMPING, DEFAULT_ROTATE_SPEED imported from constants.js
// Local aliases for brevity
const DAMPING       = HOVER_DAMPING;
const DEFAULT_SPEED = DEFAULT_ROTATE_SPEED;

/**
 * Apply hover-driven or idle rotation to a single object.
 * @param {Object3D} obj
 * @param {string|number} key    — Map key for this object's velocity state
 * @param {number} [idleX]      — Idle rotation speed on X axis (default DEFAULT_SPEED)
 * @param {number} [idleY]      — Idle rotation speed on Y axis (default DEFAULT_SPEED)
 */
function applyHoverRotation(obj, key, idleX = DEFAULT_SPEED, idleY = DEFAULT_SPEED) {
    const vx = hoverVelX.get(key) || 0;
    const vy = hoverVelY.get(key) || 0;
    if (Math.abs(vx) > HOVER_VELOCITY_THRESHOLD || Math.abs(vy) > HOVER_VELOCITY_THRESHOLD) {
        obj.rotation.x += vx;
        obj.rotation.y += vy;
        hoverVelX.set(key, vx * DAMPING);
        hoverVelY.set(key, vy * DAMPING);
    } else {
        obj.rotation.x += idleX;
        obj.rotation.y += idleY;
        hoverVelX.delete(key);
        hoverVelY.delete(key);
    }
}

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

// Touch-based rotation + vertical scroll for mobile
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

// Precomputed once — avoids recalculating stars.length * 0.3 every frame
let _starUpdateCount = 0;
function updateStars() {
    if (!_starUpdateCount) _starUpdateCount = Math.floor(stars.length * 0.3);
    for (let i = 0; i < _starUpdateCount; i++) {
        const star = stars[Math.floor(Math.random() * stars.length)];
        star.position.z += 0.05;
        if (star.position.z > 50) star.position.z = -50;
    }
}

export function animate() {
    requestAnimationFrame(animate);

    // Cache once per frame — avoids repeated DOM width reads throughout the loop
    const isMobile = window.innerWidth < 768;

    // Mobile scroll: shift ortho frustum to slide viewport over content (like a webpage)
    if (isMobile && camera.isOrthographicCamera) {
        const fs = camera.userData.frustumSize;
        camera.top    =  fs / 2 - window.mobileScrollY;
        camera.bottom = -fs / 2 - window.mobileScrollY;
        camera.updateProjectionMatrix();
    }

    // Big title always faces camera
    if (window.bigTitle) {
        window.bigTitle.lookAt(camera.position);
        if (isMobile) {
            const fs = camera.userData?.frustumSize || 20;
            window.bigTitle.position.set(0, fs / 2 - window.mobileScrollY - 2, -5);
        } else {
            window.bigTitle.position.set(0, 0, -5);
        }
    }

    // Floating titles: hide on mobile; update position + visibility in a single pass on desktop
    if (isMobile) {
        titleObjects.forEach(title => { if (title.element) title.element.style.display = 'none'; });
        subTitles.forEach(title => { if (title.element) title.element.style.display = 'none'; });
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
        // Single pass covers both show/hide AND position update (was duplicated before)
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
        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
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
        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
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

    controls.update();
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
// animate() is started by main.js — intentionally NOT self-invoked here to prevent a double loop.
