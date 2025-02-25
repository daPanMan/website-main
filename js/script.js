/// Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = false;

// Load Texture
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('textures/box.jpg'); // Make sure this path is correct

// Create a 3D Cube with Texture
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Set Initial Camera Position
camera.position.z = 3;

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Mouse Movement Effect
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Touch Movement Effect
document.addEventListener('touchmove', (event) => {
    let touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
});

// Gyroscope Movement Effect (for smartphones)
window.addEventListener("deviceorientation", (event) => {
    let beta = event.beta ? event.beta : 0; // Tilt front/back (-180 to 180)
    let gamma = event.gamma ? event.gamma : 0; // Tilt left/right (-90 to 90)

    // Convert gyroscope values to match Three.js rotation
    cube.rotation.x = THREE.MathUtils.degToRad(beta) * 0.5;
    cube.rotation.y = THREE.MathUtils.degToRad(gamma) * 0.5;
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Make Cube Rotate Based on Mouse/Touch Movement
    cube.rotation.y += (mouseX * 0.05 - cube.rotation.y) * 0.1;
    cube.rotation.x += (mouseY * 0.05 - cube.rotation.x) * 0.1;

    controls.update();
    renderer.render(scene, camera);
}
animate();
