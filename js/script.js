// Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for Navigation
const controls = new THREE.OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = false;

// Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Store Cubes and Their Content
const cubes = [];
const serviceBoxes = document.querySelectorAll('.service-box');

// Load Texture Images from Each Service Box
const textureLoader = new THREE.TextureLoader();

// Function to Create a Cube for Each Service Box
serviceBoxes.forEach((box, index) => {
    const img = box.querySelector('.avatar img'); // Get image inside service-box
    const cubeTexture = img ? textureLoader.load(img.src) : null;

    const geometry = new THREE.BoxGeometry();
    const material = cubeTexture
        ? new THREE.MeshStandardMaterial({ map: cubeTexture })
        : new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });

    const cube = new THREE.Mesh(geometry, material);
    
    cube.userData.text = box.querySelector('.service-desc p')?.innerText || "No content"; // Store Div Content Inside Cube
    scene.add(cube);

    // Position Cubes Randomly
    const spacing = 3;
    cube.position.set(
        (index % 3) * spacing - spacing, // Spread in X direction
        Math.floor(index / 3) * spacing - spacing, // Spread in Y direction
        -5 // Push slightly back
    );

    cubes.push(cube);
});

// Set Camera Position
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Click Event to Display Cube Content
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopup = document.getElementById('close-popup');

document.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        popupText.innerHTML = clickedCube.userData.text;
        popup.classList.remove('hidden');
        popup.style.display = 'block';
    }
});

// Close Popup
closePopup.addEventListener('click', () => {
    popup.style.display = 'none';
});

// Gyroscope Support (for Smartphones)
window.addEventListener("deviceorientation", (event) => {
    let beta = event.beta ? event.beta : 0; // Tilt front/back (-180 to 180)
    let gamma = event.gamma ? event.gamma : 0; // Tilt left/right (-90 to 90)

    // Convert gyroscope values to match Three.js rotation
    cubes.forEach(cube => {
        cube.rotation.x = THREE.MathUtils.degToRad(beta) * 0.5;
        cube.rotation.y = THREE.MathUtils.degToRad(gamma) * 0.5;
    });
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Each Cube Slightly for a Cool Effect
    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

