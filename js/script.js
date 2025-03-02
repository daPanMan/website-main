// ✅ Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ✅ Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = false;
controls.enablePan = false;

// ✅ Background Music Controls
const bgm = document.getElementById("bgm");
const volumeSlider = document.getElementById("volume-slider");
const musicIcon = document.getElementById("music-icon");
const volumeSliderContainer = document.getElementById("volume-slider-container");

// ✅ Function to Toggle Volume Slider and Play BGM
function toggleVolumeSlider() {
    if (bgm.paused) {
        bgm.volume = 0.45;
        bgm.play();
    }
    
    // Toggle slider visibility
    volumeSliderContainer.style.display = (volumeSliderContainer.style.display === "none") ? "block" : "none";
}

// ✅ Update Volume
function updateVolume() {
    if (bgm.muted) {
        bgm.muted = false;
    }
    bgm.volume = volumeSlider.value;
}

// ✅ Add Click & Touch Support for Volume Control
musicIcon.addEventListener("click", toggleVolumeSlider);
musicIcon.addEventListener("touchstart", (event) => {
    event.preventDefault();
    toggleVolumeSlider();
}, { passive: true });

volumeSlider.addEventListener("input", updateVolume);
volumeSlider.addEventListener("touchmove", (event) => {
    event.preventDefault();
    updateVolume();
}, { passive: false });

volumeSlider.addEventListener("change", () => {
    gsap.to(bgm, { volume: bgm.volume, duration: 2 });
});

// ✅ Load Textures (For Cubes)
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('textures/CB.png');

// ✅ Create an Array to Store Cubes and Their Original Positions
const cubes = [];
const originalPositions = [];
const circleRadius = 6;
const totalCubes = 10;
let activeCube = null;

// ✅ Function to Create a Cube
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

// ✅ Generate Cubes in a Circular Pattern
for (let i = 0; i < totalCubes; i++) {
    createCube(i);
}

// ✅ Add Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// ✅ Position the Camera
camera.position.set(0, 0, 14);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();

// ✅ Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// ✅ Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ✅ Handle Click & Touch Events for Cubes
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
            returnCubeToFormation(clickedCube);
        } else {
            zoomCubeIn(clickedCube);
        }
    }
}

// ✅ Zoom-in Effect When Clicking a Cube
function zoomCubeIn(cube) {
    if (activeCube === cube) return;

    if (activeCube) {
        returnCubeToFormation(activeCube);
    }

    gsap.to(cube.position, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.out" });
    gsap.to(cube.scale, { x: 2, y: 2, z: 2, duration: 1 });

    activeCube = cube;
}

// ✅ Return Cube to Original Circular Formation
function returnCubeToFormation(cube) {
    const index = cubes.indexOf(cube);
    if (index !== -1) {
        gsap.to(cube.position, { x: originalPositions[index].x, y: originalPositions[index].y, z: originalPositions[index].z, duration: 1, ease: "power2.out" });
        gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1 });
    }
    activeCube = null;
}

// ✅ Add 3D Universe Background (Movable)
const spaceTexture = textureLoader.load("textures/stars.jpg");
const starGeometry = new THREE.SphereGeometry(50, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });

const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

// ✅ Track Mouse & Touch for Moving Background
let targetRotationX = 0, targetRotationY = 0;

function updateRotation(x, y) {
    targetRotationX = x * 0.1;
    targetRotationY = y * 0.1;
}

window.addEventListener("mousemove", (event) => {
    updateRotation(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
});

window.addEventListener("touchmove", (event) => {
    event.preventDefault();
    updateRotation(event.touches[0].clientX / window.innerWidth - 0.5, event.touches[0].clientY / window.innerHeight - 0.5);
}, { passive: false });

// ✅ Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Smooth movement
    starField.rotation.y += (targetRotationX - starField.rotation.y) * 0.05;
    starField.rotation.x += (targetRotationY - starField.rotation.x) * 0.05;

    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();
