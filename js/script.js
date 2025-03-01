// Setup Scene, Camera, and Renderer
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
const cubeTexture = textureLoader.load('textures/box.jpg'); // Update the image path

// Create an Array to Store Cubes
const cubes = [];

// Function to Create a Cube
function createCube(x, y, z) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometry, material);

    // Set Cube Position
    cube.position.set(x, y, z);

    // Add Cube to Scene
    scene.add(cube);

    // Store Cube in Array
    cubes.push(cube);
}

// Generate Multiple Cubes with Random Positions
for (let i = 0; i < 10; i++) {
    let x = (Math.random() - 0.5) * 10; // Random X between -5 and 5
    let y = (Math.random() - 0.5) * 10; // Random Y between -5 and 5
    let z = (Math.random() - 0.5) * 10; // Random Z between -5 and 5
    createCube(x, y, z);
}

// Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Position the Camera
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Each Cube
    cubes.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
