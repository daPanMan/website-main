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
const cubeDivs = []; // Array to store cube div elements

// Function to Create a Cube
function createCube(x, y, z, index) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometry, material);

    // Set Cube Position
    cube.position.set(x, y, z);

    // Add Cube to Scene
    scene.add(cube);
    cubes.push(cube);

    // Create a Corresponding HTML Div for the Cube
    const cubeDiv = document.createElement("div");
    cubeDiv.classList.add("cube-info");
    cubeDiv.innerHTML = `Cube ${index + 1}`;
    cubeDiv.style.position = "absolute";
    cubeDiv.style.color = "#fff";
    cubeDiv.style.background = "rgba(0, 0, 0, 0.7)";
    cubeDiv.style.padding = "5px 10px";
    cubeDiv.style.borderRadius = "5px";
    cubeDiv.style.display = "none"; // Hide initially
    document.body.appendChild(cubeDiv);
    cubeDivs.push(cubeDiv);
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

// ** Raycaster to Detect Clicks on Cubes **
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
    // Convert Mouse Click Position to Normalized Device Coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the Raycaster
    raycaster.setFromCamera(mouse, camera);

    // Detect Intersection with Cubes
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        const clickedCube = intersects[0].object; // Get the first intersected cube
        const index = cubes.indexOf(clickedCube); // Find the index of the clicked cube
        if (index !== -1) {
            alert(`You clicked Cube ${index + 1}!`);
            
            // Show Cube Info Div
            cubeDivs[index].style.display = "block";
            cubeDivs[index].style.left = event.clientX + "px";
            cubeDivs[index].style.top = event.clientY + "px";

            // Hide after 2 seconds
            setTimeout(() => {
                cubeDivs[index].style.display = "none";
            }, 2000);
        }
    }
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
