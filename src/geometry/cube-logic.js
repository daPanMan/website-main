// Geometry creation, positioning, floating titles, click/touch handlers, raycasting
// Supports "sub-geometries" that expand when a parent object is clicked
import { scene, camera, renderer } from '../core/scene-setup.js';
import { playSound, zoomInSound, zoomOutSound, volumeDragging } from '../features/audio-controls.js';
import { showIframe, hideIframe, isIframeVisible } from '../features/iframe-display.js';
import { t, getLang } from '../i18n.js';

let savedScrollY = 0; // saved mobile scroll position before zoom/expand

const raycaster = new window.THREE.Raycaster();
const mouse = new window.THREE.Vector2();

// --- Shared helpers ---

/** Default camera Z based on viewport (mobile vs desktop) */
const getDefaultCameraZ = () => window.innerWidth < 768 ? 24 : 14;

/**
 * Kill all pending GSAP tweens on an object's transform properties.
 * Call before starting new tweens to prevent blending artefacts.
 */
function killObjectTweens(obj) {
    gsap.killTweensOf(obj.position);
    gsap.killTweensOf(obj.rotation);
    gsap.killTweensOf(obj.scale);
}

/**
 * Animate an object back to its stored original transform.
 * @param {Object3D} obj
 * @param {{ x, y, z }} pos
 * @param {{ x, y, z }} rot
 * @param {{ x, y, z }} scl
 * @param {number} duration
 * @param {number} delay
 */
function restoreObject(obj, pos, rot, scl, duration, delay) {
    killObjectTweens(obj);
    gsap.to(obj.position, { x: pos.x, y: pos.y, z: pos.z, duration, delay, ease: 'power2.out' });
    gsap.to(obj.rotation, { x: rot.x, y: rot.y, z: rot.z, duration, delay, ease: 'power2.out' });
    gsap.to(obj.scale,    { x: scl.x, y: scl.y, z: scl.z, duration: duration - 0.1, delay, ease: 'power2.out' });
}

// --- Shared animation helpers (extracted to eliminate duplication) ---

/** Hide the big title: slide out on desktop, fade out on mobile */
function hideBigTitle() {
    if (!window.bigTitle) return;
    if (window.innerWidth >= 768) {
        gsap.to(window.bigTitle.position, { z: -20, duration: 0.6, ease: 'power2.in' });
    }
    gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
}

/**
 * Restore the big title: slide back in on desktop, fade in on mobile.
 * @param {number} [delay=0.5]
 */
function restoreBigTitle(delay = 0.5) {
    if (!window.bigTitle) return;
    if (window.innerWidth >= 768) {
        gsap.to(window.bigTitle.position, { x: 0, y: 0, z: -5, duration: 0.8, delay, ease: 'power2.out' });
    }
    gsap.to(window.bigTitle.element.style, { opacity: 1, duration: 0.5, delay });
}

/**
 * Fly all cubes except one off-screen (deterministic directions).
 * Also fades out their floating titles.
 * @param {number} exceptIndex — index of the cube to leave in place
 */
function scatterOtherCubes(exceptIndex) {
    cubes.forEach((obj, i) => {
        if (i === exceptIndex) return;
        killObjectTweens(obj);
        const orig = originalPositions[i];
        const dx = orig.x !== 0 ? orig.x * 4 : (i % 2 === 0 ? -15 : 15);
        const dy = orig.y !== 0 ? orig.y * 4 : (i % 2 === 0 ? -10 : 10);
        gsap.to(obj.position, { x: dx, y: dy, z: -15, duration: 0.8, ease: 'power2.in' });
        gsap.to(obj.scale,    { x: 0.01, y: 0.01, z: 0.01, duration: 0.8, ease: 'power2.in' });
    });
    titleObjects.forEach(title => {
        if (title.userData.cube === cubes[exceptIndex]) return;
        gsap.to(title.element.style, { opacity: 0, duration: 0.4 });
        gsap.to(title.position, { z: -15, duration: 0.8 });
    });
}

/**
 * Animate all cubes back to their original formation positions.
 * @param {number}  activeIdx      — the "hero" cube index (slightly earlier delay)
 * @param {object}  [opts]
 * @param {number}  [opts.selfDelay=0.2]    — delay for the active cube
 * @param {number}  [opts.othersDelay=0.3]  — delay for all other cubes
 * @param {number}  [opts.titlesDelay=0.4]  — delay for title fade-in
 * @param {boolean} [opts.restoreTitles=true]
 */
function restoreFormation(activeIdx, {
    selfDelay   = 0.2,
    othersDelay = 0.3,
    titlesDelay = 0.4,
    restoreTitles = true
} = {}) {
    restoreObject(cubes[activeIdx],
        originalPositions[activeIdx], originalRotations[activeIdx], originalScales[activeIdx],
        0.7, selfDelay);
    cubes.forEach((obj, i) => {
        if (i === activeIdx) return;
        restoreObject(obj, originalPositions[i], originalRotations[i], originalScales[i], 0.7, othersDelay);
    });
    if (restoreTitles) {
        titleObjects.forEach(title => {
            gsap.to(title.element.style, { opacity: 1, duration: 0.5, delay: titlesDelay });
        });
    }
}

/**
 * Unified floating-title factory used for both main-object titles and sub-item titles.
 * Returns null on mobile (titles are hidden there).
 * @param {Object3D} obj
 * @param {string}   text
 * @param {object}   [opts]
 * @param {boolean}  [opts.fadeIn=false]   — start at opacity 0 and fade in
 * @param {number}   [opts.yOffset=1.3]    — world-unit offset above obj.position
 * @param {number}   [opts.fontSize=60]    — CSS font size in px
 */
function createFloatingTitle(obj, text, { fadeIn = false, yOffset = 1.3, fontSize = 60 } = {}) {
    if (!text || window.innerWidth < 768) return null;
    const el = document.createElement('div');
    el.className = 'cube-title';
    el.innerText = text;
    Object.assign(el.style, {
        position: 'absolute',
        color: 'white',
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        textShadow: '0px 0px 5px rgba(255,255,255,0.8)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        ...(fadeIn ? { opacity: '0' } : {})
    });
    const titleObj = new window.THREE.CSS3DObject(el);
    titleObj.scale.set(0.005, 0.005, 0.005);
    titleObj.position.copy(obj.position);
    titleObj.position.y += yOffset;
    titleObj.userData.cube = obj;
    scene.add(titleObj);
    if (fadeIn) gsap.to(el.style, { opacity: 1, duration: 0.5, delay: 0.3 });
    return titleObj;
}

/**
 * Spawn sub-geometry objects for a parent that has just been expanded.
 * Adds objects to subObjects, subTitles, subClickTargets and animates them
 * out to their fan/grid positions.
 * @param {object[]} subItems — filtered subItems array (lang already applied)
 */
function spawnSubItems(subItems) {
    const isMobile = window.innerWidth < 768;
    const centerX = 0, centerY = isMobile ? 0 : -1.8, centerZ = -2;
    const subPositions = getSubPositions(subItems.length);

    subItems.forEach((sub, si) => {
        const obj = sub.factory();
        obj.userData = {
            label:     sub.label,
            url:       sub.url || '',
            title:     sub.title || sub.label,
            _titleKey: sub._titleKey || null,
            isSubItem: true
        };
        obj.position.set(centerX, centerY, centerZ);
        obj.scale.set(0.01, 0.01, 0.01);
        obj.frustumCulled = false;
        scene.add(obj);
        subObjects.push(obj);

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

        const target = subPositions[si % subPositions.length];
        gsap.to(obj.position, { x: target.x, y: target.y, z: target.z, duration: 0.7, delay: si * 0.12, ease: 'back.out(1.4)' });
        gsap.to(obj.scale,    { x: 1, y: 1, z: 1, duration: 0.6, delay: si * 0.12, ease: 'back.out(1.4)' });

        const title = createFloatingTitle(obj, sub.title || sub.label, { fadeIn: true, fontSize: 50 });
        if (title) subTitles.push(title);
    });
}

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

// Shared texture cache — prevents re-loading the same image each expand/collapse cycle
// key = image src, value = THREE.Texture
const _textureCache = new Map();
const _origTextureLoaderLoad = window.THREE.TextureLoader.prototype.load;
window.THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
    if (_textureCache.has(url)) {
        const cached = _textureCache.get(url);
        if (onLoad) setTimeout(() => onLoad(cached), 0);
        return cached;
    }
    const tex = _origTextureLoaderLoad.call(this, url, (t) => {
        _textureCache.set(url, t);
        if (onLoad) onLoad(t);
    }, onProgress, onError);
    return tex;
};

/**
 * Recursively dispose geometry, materials (but NOT cached textures) from an Object3D tree.
 * Call after scene.remove(obj) to free GPU resources.
 */
function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(child => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
                // Don't dispose cached textures — they're shared and reused
                // (The texture cache keeps them alive intentionally)
                mat.dispose();
            });
        }
    });
}

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
    // Desktop: circular layout, wider horizontally but keep vertical span limited
    const radiusX = 8;   // bump outward to fan wider
    const radiusY = 6;   // keep same vertical extent as before
    const positions = [];
    // how much to nudge everything downward (except the bottom-most item)
    const downwardShift = 1.5;
    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
        const y = Math.sin(angle) * radiusY;
        let adjustedY = y + downwardShift;
        // the first element (angle = -π/2) sits at the bottom; keep it unmoved
        if (i === 0) {
            adjustedY = y;
        }
        positions.push({
            x: Math.cos(angle) * radiusX,
            y: adjustedY,
            z: 0
        });
    }
    // recenter vertically so the mean y is zero (keeps big title in center)
    const meanY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    if (meanY !== 0) {
        positions.forEach(p => { p.y -= meanY; });
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
    const title = createFloatingTitle(obj, text);
    if (title) titleObjects.push(title);
    return title;
}

// ==================== EXPAND / COLLAPSE ====================

// Positions for sub-items arranged in a semi-circle fan around the parent
// count = number of sub-items to place
function getSubPositions(count) {
    const n = count || 4;
    const isMobile = window.innerWidth < 768;
    const positions = [];

    if (isMobile) {
        // Mobile: instead of a fan, arrange subs in two vertical columns below
        // the theme geometry.  This puts the parent icon on top and then
        // children in a simple grid for easier tapping on small screens.
        const spacingX = 3;
        const spacingY = 2.5;
        for (let i = 0; i < n; i++) {
            const col = i % 2;              // 0=left, 1=right
            const row = Math.floor(i / 2);
            const x = col === 0 ? -spacingX : spacingX;
            const y = 1 - row * spacingY;    // start just below parent, go downward
            positions.push({ x, y, z: 0 });
        }
    } else {
        // Desktop: semi-circle fan above center with variable distance
        const baseRadius = 3.5;
        const startAngle = Math.PI;  // 180° (left)
        const endAngle   = 0;        // 0° (right)
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            const angle = startAngle + (endAngle - startAngle) * t;
            const diff = Math.abs(angle - Math.PI / 2);
            const radius = baseRadius + diff * 2;
            positions.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: 0
            });
        }
    }
    return positions;
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
    const defaultZ = getDefaultCameraZ();
    gsap.to(camera.position, { z: defaultZ - 4, duration: 0.9, ease: 'power2.inOut' });

    // 1. Hide the big title
    hideBigTitle();

    // 2. Animate other cubes + their titles out
    scatterOtherCubes(parentIdx);

    // 3. Move the clicked object to center of the fan (parent stays visible)
    if (window.innerWidth < 768) {
        // Mobile: bigTitle already hidden by hideBigTitle() above;
        // lift the parent so it sits clearly above the two-column children grid.
        gsap.to(parentObj.position, { x: 0, y: 5.5, z: -1, duration: 0.8, ease: 'power2.out' });
    } else {
        gsap.to(parentObj.position, { x: 0, y: -1.8, z: 0, duration: 0.8, ease: 'power2.out' });
    }
    // Move its title above center, then hide it once subs appear
    const parentTitle = titleObjects.find(t => t.userData.cube === parentObj);
    if (parentTitle) {
        gsap.to(parentTitle.element.style, { opacity: 0, duration: 0.4, delay: 0.5 });
    }

    // 4. After centering, spawn sub-geometries from behind the parent
    // Filter subItems by langOnly — e.g. langOnly: 'zh' only shows in Chinese mode
    const subItems = (parentObj.userData.subItems || []).filter(sub =>
        !sub.langOnly || sub.langOnly === getLang()
    );
    if (subItems.length === 0) return;

    setTimeout(() => {
        spawnSubItems(subItems);

        // Show the close/back button
        const closeBtn = document.getElementById('reset-scale-button');
        if (closeBtn) {
            closeBtn.style.display = 'block';
            closeBtn.textContent = t('back');
            closeBtn.onclick = (e) => { e.stopPropagation(); playSound(zoomOutSound); collapseToMain(); };
            closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); playSound(zoomOutSound); collapseToMain(); };
        }
    }, 700);
}

export function collapseToMain(restoreTitles = true) {
    if (!expandedParent) return;
    // Cancel any pending showIframe timeout
    if (_iframeShowTimeout) { clearTimeout(_iframeShowTimeout); _iframeShowTimeout = null; }
    const parentIdx = expandedParent.userData.index;

    // Hide iframe if it is showing a sub-item page
    hideIframe();

    // Hide close button
    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) closeBtn.style.display = 'none';

    // 1. Animate sub-objects back to center and remove
    subObjects.forEach((obj, i) => {
        gsap.killTweensOf(obj.position);
        gsap.killTweensOf(obj.scale);
        gsap.killTweensOf(obj.rotation);
        gsap.to(obj.position, { x: 0, y: 0, z: -2, duration: 0.5, ease: 'power2.in', onComplete: () => {
            scene.remove(obj);
            disposeObject(obj);
        }});
        gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power2.in' });
    });

    // Remove sub-titles
    subTitles.forEach(t => {
        gsap.killTweensOf(t.element?.style);
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

    // 2. Restore all cubes to formation
    restoreFormation(parentIdx, { selfDelay: 0.3, othersDelay: 0.4, titlesDelay: 0.5, restoreTitles });

    // 3. Bring back big title
    restoreBigTitle(0.5);

    // Zoom camera back out
    gsap.to(camera.position, { z: getDefaultCameraZ(), duration: 0.8, delay: 0.4, ease: 'power2.out' });

    // Restore mobile scroll position
    if (window.innerWidth < 768) {
        document.body.style.overflow = ''; // unlock scroll
        window.scrollMobileTo(savedScrollY, true);
    }

    expandedParent = null;
}

// -----------------------------------------------------------------------------
// Demo helper: expand "My Projects" then show URL in iframe
export function demoProject(url) {
    const parent = cubes.find(c => c.userData.label === "My Projects");
    if (!parent) return;
    if (!expandedParent) expandParent(parent);
    // delay to let sub-geometries appear
    setTimeout(() => {
        showIframe(url);
    }, 1200);
}

// ==================== CLICK HANDLER ====================

let zoomedCube = null; // cube zoomed in for iframe (non-subItem objects)
let _iframeShowTimeout = null; // tracked timeout so we can cancel stale showIframe calls

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

    // Hide big title and scatter other cubes
    hideBigTitle();
    scatterOtherCubes(idx);

    const isMobile = window.innerWidth < 768;

    // Center the clicked object (scale up proportionally from its original size)
    const os = originalScales[idx];
    const zoomFactor = 1.8;
    gsap.to(obj.position, { x: 0, y: isMobile ? 7 : 0, z: 2, duration: 0.8, ease: 'back.out(1.7)' });
    gsap.to(obj.scale, { x: os.x * zoomFactor, y: os.y * zoomFactor, z: os.z * zoomFactor, duration: 0.8, ease: 'back.out(1.7)' });

    // Zoom camera in
    gsap.to(camera.position, { z: getDefaultCameraZ() - 5, duration: 0.9, ease: 'power2.inOut' });

    // Show iframe after zoom animation (tracked so we can cancel if user navigates away)
    if (_iframeShowTimeout) { clearTimeout(_iframeShowTimeout); _iframeShowTimeout = null; }
    _iframeShowTimeout = setTimeout(() => {
        _iframeShowTimeout = null;
        if (zoomedCube !== obj) return; // state changed, abort
        showIframe(obj.userData.url);
        showCloseButton(() => { playSound(zoomOutSound); returnZoomedCube(); });
    }, 500);
}

// Return a zoomed-in cube to its original formation
function returnZoomedCube() {
    if (!zoomedCube) return;
    // Cancel any pending showIframe timeout
    if (_iframeShowTimeout) { clearTimeout(_iframeShowTimeout); _iframeShowTimeout = null; }
    const idx = zoomedCube.userData.index;

    hideIframe();

    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) closeBtn.style.display = 'none';

    // Restore formation
    restoreFormation(idx, { selfDelay: 0.2, othersDelay: 0.3, titlesDelay: 0.4 });
    restoreBigTitle(0.4);

    // Zoom camera back
    gsap.to(camera.position, { z: getDefaultCameraZ(), duration: 0.8, delay: 0.3, ease: 'power2.out' });

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

    // Center and scale up the clicked sub-object (slightly zoomed out & shifted up)
    if (window.innerWidth < 768) {
        // Mobile: move to top position as hanging object
        gsap.to(subObj.position, { x: 0, y: 8, z: 2, duration: 0.7, ease: 'back.out(1.4)' });
    } else {
        gsap.to(subObj.position, { x: 0, y: 1.5, z: 2, duration: 0.7, ease: 'back.out(1.4)' });
    }
    gsap.to(subObj.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.7, ease: 'back.out(1.4)' });

    // Show iframe after zoom (tracked so we can cancel if user navigates away)
    if (_iframeShowTimeout) { clearTimeout(_iframeShowTimeout); _iframeShowTimeout = null; }
    _iframeShowTimeout = setTimeout(() => {
        _iframeShowTimeout = null;
        if (zoomedSub !== subObj) return; // state changed, abort
        showIframe(url);
        showCloseButton(() => { playSound(zoomOutSound); returnZoomedSub(); });
    }, 400);
}

function returnZoomedSub() {
    if (!zoomedSub) return;
    // Cancel any pending showIframe timeout
    if (_iframeShowTimeout) { clearTimeout(_iframeShowTimeout); _iframeShowTimeout = null; }

    hideIframe();

    // Kill stale tweens before starting new ones
    gsap.killTweensOf(zoomedSub.position);
    gsap.killTweensOf(zoomedSub.scale);

    // Return zoomed sub to its spread position
    gsap.to(zoomedSub.position, { x: zoomedSubOrigPos.x, y: zoomedSubOrigPos.y, z: zoomedSubOrigPos.z, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    gsap.to(zoomedSub.scale, { x: zoomedSubOrigScale.x, y: zoomedSubOrigScale.y, z: zoomedSubOrigScale.z, duration: 0.6, delay: 0.2, ease: 'power2.out' });

    // Bring back other sub-objects
    const subPositions = getSubPositions(subObjects.length);
    subObjects.forEach((obj, i) => {
        if (obj === zoomedSub) return;
        gsap.killTweensOf(obj.position);
        gsap.killTweensOf(obj.scale);
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
        // Intentionally do NOT restore the parent's floating title here.
        // Keeping the central geometry title hidden when returning from an iframe
        // preserves the expected visual state for subpage interactions.
    }

    // Revert close button to Back
    const closeBtn = document.getElementById('reset-scale-button');
    if (closeBtn) {
        closeBtn.textContent = t('back');
        closeBtn.onclick = (e) => { e.stopPropagation(); playSound(zoomOutSound); collapseToMain(false); };
        closeBtn.ontouchstart = (e) => { e.stopPropagation(); e.preventDefault(); playSound(zoomOutSound); collapseToMain(false); };
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
        closeBtn.textContent = t('closeButton');
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

    // Block all 3D interaction during space tour
    if (window.spaceTourActive) return;

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
            } else {
                // Safety net: iframe is visible but no state variable owns it (stale state)
                hideIframe();
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

// ── Double-click / double-tap: reset to default view ────────────────────────
function resetToDefaultView() {
    const introPage = document.getElementById('intro-page');
    if (introPage && introPage.style.display !== 'none') return;
    if (window.spaceTourActive) return;
    if (volumeDragging) return;

    const defaultZ = getDefaultCameraZ();
    const isAtDefault = Math.abs(camera.position.z - defaultZ) < 0.5;
    const hasActiveState = !!(zoomedSub || zoomedCube || expandedParent);

    // Nothing to do if already in the default idle state
    if (isAtDefault && !hasActiveState) return;

    if (zoomedSub) {
        playSound(zoomOutSound);
        returnZoomedSub();
    } else if (zoomedCube) {
        playSound(zoomOutSound);
        returnZoomedCube();
    } else if (expandedParent) {
        playSound(zoomOutSound);
        collapseToMain();
    } else {
        // Camera was manually scrolled via mouse wheel — just snap it back
        playSound(zoomOutSound);
        gsap.to(camera.position, { z: defaultZ, duration: 0.7, ease: 'power2.out' });
    }
}

// Desktop double-click
window.addEventListener('dblclick', resetToDefaultView);

// Mobile double-tap (two touches within 300 ms)
let _lastTapTime = 0;
window.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - _lastTapTime < 300) {
        resetToDefaultView();
        _lastTapTime = 0;
    } else {
        _lastTapTime = now;
    }
}, { passive: true });

// ── Hot language switch ──────────────────────────────────────────────────────
// Retranslate sub-item floating titles and the Close Page / Back button.
window.addEventListener('langchange', () => {
    // When a parent is expanded, reloadSubItems() (called from main.js) handles
    // sub-title translation by collapsing the current titles and respawning them
    // with the new language text. Updating text here would cause it to flicker
    // mid-animation while the titles are still fading out — so we skip it.
    if (!expandedParent) {
        subTitles.forEach(titleObj => {
            const key = titleObj.userData.cube?.userData?._titleKey;
            if (key) titleObj.element.innerText = t(key);
        });
    }

    // Close/back button is not animating — safe to retranslate immediately.
    const closeBtn = document.getElementById('reset-scale-button');
    if (!closeBtn || closeBtn.style.display === 'none') return;
    if (zoomedCube || zoomedSub) {
        closeBtn.textContent = t('closeButton');
    } else if (expandedParent) {
        closeBtn.textContent = t('back');
    }
});

// Tear down current sub-items and respawn with the new language filter.
// Called from main.js langchange handler when a parent is expanded.
export function reloadSubItems() {
    if (!expandedParent) return;
    const parentObj = expandedParent;

    // 1. Animate current sub-items back to parent center and remove
    subObjects.forEach(obj => {
        gsap.killTweensOf(obj.position);
        gsap.killTweensOf(obj.scale);
        const center = window.innerWidth < 768 ? { x: 0, y: 0, z: -2 } : { x: 0, y: -1.8, z: -2 };
        gsap.to(obj.position, { ...center, duration: 0.45, ease: 'power2.in' });
        gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: 'power2.in' });
    });
    subTitles.forEach(t => {
        gsap.killTweensOf(t.element?.style);
        if (t.element) gsap.to(t.element.style, { opacity: 0, duration: 0.25 });
    });

    // 2. After collapse, clean up and respawn with new lang filter
    setTimeout(() => {
        subObjects.forEach(obj => scene.remove(obj));
        subTitles.forEach(t => scene.remove(t));
        subObjects.length = 0;
        subTitles.length = 0;
        subClickTargets.length = 0;

        // Re-filter for current language
        const subItems = (parentObj.userData.subItems || []).filter(sub =>
            !sub.langOnly || sub.langOnly === getLang()
        );
        if (subItems.length === 0) return;

        spawnSubItems(subItems);
    }, 500);
}

// Export for animation loop to update sub-titles and hover detection
export { subObjects, subTitles, subClickTargets, expandedParent };

// ── Space tour helpers ────────────────────────────────────────────────────────
/** Scatter ALL cubes + big title + hide all floating titles. Called when the space tour launches. */
export function scatterAllForTour() {
    // Build well-separated scatter positions for cubes + title (6 objects total).
    // Use a minimum-distance rejection loop so nothing clusters.
    const MIN_SEP   = 9;   // minimum world-unit gap between any two scattered objects
    const placed    = [];

    function pickPos(xRange, yRange, zMin, zMax) {
        for (let attempt = 0; attempt < 60; attempt++) {
            const x = (Math.random() - 0.5) * xRange;
            const y = (Math.random() - 0.5) * yRange;
            const z = zMin + Math.random() * (zMax - zMin);
            if (placed.every(p => {
                const dx=p[0]-x, dy=p[1]-y, dz=p[2]-z;
                return Math.sqrt(dx*dx+dy*dy+dz*dz) >= MIN_SEP;
            })) {
                placed.push([x, y, z]);
                return [x, y, z];
            }
        }
        // Fallback — place at a deterministic offset so we never freeze
        const off = placed.length * MIN_SEP;
        const pos = [(off % 3 - 1) * MIN_SEP, ((off % 2) - 0.5) * MIN_SEP, zMin];
        placed.push(pos);
        return pos;
    }

    // Big title — blast it away and hide completely
    if (window.bigTitle) {
        const [tx, ty, tz] = pickPos(44, 28, -20, -10);
        gsap.killTweensOf(window.bigTitle.position);
        gsap.killTweensOf(window.bigTitle.element.style);
        gsap.to(window.bigTitle.position, { x: tx, y: ty, z: tz, duration: 1.0, ease: 'power2.in' });
        gsap.to(window.bigTitle.element.style, { opacity: 0, duration: 0.4 });
    }

    // Cubes — spread wide across x/y/z so none overlap
    cubes.forEach((obj, i) => {
        killObjectTweens(obj);
        const [dx, dy, dz] = pickPos(46, 30, -20, -6);
        const delay = i * 0.10;
        gsap.to(obj.position, { x: dx, y: dy, z: dz, duration: 1.5, delay, ease: 'power1.inOut' });
        const os = originalScales[i];
        gsap.to(obj.scale, { x: os.x, y: os.y, z: os.z, duration: 0.9, delay, ease: 'power2.out' });
    });

    titleObjects.forEach((title, i) => {
        gsap.to(title.element.style, { opacity: 0, duration: 0.6, delay: i * 0.05 });
    });
}

/** Restore all cubes + big title to formation. Called mid-tour for a slow graceful reform. */
export function restoreAllFromTour(duration = 0.7) {
    // Manually animate back — we need a custom duration so can't use restoreFormation directly
    cubes.forEach((obj, i) => {
        // Don't kill tweens — just override with new target so the transition is seamless
        const pos   = originalPositions[i];
        const rot   = originalRotations[i];
        const scl   = originalScales[i];
        const delay = i * 0.10; // gentle stagger
        gsap.to(obj.position, { x: pos.x, y: pos.y, z: pos.z, duration, delay, ease: 'power1.inOut', overwrite: 'auto' });
        gsap.to(obj.rotation, { x: rot.x, y: rot.y, z: rot.z, duration, delay, ease: 'power1.inOut', overwrite: 'auto' });
        gsap.to(obj.scale,    { x: scl.x, y: scl.y, z: scl.z, duration, delay, ease: 'power1.inOut', overwrite: 'auto' });
    });
    // Fade floating titles back in after cubes are mostly home
    const titlesDelay = duration * 0.6;
    titleObjects.forEach(title => {
        gsap.killTweensOf(title.element.style);
        gsap.to(title.element.style, { opacity: 1, duration: 0.6, delay: titlesDelay });
    });
    restoreBigTitle(0.3);
}
