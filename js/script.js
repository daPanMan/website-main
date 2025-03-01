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
controls.enableRotate = false; // Disable rotate for a fixed view
controls.enablePan = false;

// Load Texture
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('textures/box.jpg'); // Update the image path

// Create an Array to Store Cubes and Their Original Positions
const cubes = [];
const originalPositions = [];
const circleRadius = 6; // Distance of cubes from the center
const totalCubes = 10; // Number of cubes
let activeCube = null; // Stores the currently centered cube

// Function to Create a Cube
function createCube(index) {
    const angle = (index / totalCubes) * Math.PI * 2; // Evenly space cubes in a circle
    const x = Math.cos(angle) * circleRadius;
    const y = Math.sin(angle) * circleRadius;
    const z = 0; // Keep cubes in a flat circular plane

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    cube.frustumCulled = false;

    scene.add(cube);
    cubes.push(cube);
    originalPositions.push({ x, y, z }); // Store original position
}

// Generate Cubes in a Circular Pattern
for (let i = 0; i < totalCubes; i++) {
    createCube(i);
}

// Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Position the Camera
camera.position.set(0, 0, 12); // Move the camera back to see all cubes
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
    renderer.render(scene, camera);

    const intersects = raycaster.intersectObjects(cubes, true);
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        moveCubeToCenter(clickedCube);
    }
}

// Move the Clicked Cube to the Center
function moveCubeToCenter(cube) {
    if (activeCube === cube) return; // If already in the center, do nothing

    // Restore Previous Cube to Original Position
    if (activeCube) {
        const index = cubes.indexOf(activeCube);
        if (index !== -1) {
            gsap.to(activeCube.position, {
                x: originalPositions[index].x,
                y: originalPositions[index].y,
                z: originalPositions[index].z,
                duration: 1,
                ease: "power2.out"
            });
        }
    }

    // Move the New Clicked Cube to the Center
    gsap.to(cube.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: "power2.out"
    });

    activeCube = cube; // Update the active cube
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Cubes Around the Center When Not Focused
    if (!activeCube) {
        cubes.forEach((cube, i) => {
            const angle = (i / totalCubes) * Math.PI * 2 + performance.now() * 0.0005; // Slow circular motion
            cube.position.x = Math.cos(angle) * circleRadius;
            cube.position.y = Math.sin(angle) * circleRadius;
        });
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();
