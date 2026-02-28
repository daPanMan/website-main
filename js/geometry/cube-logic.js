// Geometry creation, positioning, floating titles, click/touch handlers, raycasting
// Supports "sub-geometries" that expand when a parent object is clicked
import { scene, camera, renderer, addBigTitle } from '../core/scene-setup.js';
import { playSound, zoomInSound, zoomOutSound } from '../features/audio-controls.js';

const raycaster = new window.THREE.Raycaster();
const mouse = new window.THREE.Vector2();

export const cubes = [];          // top-level objects (Group or Mesh)
export const clickTargets = [];   // all meshes (for raycasting into groups)
export const originalPositions = [];
const originalRotations = [];     // store initial rotations for consistent restore
const originalScales = [];        // store initial scales for consistent restore
export let activeCube = null;
export const titleObjects = [];

// --- Sub-geometry system ---
let expandedParent = null;        // which cube is currently expanded
const subObjects = [];            // active sub-geometry objects in scene
const subTitles = [];             // active sub-geometry title objects
const subClickTargets = [];       // meshes for sub-geometry raycasting

// Predefined positions so objects are nicely spread around the title
const POSITIONS = [
    { x: -5, y:  0, z: 0 },   // left
    { x:  5, y:  0, z: 0 },   // right
    { x:  0, y: -4, z: 0 },   // bottom center
    { x: -4, y:  3, z: 0 },   // top-left
    { x:  4, y:  3, z: 0 },   // top-right
    { x:  0, y:  4, z: 0 },   // top center
];

export function setupCubes(cubeSpecs) {
    for (let i = 0; i < cubeSpecs.length; i++) {
        const spec = cubeSpecs[i];
        const obj = spec.type;

        obj.userData = {
            ...(spec.userData || {}),
            label: spec.label,
            url: spec.url,
            index: i,
            subItems: spec.subItems || null  // sub-geometries config
        };

        const pos = POSITIONS[i % POSITIONS.length];
        obj.position.set(pos.x, pos.y, pos.z);
        obj.frustumCulled = false;

        scene.add(obj);
        cubes.push(obj);
        originalPositions.push({ x: pos.x, y: pos.y, z: pos.z });
        originalRotations.push({ x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z });
        originalScales.push({ x: obj.scale.x, y: obj.scale.y, z: obj.scale.z });

        if (obj.isMesh) {
            clickTargets.push(obj);
        } else {
            obj.traverse(child => {
                if (child.isMesh) {
                    child.userData._parentIndex = i;
                    clickTargets.push(child);
                }
            });
        }

        addFloatingTitle(obj, spec.userData?.title || spec.label);
    }
}

export function addFloatingTitle(obj, text) {
    if (!text) return;
    const titleElement = document.createElement('div');
    titleElement.className = 'cube-title';
    titleElement.innerText = text;
    Object.assign(titleElement.style, {
        position: 'absolute',
        color: 'white',
        fontSize: '60px',
        fontWeight: 'bold',
        textShadow: '0px 0px 5px rgba(255,255,255,0.8)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
    });
    const titleObject = new window.THREE.CSS3DObject(titleElement);
    titleObject.scale.set(0.005, 0.005, 0.005);
    titleObject.position.copy(obj.position);
    titleObject.position.y += 2;
    titleObject.userData.cube = obj;
    scene.add(titleObject);
    titleObjects.push(titleObject);
    return titleObject;
}

// ==================== EXPAND / COLLAPSE ====================

// Positions for sub-items arranged around the centered parent
const SUB_POSITIONS = [
    { x: -4, y:  2, z: 0 },   // top-left
    { x:  4, y:  2, z: 0 },   // top-right
    { x: -4, y: -2, z: 0 },   // bottom-left
    { x:  4, y: -2, z: 0 },   // bottom-right
    { x:  0, y:  3.5, z: 0 }, // top center
];

function expandParent(parentObj) {
    if (expandedParent) return; // already expanded
    expandedParent = parentObj;
    const parentIdx = parentObj.userData.index;

    // 0. Zoom camera in a bit
    const defaultZ = window.innerWidth < 768 ? 25 : 14;
    gsap.to(camera.position, { z: defaultZ - 4, duration: 0.9, ease: 'power2.inOut' });

    // 1. Hide the big title
    if (window.bigTitle) {
        gsap.to(window.bigTitle.position, { z: -20, duration: 0.6, ease: 'power2.in' });
        gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
    }

    // 2. Animate other cubes + their titles out (deterministic directions from original positions)
    cubes.forEach((obj, i) => {
        if (i === parentIdx) return;
        const orig = originalPositions[i];
        // Fly out along a scaled version of their original offset from center
        const dx = orig.x !== 0 ? orig.x * 4 : (i % 2 === 0 ? -15 : 15);
        const dy = orig.y !== 0 ? orig.y * 4 : (i % 2 === 0 ? -10 : 10);
        gsap.to(obj.position, { x: dx, y: dy, z: -15, duration: 0.8, ease: 'power2.in' });
        gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power2.in' });
    });
    // Fade out titles of other cubes
    titleObjects.forEach(title => {
        if (title.userData.cube === parentObj) return;
        gsap.to(title.element.style, { opacity: 0, duration: 0.4 });
        gsap.to(title.position, { z: -15, duration: 0.8 });
    });

    // 3. Center the clicked controller
    gsap.to(parentObj.position, { x: 0, y: 0, z: 2, duration: 0.8, ease: 'power2.out' });
    // Move its title above center
    const parentTitle = titleObjects.find(t => t.userData.cube === parentObj);
    if (parentTitle) {
        gsap.to(parentTitle.element.style, { opacity: 1, duration: 0.5 });
    }

    // 4. After centering, spawn sub-geometries from behind the parent
    const subItems = parentObj.userData.subItems;
    if (!subItems || subItems.length === 0) return;

    setTimeout(() => {
        subItems.forEach((sub, si) => {
            const obj = sub.factory();
            obj.userData = {
                label: sub.label,
                url: sub.url || '',
                title: sub.title || sub.label,
                isSubItem: true
            };

            // Start at the parent's center position (behind it)
            obj.position.set(0, 0, -2);
            obj.scale.set(0.01, 0.01, 0.01);
            obj.frustumCulled = false;
            scene.add(obj);
            subObjects.push(obj);

            // Register click targets
            if (obj.isMesh) {
                subClickTargets.push(obj);
            } else {
                obj.traverse(child => {
                    if (child.isMesh) {
                        child.userData._subIndex = si;
                        subClickTargets.push(child);
                    }
                });
            }

            // Animate to spread position
            const target = SUB_POSITIONS[si % SUB_POSITIONS.length];
            gsap.to(obj.position, { x: target.x, y: target.y, z: target.z, duration: 0.7, delay: si * 0.12, ease: 'back.out(1.4)' });
            gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: 0.6, delay: si * 0.12, ease: 'back.out(1.4)' });

            // Add floating title for sub-item
            const title = addSubTitle(obj, sub.title || sub.label);
            if (title) subTitles.push(title);
        });

        // Show the close/back button
        const closeBtn = document.getElementById('reset-scale-button');
        if (closeBtn) {
            closeBtn.style.display = 'block';
            closeBtn.textContent = 'Back';
            closeBtn.onclick = collapseToMain;
        }
    }, 700);
}

function addSubTitle(obj, text) {
    if (!text) return null;
    const el = document.createElement('div');
    el.className = 'cube-title';
    el.innerText = text;
    Object.assign(el.style, {
        position: 'absolute',
        color: 'white',
        fontSize: '50px',
        fontWeight: 'bold',
        textShadow: '0px 0px 5px rgba(255,255,255,0.8)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        opacity: '0'
    });
    const titleObj = new window.THREE.CSS3DObject(el);
    titleObj.scale.set(0.005, 0.005, 0.005);
    titleObj.position.copy(obj.position);
    titleObj.position.y += 2;
    titleObj.userData.cube = obj;
    scene.add(titleObj);
    // Fade in
    gsap.to(el.style, { opacity: 1, duration: 0.5, delay: 0.3 });
    return titleObj;
}

export function collapseToMain() {
    if (!expandedParent) return;
    const parentIdx = expandedParent.userData.index;

    // Hide close button
    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) closeBtn.style.display = 'none';

    // 1. Animate sub-objects back to center and remove
    subObjects.forEach((obj, i) => {
        gsap.to(obj.position, { x: 0, y: 0, z: -2, duration: 0.5, ease: 'power2.in', onComplete: () => {
            scene.remove(obj);
        }});
        gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power2.in' });
    });

    // Remove sub-titles
    subTitles.forEach(t => {
        gsap.to(t.element.style, { opacity: 0, duration: 0.3, onComplete: () => {
            scene.remove(t);
        }});
    });

    // Clear sub arrays
    setTimeout(() => {
        subObjects.length = 0;
        subTitles.length = 0;
        subClickTargets.length = 0;
    }, 600);

    // 2. Move parent back to original position
    const origPos = originalPositions[parentIdx];
    const origRot = originalRotations[parentIdx];
    const origScale = originalScales[parentIdx];
    gsap.to(expandedParent.position, { x: origPos.x, y: origPos.y, z: origPos.z, duration: 0.7, delay: 0.3, ease: 'power2.out' });
    gsap.to(expandedParent.rotation, { x: origRot.x, y: origRot.y, z: origRot.z, duration: 0.7, delay: 0.3, ease: 'power2.out' });
    gsap.to(expandedParent.scale, { x: origScale.x, y: origScale.y, z: origScale.z, duration: 0.6, delay: 0.3, ease: 'power2.out' });

    // 3. Bring back other cubes at exact original positions, rotations, and scales
    cubes.forEach((obj, i) => {
        if (i === parentIdx) return;
        const orig = originalPositions[i];
        const oRot = originalRotations[i];
        const oScale = originalScales[i];
        gsap.to(obj.position, { x: orig.x, y: orig.y, z: orig.z, duration: 0.7, delay: 0.4, ease: 'power2.out' });
        gsap.to(obj.rotation, { x: oRot.x, y: oRot.y, z: oRot.z, duration: 0.7, delay: 0.4, ease: 'power2.out' });
        gsap.to(obj.scale, { x: oScale.x, y: oScale.y, z: oScale.z, duration: 0.6, delay: 0.4, ease: 'power2.out' });
    });

    // Restore titles
    titleObjects.forEach(title => {
        gsap.to(title.element.style, { opacity: 1, duration: 0.5, delay: 0.5 });
        // Position will be updated by animation loop
    });

    // Bring back big title
    if (window.bigTitle) {
        gsap.to(window.bigTitle.position, { z: -5, duration: 0.6, delay: 0.5, ease: 'power2.out' });
        gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay: 0.6 });
    }

    // Zoom camera back out
    const defaultZ = window.innerWidth < 768 ? 25 : 14;
    gsap.to(camera.position, { z: defaultZ, duration: 0.8, delay: 0.4, ease: 'power2.out' });

    expandedParent = null;
}

// ==================== CLICK HANDLER ====================

function getPointer(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
}

function onCubeClick(event) {
    const introPage = document.getElementById('intro-page');
    if (introPage && introPage.style.display !== 'none') return;

    getPointer(event);
    raycaster.setFromCamera(mouse, camera);

    // If expanded, check sub-objects first
    if (expandedParent && subClickTargets.length > 0) {
        const subHits = raycaster.intersectObjects(subClickTargets, false);
        if (subHits.length > 0) {
            const hit = subHits[0].object;
            const subIdx = hit.userData._subIndex;
            const subObj = subIdx !== undefined ? subObjects[subIdx] : hit;
            const url = subObj.userData.url || hit.userData.url;
            if (url) {
                console.log('Sub-item clicked:', subObj.userData);
                // Open in iframe or navigate
                window.open(url, '_blank');
            }
            return;
        }
    }

    const intersects = raycaster.intersectObjects(clickTargets, false);
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const parentIndex = hit.userData._parentIndex;
        const clickedObj = parentIndex !== undefined ? cubes[parentIndex] : hit;
        console.log('Clicked:', clickedObj.userData);

        // If this object has sub-items, expand it
        if (clickedObj.userData.subItems && !expandedParent) {
            expandParent(clickedObj);
        }
    }
}

window.addEventListener('click', onCubeClick);
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onCubeClick(event);
}, { passive: false });

// Export for animation loop to update sub-titles
export { subObjects, subTitles, expandedParent };
