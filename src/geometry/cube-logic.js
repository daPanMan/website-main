// Geometry creation, positioning, floating titles, click/touch handlers, raycasting
// Supports "sub-geometries" that expand when a parent object is clicked
import { scene, camera, renderer, addBigTitle } from '../core/scene-setup.js';
import { playSound, zoomInSound, zoomOutSound, volumeDragging } from '../features/audio-controls.js';
import { showIframe, hideIframe, isIframeVisible } from '../features/iframe-display.js';

let savedScrollY = 0; // saved mobile scroll position before zoom/expand

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

// Generate evenly-spaced circular positions for any number of objects
function generatePositions(count) {
    if (window.innerWidth < 768) {
        // Mobile: vertical column on a flat 2D plane
        const startY = 4;
        const spacing = 4.5;
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push({ x: 0, y: startY - i * spacing, z: 0 });
        }
        return positions;
    }
    // Desktop: circular layout
    const radius = 6;
    const positions = [];
    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
        positions.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: 0
        });
    }
    return positions;
}

export function setupCubes(cubeSpecs) {
    const POSITIONS = generatePositions(cubeSpecs.length);
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
    // Do not create per-geometry floating titles on narrow/mobile viewports
    const isMobile = window.innerWidth < 768;
    if (isMobile) return null;

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
// Adjust spacing based on screen size
function getSubPositions() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // Mobile: vertical column below the parent on flat 2D plane
        const startY = 3;
        const spacing = 4.5;
        return [
            { x: 0, y: startY,                z: 0 },
            { x: 0, y: startY - spacing,      z: 0 },
            { x: 0, y: startY - spacing * 2,  z: 0 },
            { x: 0, y: startY - spacing * 3,  z: 0 },
            { x: 0, y: startY - spacing * 4,  z: 0 },
        ];
    }
    // Desktop: triangular formation (1 top, 2 bottom — or pyramid for more)
    const sx = 4;  // horizontal spread
    const sy = 2.5; // vertical spread
    return [
        { x:  0,  y:  sy, z: 0 },   // top center
        { x: -sx, y: -sy, z: 0 },   // bottom-left
        { x:  sx, y: -sy, z: 0 },   // bottom-right
        { x: -sx, y:  sy, z: 0 },   // extra: top-left
        { x:  sx, y:  sy, z: 0 },   // extra: top-right
    ];
}

function expandParent(parentObj) {
    if (expandedParent) return; // already expanded
    expandedParent = parentObj;
    const parentIdx = parentObj.userData.index;

    // Save and reset mobile scroll so the expanded view starts centered
    if (window.innerWidth < 768) {
        savedScrollY = window.mobileScrollY || 0;
        window.scrollMobileTo(0, true);
        document.body.style.overflow = 'hidden'; // lock scroll during expand
    }

    // 0. Zoom camera in a bit
    const defaultZ = window.innerWidth < 768 ? 24 : 14;
    gsap.to(camera.position, { z: defaultZ - 4, duration: 0.9, ease: 'power2.inOut' });

    // 1. Hide the big title (desktop only — on mobile it stays pinned at top)
    if (window.bigTitle && window.innerWidth >= 768) {
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

    // 3. Move the clicked object to center, behind the sub-items so it doesn't block them
    if (window.innerWidth < 768) {
        // Mobile: move to top where title is, hide the big title
        if (window.bigTitle) {
            gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
        }
        gsap.to(parentObj.position, { x: 0, y: 7, z: -2, duration: 0.8, ease: 'power2.out' });
    } else {
        gsap.to(parentObj.position, { x: 0, y: -1.5, z: 2, duration: 0.8, ease: 'power2.out' });
    }
    // Move its title above center, then hide it once subs appear
    const parentTitle = titleObjects.find(t => t.userData.cube === parentObj);
    if (parentTitle) {
        gsap.to(parentTitle.element.style, { opacity: 0, duration: 0.4, delay: 0.5 });
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
            if (window.innerWidth < 768) {
                obj.position.set(0, 7, -2);
            } else {
                obj.position.set(0, 0, -2);
            }
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
            const subPositions = getSubPositions();
            const target = subPositions[si % subPositions.length];
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
            closeBtn.onclick = (e) => { e.stopPropagation(); playSound(zoomOutSound); collapseToMain(); };
            closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); playSound(zoomOutSound); collapseToMain(); };
        }
    }, 700);
}

function addSubTitle(obj, text) {
    if (!text) return null;
    // Skip creating sub-item titles on mobile
    if (window.innerWidth < 768) return null;
    const el = document.createElement('div');
    el.className = 'cube-title';
    el.innerText = text;
    Object.assign(el.style, {
        position: 'absolute',
        color: 'white',
        fontSize: window.innerWidth < 768 ? '34px' : '50px',
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

    // Hide iframe if it is showing a sub-item page
    hideIframe();

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

    // Bring back big title (desktop only — on mobile it never left)
    if (window.bigTitle && window.innerWidth >= 768) {
        gsap.to(window.bigTitle.position, { z: -5, duration: 0.6, delay: 0.5, ease: 'power2.out' });
        gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay: 0.6 });
    }
    // Mobile: restore big title visibility
    if (window.bigTitle && window.innerWidth < 768) {
        gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay: 0.5 });
    }

    // Zoom camera back out
    const defaultZ = window.innerWidth < 768 ? 24 : 14;
    gsap.to(camera.position, { z: defaultZ, duration: 0.8, delay: 0.4, ease: 'power2.out' });

    // Restore mobile scroll position
    if (window.innerWidth < 768) {
        document.body.style.overflow = ''; // unlock scroll
        window.scrollMobileTo(savedScrollY, true);
    }

    expandedParent = null;
}

// ==================== CLICK HANDLER ====================

let zoomedCube = null; // cube zoomed in for iframe (non-subItem objects)

function getPointer(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
}

// Zoom a single object to center and show its page in the iframe
function zoomCubeIn(obj) {
    if (zoomedCube === obj) return;
    if (zoomedCube) returnZoomedCube();

    zoomedCube = obj;
    activeCube = obj;
    const idx = obj.userData.index;

    // Save and reset mobile scroll
    if (window.innerWidth < 768) {
        savedScrollY = window.mobileScrollY || 0;
        window.scrollMobileTo(0, true);
        document.body.style.overflow = 'hidden'; // lock scroll during zoom
    }

    // Kill any ongoing GSAP tweens so the object snaps cleanly
    gsap.killTweensOf(obj.position);
    gsap.killTweensOf(obj.rotation);
    gsap.killTweensOf(obj.scale);

    // Hide big title (desktop only — on mobile it stays pinned at top)
    if (window.bigTitle && window.innerWidth >= 768) {
        gsap.to(window.bigTitle.position, { z: -20, duration: 0.6, ease: 'power2.in' });
        gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
    }
    // Mobile: hide big title and move geometry to top
    if (window.bigTitle && window.innerWidth < 768) {
        gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
    }

    // Move other cubes out (same deterministic directions as expand)
    cubes.forEach((c, i) => {
        if (i === idx) return;
        const orig = originalPositions[i];
        const dx = orig.x !== 0 ? orig.x * 4 : (i % 2 === 0 ? -15 : 15);
        const dy = orig.y !== 0 ? orig.y * 4 : (i % 2 === 0 ? -10 : 10);
        gsap.to(c.position, { x: dx, y: dy, z: -15, duration: 0.8, ease: 'power2.in' });
        gsap.to(c.scale,    { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power2.in' });
    });
    titleObjects.forEach(title => {
        if (title.userData.cube === obj) return;
        gsap.to(title.element.style, { opacity: 0, duration: 0.4 });
        gsap.to(title.position, { z: -15, duration: 0.8 });
    });

    // Center the clicked object (scale up proportionally from its original size)
    const os = originalScales[idx];
    const zoomFactor = 1.8;
    if (window.innerWidth < 768) {
        // Mobile: move geometry to top position as hanging object
        gsap.to(obj.position, { x: 0, y: 7, z: 2, duration: 0.8, ease: 'back.out(1.7)' });
    } else {
        gsap.to(obj.position, { x: 0, y: 0, z: 2, duration: 0.8, ease: 'back.out(1.7)' });
    }
    gsap.to(obj.scale, { x: os.x * zoomFactor, y: os.y * zoomFactor, z: os.z * zoomFactor, duration: 0.8, ease: 'back.out(1.7)' });

    // Zoom camera in
    const defaultZ = window.innerWidth < 768 ? 24 : 14;
    gsap.to(camera.position, { z: defaultZ - 5, duration: 0.9, ease: 'power2.inOut' });

    // Show iframe after zoom animation
    setTimeout(() => {
        showIframe(obj.userData.url);
        showCloseButton(() => { playSound(zoomOutSound); returnZoomedCube(); });
    }, 500);
}

// Return a zoomed-in cube to its original formation
function returnZoomedCube() {
    if (!zoomedCube) return;
    const idx = zoomedCube.userData.index;

    hideIframe();

    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) closeBtn.style.display = 'none';

    // Return zoomed cube to original
    const origPos = originalPositions[idx];
    const origRot = originalRotations[idx];
    const origScale = originalScales[idx];
    gsap.to(zoomedCube.position, { x: origPos.x, y: origPos.y, z: origPos.z, duration: 0.7, delay: 0.2, ease: 'power2.out' });
    gsap.to(zoomedCube.rotation, { x: origRot.x, y: origRot.y, z: origRot.z, duration: 0.7, delay: 0.2, ease: 'power2.out' });
    gsap.to(zoomedCube.scale, { x: origScale.x, y: origScale.y, z: origScale.z, duration: 0.7, delay: 0.2, ease: 'power2.out' });

    // Bring back all other cubes
    cubes.forEach((c, i) => {
        if (i === idx) return;
        const orig = originalPositions[i];
        const oRot = originalRotations[i];
        const oScale = originalScales[i];
        gsap.to(c.position, { x: orig.x, y: orig.y, z: orig.z, duration: 0.7, delay: 0.3, ease: 'power2.out' });
        gsap.to(c.rotation, { x: oRot.x, y: oRot.y, z: oRot.z, duration: 0.7, delay: 0.3, ease: 'power2.out' });
        gsap.to(c.scale,    { x: oScale.x, y: oScale.y, z: oScale.z, duration: 0.6, delay: 0.3, ease: 'power2.out' });
    });

    // Restore titles
    titleObjects.forEach(title => {
        gsap.to(title.element.style, { opacity: 1, duration: 0.5, delay: 0.4 });
    });

    // Bring back big title (desktop only — on mobile it never left)
    if (window.bigTitle && window.innerWidth >= 768) {
        gsap.to(window.bigTitle.position, { z: -5, duration: 0.6, delay: 0.4, ease: 'power2.out' });
        gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay: 0.5 });
    }
    // Mobile: restore big title visibility
    if (window.bigTitle && window.innerWidth < 768) {
        gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay: 0.4 });
    }

    // Zoom camera back
    const defaultZ = window.innerWidth < 768 ? 24 : 14;
    gsap.to(camera.position, { z: defaultZ, duration: 0.8, delay: 0.3, ease: 'power2.out' });

    // Restore mobile scroll position
    if (window.innerWidth < 768) {
        document.body.style.overflow = ''; // unlock scroll
        window.scrollMobileTo(savedScrollY, true);
    }

    zoomedCube = null;
    activeCube = null;
}

// --- Zoom a sub-geometry to center and show its page ---
let zoomedSub = null;           // currently zoomed sub-object
let zoomedSubOrigPos = null;    // its position before zoom
let zoomedSubOrigScale = null;  // its scale before zoom

function zoomSubIn(subObj, url) {
    if (zoomedSub === subObj) return;
    if (zoomedSub) returnZoomedSub();

    zoomedSub = subObj;
    zoomedSubOrigPos = { x: subObj.position.x, y: subObj.position.y, z: subObj.position.z };
    zoomedSubOrigScale = { x: subObj.scale.x, y: subObj.scale.y, z: subObj.scale.z };

    gsap.killTweensOf(subObj.position);
    gsap.killTweensOf(subObj.rotation);
    gsap.killTweensOf(subObj.scale);

    // Move other sub-objects out
    subObjects.forEach(obj => {
        if (obj === subObj) return;
        gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power2.in' });
        gsap.to(obj.position, { z: -5, duration: 0.5, ease: 'power2.in' });
    });
    // Fade out other sub-titles
    subTitles.forEach(t => {
        if (t.userData.cube === subObj) return;
        gsap.to(t.element.style, { opacity: 0, duration: 0.3 });
    });
    // Also fade out the parent title
    if (expandedParent) {
        const parentTitle = titleObjects.find(t => t.userData.cube === expandedParent);
        if (parentTitle) gsap.to(parentTitle.element.style, { opacity: 0, duration: 0.3 });
    }
    // Shrink the parent controller out of the way
    if (expandedParent) {
        gsap.to(expandedParent.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power2.in' });
    }

    // Center and scale up the clicked sub-object
    if (window.innerWidth < 768) {
        // Mobile: move to top position as hanging object
        gsap.to(subObj.position, { x: 0, y: 7, z: 2, duration: 0.7, ease: 'back.out(1.4)' });
    } else {
        gsap.to(subObj.position, { x: 0, y: 0, z: 2, duration: 0.7, ease: 'back.out(1.4)' });
    }
    gsap.to(subObj.scale, { x: 2, y: 2, z: 2, duration: 0.7, ease: 'back.out(1.4)' });

    // Show iframe after zoom
    setTimeout(() => {
        showIframe(url);
        showCloseButton(() => { playSound(zoomOutSound); returnZoomedSub(); });
    }, 400);
}

function returnZoomedSub() {
    if (!zoomedSub) return;

    hideIframe();

    // Return zoomed sub to its spread position
    gsap.to(zoomedSub.position, { x: zoomedSubOrigPos.x, y: zoomedSubOrigPos.y, z: zoomedSubOrigPos.z, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    gsap.to(zoomedSub.scale, { x: zoomedSubOrigScale.x, y: zoomedSubOrigScale.y, z: zoomedSubOrigScale.z, duration: 0.6, delay: 0.2, ease: 'power2.out' });

    // Bring back other sub-objects
    const subPositions = getSubPositions();
    subObjects.forEach((obj, i) => {
        if (obj === zoomedSub) return;
        const target = subPositions[i % subPositions.length];
        gsap.to(obj.position, { x: target.x, y: target.y, z: target.z, duration: 0.6, delay: 0.3, ease: 'power2.out' });
        gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: 0.5, delay: 0.3, ease: 'power2.out' });
    });
    // Restore sub-titles
    subTitles.forEach(t => {
        gsap.to(t.element.style, { opacity: 1, duration: 0.4, delay: 0.3 });
    });
    // Restore parent controller
    if (expandedParent) {
        const origScale = originalScales[expandedParent.userData.index];
        gsap.to(expandedParent.scale, { x: origScale.x, y: origScale.y, z: origScale.z, duration: 0.5, delay: 0.3, ease: 'power2.out' });
        const parentTitle = titleObjects.find(t => t.userData.cube === expandedParent);
        if (parentTitle) gsap.to(parentTitle.element.style, { opacity: 1, duration: 0.4, delay: 0.4 });
    }

    // Revert close button to Back
    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) {
        closeBtn.textContent = 'Back';
        closeBtn.onclick = (e) => { e.stopPropagation(); playSound(zoomOutSound); collapseToMain(); };
        closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); playSound(zoomOutSound); collapseToMain(); };
    }

    zoomedSub = null;
    zoomedSubOrigPos = null;
    zoomedSubOrigScale = null;
}

// Helper: show close/back button with a callback
function showCloseButton(callback) {
    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) {
        closeBtn.style.display = 'block';
        closeBtn.textContent = 'Close Page';
        closeBtn.onclick = (e) => { e.stopPropagation(); callback(); };
        // Add touchstart for instant response on mobile (no 300ms delay)
        closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); callback(); };
    }
}

// --- Drag detection: ignore clicks that are actually drags ---
let pointerDownX = 0, pointerDownY = 0;
const DRAG_THRESHOLD = 5; // px — movement beyond this = drag, not a click
window.addEventListener('mousedown', (e) => { pointerDownX = e.clientX; pointerDownY = e.clientY; });
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { pointerDownX = e.touches[0].clientX; pointerDownY = e.touches[0].clientY; }
}, { passive: true });

function isDrag(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    return Math.abs(x - pointerDownX) > DRAG_THRESHOLD || Math.abs(y - pointerDownY) > DRAG_THRESHOLD;
}

function onCubeClick(event) {
    const introPage = document.getElementById('intro-page');
    if (introPage && introPage.style.display !== 'none') return;

    // Ignore if volume slider was being dragged
    if (volumeDragging) return;

    // Ignore drags — only respond to short, stationary clicks
    if (isDrag(event)) return;

    getPointer(event);
    raycaster.setFromCamera(mouse, camera);

    // If iframe is visible and user clicks empty space, close it
    if (isIframeVisible()) {
        // Check if they clicked a cube/sub — if not, close
        const anyHit = raycaster.intersectObjects([...clickTargets, ...subClickTargets], false);
        if (anyHit.length === 0) {
            if (zoomedCube) {
                playSound(zoomOutSound);
                returnZoomedCube();
            } else if (zoomedSub) {
                playSound(zoomOutSound);
                returnZoomedSub();
            } else if (expandedParent) {
                hideIframe().then(() => {
                    const closeBtn = document.getElementById('reset-scale-button');
                    if (closeBtn) {
                        closeBtn.textContent = 'Back';
                        closeBtn.onclick = (e) => { e.stopPropagation(); playSound(zoomOutSound); collapseToMain(); };
                        closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); playSound(zoomOutSound); collapseToMain(); };
                    }
                });
            }
            return;
        }
    }

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
                playSound(zoomInSound);
                zoomSubIn(subObj, url);
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
            playSound(zoomInSound);
            expandParent(clickedObj);
        }
        // If the expanded parent is clicked again, collapse back
        else if (clickedObj === expandedParent) {
            playSound(zoomOutSound);
            collapseToMain();
        }
        // Otherwise, zoom in and show its page in the iframe
        else if (!clickedObj.userData.subItems && !expandedParent && !zoomedCube) {
            playSound(zoomInSound);
            zoomCubeIn(clickedObj);
        }
    }
    // Clicked empty space while expanded (sub-page) — collapse back to main
    else if (expandedParent && !zoomedSub) {
        playSound(zoomOutSound);
        collapseToMain();
    }
}

window.addEventListener('click', onCubeClick);

// On mobile, touchstart fires before click. We use a flag to prevent
// the subsequent click event from double-triggering onCubeClick.
let touchHandled = false;
window.addEventListener('touchstart', (event) => {
    // Only handle single-finger taps as clicks (don't block pinch-zoom)
    if (event.touches.length === 1) {
        touchHandled = true;
        onCubeClick(event);
        // Reset after a short delay so future mouse clicks still work
        setTimeout(() => { touchHandled = false; }, 400);
    }
}, { passive: true });

// Wrap the click listener to skip if touch already handled
const origOnCubeClick = onCubeClick;
window.removeEventListener('click', onCubeClick);
window.addEventListener('click', (event) => {
    if (touchHandled) return; // skip — already handled by touchstart
    origOnCubeClick(event);
});

// Export for animation loop to update sub-titles and hover detection
export { subObjects, subTitles, subClickTargets, expandedParent };
