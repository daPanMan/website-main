import { gamepad } from './gamepad.js';
import { linkedInGeometry } from './linkedin.js';
import { mainPageGeometry } from './mainpage.js';

export const cubeSpecs = [
    { type: mainPageGeometry(), label: "Home", url: "./html/main.html" },
    { type: linkedInGeometry(), label: "LinkedIn", url: "./html/linkedIn.html" },
    { type: gamepad(), label: "Games", url: "./html/games.html" }
];

export function initGeometries() {
    cubeSpecs.forEach((spec, index) => {
        createCube(index, spec);
    });
}

function createCube(index, spec) {
    const geometry = spec.type;
    const material = new THREE.MeshStandardMaterial();
    const cube = new THREE.Mesh(geometry, material);
    
    cube.userData = {
        index: index,
        label: spec.label,
        url: spec.url
    };
    
    return cube;
}