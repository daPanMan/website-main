// Import Three.js and OrbitControls
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create 3D Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add Light
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Set Camera Position
camera.position.z = 3;

// Enable OrbitControls
// Track mouse movement
let mouseX = 0, mouseY = 0;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth movement
controls.dampingFactor = 0.05;
controls.enableZoom = true; // Allow zooming
controls.enableRotate = true; // Allow rotation
controls.enablePan = false; // Disable panning

// Listen for mouse movement
document.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth) * 4 - 2; // Convert to world coordinates
    const y = -(event.clientY / window.innerHeight) * 4 + 2;
    gsap.to(cube.position, { x: x, y: y, duration: 0.5, ease: "power2.out" });
});

document.addEventListener('touchmove', (event) => {
    let touch = event.touches[0];
    const x = (touch.clientX / window.innerWidth) * 4 - 2;
    const y = -(touch.clientY / window.innerHeight) * 4 + 2;
    gsap.to(cube.position, { x: x, y: y, duration: 0.5, ease: "power2.out" });
});


// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate cube based on mouse position
    cube.rotation.y = mouseX * Math.PI;
    cube.rotation.x = mouseY * Math.PI;

    renderer.render(scene, camera);
}
animate();



// Handle Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

