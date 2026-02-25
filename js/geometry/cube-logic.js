// Cube creation, positioning, floating titles, click/touch handlers, raycasting
import { scene, camera, renderer, addBigTitle } from '../core/scene-setup.js';
import { playSound, zoomInSound, zoomOutSound } from '../features/audio-controls.js';

const raycaster = new window.THREE.Raycaster();
const mouse = new window.THREE.Vector2();

export const cubes = [];
export const originalPositions = [];
export let activeCube = null;
export const titleObjects = [];

export function setupCubes(cubeSpecs) {
    let totalCubes = cubeSpecs.length;
    let cubesPerAxis = Math.ceil(Math.pow(totalCubes, 1/3));
    let cubeSize = 6;
    let offset = (cubesPerAxis - 1) / 2;
    for (let i = 0; i < cubeSpecs.length; i++) {
        // Create a real THREE.Mesh for each cube
        const geometry = new window.THREE.BoxGeometry(1, 1, 1);
        const material = new window.THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new window.THREE.Mesh(geometry, material);
        cube.userData = cubeSpecs[i].userData || {};
        cubes.push(cube);
        let xIndex = i % cubesPerAxis;
        let yIndex = Math.floor(i / cubesPerAxis) % cubesPerAxis;
        let zIndex = Math.floor(i / (cubesPerAxis * cubesPerAxis));
        let baseX = (xIndex - offset) * cubeSize;
        let baseY = (yIndex - offset) * cubeSize;
        let baseZ = (zIndex - offset) * cubeSize;
        const randomOffsetX = (Math.random() - 0.5) * 1;
        const randomOffsetY = (Math.random() - 0.5) * 1;
        const randomOffsetZ = (Math.random() - 0.5) * 1;
        cube.position.set(baseX + randomOffsetX, baseY + randomOffsetY, baseZ + randomOffsetZ);
        cube.frustumCulled = false;
        cube.rotation.set(0, 0, 0);
        scene.add(cube);
        originalPositions.push({ x: baseX, y: baseY, z: baseZ });
        addFloatingTitle && addFloatingTitle(cube, cube.userData.title);
        // animateCubeMovement && animateCubeMovement(cube);
    }
}

export function addFloatingTitle(cube, text) {
    const titleElement = document.createElement('div');
    titleElement.className = 'cube-title';
    titleElement.innerText = text;
    titleElement.style.position = 'absolute';
    titleElement.style.color = 'white';
    titleElement.style.fontSize = '60px';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.textShadow = '0px 0px 5px rgba(255,255,255,0.8)';
    titleElement.style.pointerEvents = 'none';
    titleElement.style.whiteSpace = 'nowrap';
    const titleObject = new window.THREE.CSS3DObject(titleElement);
    titleObject.scale.set(0.005, 0.005, 0.005);
    titleObject.position.copy(cube.position);
    titleObject.position.y += 2;
    titleObject.userData.cube = cube;
    scene.add(titleObject);
    titleObjects.push(titleObject);
}

// Raycasting click handler — only fires when a 3D cube is actually hit
function getPointer(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
}

function onCubeClick(event) {
    // Don't process clicks while the intro overlay is visible
    const introPage = document.getElementById('intro-page');
    if (introPage && introPage.style.display !== 'none') return;

    getPointer(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        console.log('Cube clicked!', clickedCube.userData);
        // TODO: Add cube interaction logic (zoom, open iframe, etc.)
    }
}

window.addEventListener('click', onCubeClick);
window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onCubeClick(event);
}, { passive: false });
