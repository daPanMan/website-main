// ✅ Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const zoomInSound = new Audio("audio/zoom-in.wav");
const zoomOutSound = new Audio("audio/zoom-out.wav");
// ✅ Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = false;
controls.enablePan = false;

// ✅ Function to Play a Sound
function playSound(sound) {
    sound.currentTime = 0; // Restart sound if already playing
    sound.play();
}

// ✅ Background Music Controls
const bgm = document.getElementById("bgm");
const volumeSlider = document.getElementById("volume-slider");
const musicIcon = document.getElementById("music-icon");
const volumeSliderContainer = document.getElementById("volume-slider-container");
let isInterrupted = false;

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
    isInterrupted = true;
    event.stopPropagation();
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

// ✅ Track if the user is interacting with the volume slider


volumeSlider.addEventListener("input", updateVolume);
volumeSlider.addEventListener("touchmove", (event) => {
    event.preventDefault();
    updateVolume();
}, { passive: false });

volumeSlider.addEventListener("change", () => {
    gsap.to(bgm, { volume: bgm.volume, duration: 2 });
});

volumeSlider.addEventListener("touchend", () => {
    isInterrupted = false;
});

volumeSlider.addEventListener("mouseup", () => {
    isInterrupted = false;
});



// ✅ Load Textures for Cubes
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('textures/CB.png');

// ✅ Create Cubes & Store Positions
const cubes = [];
const originalPositions = [];
const circleRadius = 6;
const totalCubes = 10;
let activeCube = null;

// ✅ Add Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1));

// ✅ Create a CSS3D Renderer for HTML Content in 3D
const cssRenderer = new THREE.CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = "absolute";
cssRenderer.domElement.style.top = 0;
document.body.appendChild(cssRenderer.domElement);

// ✅ Create the `iframe` Element
const iframeElement = document.createElement("iframe");
iframeElement.src = "about.html"; // Replace with your actual page
iframeElement.style.width = "1024px";
iframeElement.style.height = "768px";
iframeElement.style.border = "none";


// ✅ Wrap the `iframe` in a CSS3DObject but HIDE IT INITIALLY
const cssObject = new THREE.CSS3DObject(iframeElement);
cssObject.scale.set(0.01, 0.01, 0.01); // Start tiny, simulating transformation
cssObject.position.set(0, 0, 3); // Position in front of the cube
cssObject.visible = false; // Hide initially
scene.add(cssObject);





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

// scene.add(light);

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
    isInterrupted = true;
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
            playSound(zoomOutSound);
            returnCubeToFormation(clickedCube);
        } else {
            playSound(zoomInSound);
            zoomCubeIn(clickedCube);
        }
    }
    isInterrupted = false;
}

// ✅ Zoom-in Effect When Clicking a Cube
function zoomCubeIn(cube) {
    if (activeCube === cube) return;

    if (activeCube) {
        returnCubeToFormation(activeCube);
    }

    // ✅ Zoom the Cube in and Show the `iframe`
    gsap.to(cube.position, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.out" });
    gsap.to(cube.scale, { x: 2, y: 2, z: 2, duration: 1 });

    setTimeout(() => {
        cssObject.visible = true;
    }, 1000); // ✅ Wait for the cube animation to finish

    activeCube = cube;
}


function returnCubeToFormation(cube) {
    const index = cubes.indexOf(cube);
    if (index !== -1) {
        gsap.to(cube.position, { x: originalPositions[index].x, y: originalPositions[index].y, z: originalPositions[index].z, duration: 1, ease: "power2.out" });
        gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1 });

        gsap.to(cssObject.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, onComplete: () => {
            cssObject.visible = false;
        }});
    }
    activeCube = null;
}

// returns the cube back to formation if I click anywhere else
window.addEventListener("click", (event) => {
    if (!cssObject.visible && !activeCube) return; // ✅ Do nothing if iframe is already hidden


    // ✅ Convert click position to normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // ✅ Check if the click intersects any cubes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes, true);

    if (intersects.length === 0) {
        // ✅ Clicked outside cubes → Close the iframe
        playSound(zoomOutSound);
        returnCubeToFormation(activeCube);
    }
}, { passive: false });


window.addEventListener("touchstart", (event) => {
    
    if (!cssObject.visible && !activeCube) return; // ✅ Do nothing if iframe is already hidden
    event.preventDefault();

    // ✅ Convert click position to normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // ✅ Check if the click intersects any cubes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes, true);

    if (intersects.length === 0) {
        // ✅ Clicked outside cubes → Close the iframe
        playSound(zoomOutSound);
        returnCubeToFormation(activeCube);
    }
}, { passive: false });

// ✅ Add 3D Universe Background
const spaceTexture = textureLoader.load("textures/stars.jpg");
const starGeometry = new THREE.SphereGeometry(50, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({ map: spaceTexture, side: THREE.BackSide });

const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

// ✅ Function to Create Moving Stars
const stars = [];
function createStars() {
    const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 300; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        stars.push(star);
        scene.add(star);
    }
}
createStars();

// ✅ Track Mouse & Touch for Moving Background
let isDragging = false;
let lastX = 0, lastY = 0;
let targetRotationX = 0, targetRotationY = 0;

// ✅ Detect Mouse Down (Start Dragging)
window.addEventListener("mousedown", (event) => {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
});

// ✅ Detect Mouse Up (Stop Dragging)
window.addEventListener("mouseup", () => {
    isDragging = false;
});

// ✅ Detect Mouse Move (Update Rotation)
window.addEventListener("mousemove", (event) => {
    if (isDragging && !isInterrupted) {
        let deltaX = (event.clientX - lastX) * 0.002;
        let deltaY = (event.clientY - lastY) * 0.002;

        targetRotationX += deltaX;
        targetRotationY += deltaY;

        lastX = event.clientX;
        lastY = event.clientY;

        starField.rotation.y += (targetRotationX - starField.rotation.y) * 0.05;
        starField.rotation.x += (targetRotationY - starField.rotation.x) * 0.05;

    }
});

// ✅ Detect Touch Start (For Mobile)
window.addEventListener("touchstart", (event) => {
    isDragging = true;
    lastX = event.touches[0].clientX;
    lastY = event.touches[0].clientY;
}, { passive: false });

// ✅ Detect Touch End (For Mobile)
window.addEventListener("touchend", () => {
    isDragging = false;
});

// ✅ Detect Touch Move (For Mobile)
window.addEventListener("touchmove", (event) => {
    if (isDragging && !isInterrupted) {
        let deltaX = (event.touches[0].clientX - lastX) * 0.002;
        let deltaY = (event.touches[0].clientY - lastY) * 0.002;

        targetRotationX += deltaX;
        targetRotationY += deltaY;

        lastX = event.touches[0].clientX;
        lastY = event.touches[0].clientY;

        starField.rotation.y += (targetRotationX - starField.rotation.y) * 0.05;
        starField.rotation.x += (targetRotationY - starField.rotation.x) * 0.05;

    }
}, { passive: false });

// ✅ Animation Loop
function animate() {
    requestAnimationFrame(animate);

    starField.rotation.y += 0.0005;
    stars.forEach(star => {
        star.position.z += 0.05;
        if (star.position.z > 50) {
            star.position.z = -50;
        }
    });

    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
    
    cssRenderer.render(scene, camera);
}
animate();