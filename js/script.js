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
const cubeTexture = textureLoader.load('textures/CB.png'); // Update the image path

// Create an Array to Store Cubes
const cubes = [];

// Function to Create a Cube
function createCube(x, y, z, index) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Bigger cubes
    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    cube.frustumCulled = false; // Ensure it's always clickable

    scene.add(cube);
    cubes.push(cube);
}

// Generate Multiple Cubes with Random Positions
for (let i = 0; i < 10; i++) {
    let x = (Math.random() - 0.5) * 10; // Random X between -5 and 5
    let y = (Math.random() - 0.5) * 10; // Random Y between -5 and 5
    let z = (Math.random() - 0.5) * 10; // Random Z between -5 and 5
    createCube(x, y, z, i);
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

// ** Raycaster for Click Detection **
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle Click & Touch Events
window.addEventListener("click", onCubeClick);
window.addEventListener("touchstart", onCubeClick, { passive: true });

function onCubeClick(event) {
    let x, y;
    
    if (event.touches) { // Mobile touch
        x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    } else { // Mouse click
        x = (event.clientX / window.innerWidth) * 2 - 1;
        y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    mouse.x = x;
    mouse.y = y;

    raycaster.setFromCamera(mouse, camera);
    renderer.render(scene, camera); // Ensure renderer updates before checking

    const intersects = raycaster.intersectObjects(cubes, true);
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        const index = cubes.indexOf(clickedCube);
        if (index !== -1) {
            alert(`You clicked Cube ${index + 1}!`);
        }
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Each Cube Smoothly
    cubes.forEach(cube => {
        cube.rotation.x += 0.005; // Slow and smooth rotation
        cube.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
