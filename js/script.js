import gsap from 'https://cdn.skypack.dev/gsap';
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

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

// Camera Position
camera.position.z = 2;

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


// Animate Cube on Scroll
gsap.to(cube.rotation, {
    x: 2 * Math.PI,
    y: 2 * Math.PI,
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});
