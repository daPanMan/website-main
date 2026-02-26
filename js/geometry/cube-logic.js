// Geometry creation, positioning, floating titles, click/touch handlers, raycasting
import { scene, camera, renderer, addBigTitle } from '../core/scene-setup.js';
import { playSound, zoomInSound, zoomOutSound } from '../features/audio-controls.js';

const raycaster = new window.THREE.Raycaster();
const mouse = new window.THREE.Vector2();

export const cubes = [];          // top-level objects (Group or Mesh)
export const clickTargets = [];   // all meshes (for raycasting into groups)
export const originalPositions = [];
export let activeCube = null;
export const titleObjects = [];

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
        // Use the custom geometry/group returned by the geometry factory
        const obj = spec.type;

        // Store userData on the top-level object
        obj.userData = {
            ...(spec.userData || {}),
            label: spec.label,
            url: spec.url,
            index: i
        };

        // Position from predefined layout
        const pos = POSITIONS[i % POSITIONS.length];
        obj.position.set(pos.x, pos.y, pos.z);
        obj.frustumCulled = false;

        scene.add(obj);
        cubes.push(obj);
        originalPositions.push({ x: pos.x, y: pos.y, z: pos.z });

        // Collect all child meshes for raycasting (works for both Mesh and Group)
        if (obj.isMesh) {
            clickTargets.push(obj);
        } else {
            obj.traverse(child => {
                if (child.isMesh) {
                    // Propagate userData so we can find the parent on click
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
}

// Raycasting click handler — only fires when a 3D geometry is actually hit
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
    const intersects = raycaster.intersectObjects(clickTargets, false);
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        // Find the top-level cube object
        const parentIndex = hit.userData._parentIndex;
        const clickedObj = parentIndex !== undefined ? cubes[parentIndex] : hit;
        console.log('Clicked:', clickedObj.userData);
        // TODO: Add interaction logic (zoom, open iframe, etc.)
    }
}

window.addEventListener('click', onCubeClick);
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onCubeClick(event);
}, { passive: false });
