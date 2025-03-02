// Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = false;
controls.enablePan = false;

const bgm = document.getElementById("bgm");
const volumeSlider = document.getElementById("volume-slider");
const musicIcon = document.getElementById("music-icon");

// // Ensure autoplay works by playing muted first
// function startBGM() {
//     bgm.play().then(() => {
//         console.log("BGM is playing automatically.");
//     }).catch(error => {
//         console.warn("Autoplay blocked, waiting for user interaction...");
//     });
// }

// Try autoplay on load (muted)
musicIcon.addEventListener("click", () => {
    bgm.play();
});

// Unmute and control volume when the user interacts
volumeSlider.addEventListener("input", () => {
    if (bgm.muted) {
        bgm.muted = false; // Unmute when user interacts
    }
    bgm.volume = volumeSlider.value;
});

// Smooth fade-in effect after unmuting
volumeSlider.addEventListener("change", () => {
    gsap.to(bgm, { volume: bgm.volume, duration: 2 });
});



// Load Texture
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('textures/CB.png'); // Updated texture file name

// Create an Array to Store Cubes and Their Original Positions
const cubes = [];
const originalPositions = [];
const circleRadius = 6; 
const totalCubes = 10; 
let activeCube = null; 

// Function to Create a Cube
function createCube(index) {
    const angle = (index / totalCubes) * Math.PI * 2; 
    const x = Math.cos(angle) * circleRadius;
    const y = Math.sin(angle) * circleRadius;
    const z = 0;

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    cube.geometry.computeBoundingBox();
    cube.frustumCulled = false;

    scene.add(cube);
    cubes.push(cube);
    originalPositions.push({ x, y, z }); 
}

// Generate Cubes in a Circular Pattern
for (let i = 0; i < totalCubes; i++) {
    createCube(i);
}

// Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Position the Camera
camera.position.set(0, 0, 14);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix(); 

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
window.addEventListener("touchstart", (event) => {
    event.preventDefault(); 
    onCubeClick(event);
}, { passive: false });

function onCubeClick(event) {
    let x, y;
    
    const rect = renderer.domElement.getBoundingClientRect();
    if (event.touches) { 
        x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    } else { 
        x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    mouse.x = x;
    mouse.y = y;

    renderer.render(scene, camera); 
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cubes, true);
    if (intersects.length > 0) {
        const clickedCube = intersects[0].object;
        
        if (clickedCube === activeCube) {
            returnCubeToFormation(clickedCube); // If already in center, return it
        } else {
            zoomCubeIn(clickedCube);
        }
    }
}

// Zoom-in effect when clicking a cube
function zoomCubeIn(cube) {
    if (activeCube === cube) return;

    // Restore Previous Cube to Original Position and Scale
    if (activeCube) {
        returnCubeToFormation(activeCube);
    }

    // Move the New Clicked Cube to the Center and Zoom It In
    gsap.to(cube.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: "power2.out"
    });

    gsap.to(cube.scale, { x: 2, y: 2, z: 2, duration: 1 }); // Zoom in

    activeCube = cube;
}

// Return Cube to Original Circular Formation
function returnCubeToFormation(cube) {
    const index = cubes.indexOf(cube);
    if (index !== -1) {
        gsap.to(cube.position, {
            x: originalPositions[index].x,
            y: originalPositions[index].y,
            z: originalPositions[index].z,
            duration: 1,
            ease: "power2.out"
        });

        gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1 }); // Reset size
    }
    activeCube = null; // No cube is now in center
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Each Cube Individually
    cubes.forEach((cube) => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
