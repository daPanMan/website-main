// ✅ Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

const bigTitle = addBigTitle("This is\nJohn Pan");


renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const zoomInSound = new Audio("audio/zoom-in.wav");
const zoomOutSound = new Audio("audio/zoom-out.wav");
// ✅ Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.zoomSpeed = 1.2; // Adjust zoom speed if needed
controls.enableRotate = false;
controls.enablePan = false;

// ✅ Background Music Controls
const bgm = document.getElementById("bgm");
const volumeSlider = document.getElementById("volume-slider");
const musicIcon = document.getElementById("music-icon");
const volumeSliderContainer = document.getElementById("volume-slider-container");
let isInterrupted = false;

// ✅ Create a CSS3D Renderer for HTML Content in 3D
const cssRenderer = new THREE.CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = "absolute";
cssRenderer.domElement.style.top = 0;
document.body.appendChild(cssRenderer.domElement);

// ✅ Initially hide the 3D canvas & CSS3DRenderer
document.getElementById("three-canvas").style.display = "none";
bgm.pause();
cssRenderer.domElement.style.display = "none";

// ✅ Function to Enter the Main 3D Page
document.getElementById("enter-button").addEventListener("click", () => {
    const introPage = document.getElementById("intro-page");
    const threeCanvas = document.getElementById("three-canvas");

    // ✅ Fade out intro page
    gsap.to(introPage, { opacity: 0, duration: 1, ease: "power2.out", onComplete: () => {
        introPage.style.display = "none"; // Remove intro page
    }});

    // ✅ Show the 3D world smoothly
    setTimeout(() => {
        bgm.play();
        bgm.volume = 0.45;
        threeCanvas.style.display = "block"; // Show Three.js canvas
        cssRenderer.domElement.style.display = "block"; // Show CSS3DRenderer
        gsap.to(threeCanvas, { opacity: 1, duration: 5, ease: "power2.out" }); // Smooth fade-in
    }, 500);
});


// ✅ Function to Play a Sound
function playSound(sound) {
    sound.currentTime = 0; // Restart sound if already playing
    sound.play();
}



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
    zoomInSound.volume = volumeSlider.value;
    zoomOutSound.volume = volumeSlider.value;
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


// ✅ Function to Create a Big Floating Title Above the Entire Cube Formation
function addBigTitle(text) {
    // ✅ Create a new HTML element for the big title
    const titleElement = document.createElement("div");
    titleElement.className = "big-title";
    titleElement.innerText = text;

    // ✅ Apply CSS styles
    titleElement.style.position = "absolute";
    titleElement.style.color = "white";
    titleElement.style.fontSize = "132px";
    titleElement.style.fontWeight = "bold";
    titleElement.style.textShadow = "0px 0px 10px rgba(255,255,255,0.8)";
    titleElement.style.pointerEvents = "none";
    titleElement.style.whiteSpace = "nowrap";

    // ✅ Create a CSS3DObject for the title
    const bigTitleObject = new THREE.CSS3DObject(titleElement);
    bigTitleObject.scale.set(0.01, 0.01, 0.01); // Prevent infinite scaling

    // ✅ Position it above the cube formation
    bigTitleObject.position.set(0, 0, 0); // Adjust height

    // ✅ Add it to the scene
    scene.add(bigTitleObject);

    return bigTitleObject;
}

// ✅ Function to Reset the Iframe and Cube Scale
function resetScale() {
    // ✅ Reset the iframe size
    gsap.to(iframeElement, { 
        opacity: 0, 
        duration: 0.5, 
        ease: "power2.in", 
        onComplete: () => {
            cssObject.visible = false; // Hide the iframe
        } 
    });

    // ✅ Reset any zoomed-in cube
    if (activeCube) {
        returnCubeToFormation(activeCube);
    }

    // ✅ Hide the reset button
    document.getElementById("reset-scale-button").style.display = "none";
}

// ✅ Show the Reset Button When Iframe is Visible
function showCloseButton() {
    document.getElementById("reset-scale-button").style.display = "block";
}

function noShowCloseButton() {
    document.getElementById("reset-scale-button").style.display = "none";
}

// ✅ Attach Click Event to Reset Button
document.getElementById("reset-scale-button").addEventListener("click", resetScale);



/* SHAPE FEATURES */
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




// ✅ Store all title objects in an array for updates
const titleObjects = [];


// ✅ Create the `iframe` Element
const iframeElement = document.createElement("iframe");
iframeElement.src = "about.html"; // Replace with your actual page
iframeElement.style.width = "1024px";
iframeElement.style.height = "768px";
iframeElement.style.border = "none";
iframeElement.style.transform = "translate(-50%, -50%) scale(1)";
iframeElement.style.backfaceVisibility = "hidden";
iframeElement.style.willChange = "transform";

// ✅ Allow scrolling inside the iframe on mobile
iframeElement.addEventListener("touchstart", (event) => {
    event.stopPropagation(); // Allow scrolling inside iframe
}, { passive: true });

iframeElement.addEventListener("touchmove", (event) => {
    event.stopPropagation(); // Allow scrolling inside iframe
}, { passive: true });


// ✅ Wrap the `iframe` in a CSS3DObject but HIDE IT INITIALLY
const cssObject = new THREE.CSS3DObject(iframeElement);
cssObject.scale.set(0.01, 0.01, 0.01); // Start tiny, simulating transformation
cssObject.position.set(0, 0, 3); // Position in front of the cube
cssObject.visible = false; // Hide initially
scene.add(cssObject);


// ✅ Function to Add Floating Title Above Cube
function addFloatingTitle(cube, text) {
    // ✅ Create a new HTML element for the title
    const titleElement = document.createElement("div");
    titleElement.className = "cube-title";
    titleElement.innerText = text;

    // ✅ Apply CSS styles to prevent scaling issues
    titleElement.style.position = "absolute";
    titleElement.style.color = "white";
    titleElement.style.fontSize = "60px";
    titleElement.style.fontWeight = "bold";
    titleElement.style.textShadow = "0px 0px 5px rgba(255,255,255,0.8)";
    titleElement.style.pointerEvents = "none"; // Prevent clicking
    titleElement.style.whiteSpace = "nowrap";

    // ✅ Create a CSS3DObject (for rendering HTML in Three.js)
    const titleObject = new THREE.CSS3DObject(titleElement);
    titleObject.scale.set(0.005, 0.005, 0.005); // Prevent infinite scaling

    // ✅ Position the title above the cube
    titleObject.position.copy(cube.position);
    titleObject.position.y += 2; // Adjust height

    // ✅ Store a reference to the cube for tracking
    titleObject.userData.cube = cube;

    // ✅ Add titleObject to the scene (NOT the cube)
    scene.add(titleObject);

    // ✅ Store the title object for updating later
    titleObjects.push(titleObject);
}




// ✅ Function to Create a Random Shape (Cube, Sphere, Pyramid, etc.)
function createCube(index) {
    const angle = (index / totalCubes) * Math.PI * 2;
    const spreadFactor = 1.5; // Adjust this to make cubes more spread out
    const baseRadius = circleRadius * spreadFactor;

    // ✅ Position shapes in a circular pattern
    const baseX = Math.cos(angle) * baseRadius;
    const baseY = Math.sin(angle) * baseRadius;
    const baseZ = (Math.random() - 0.5) * 2;

    // ✅ Choose a random shape for each "cube"
    const shapes = [
        new THREE.BoxGeometry(1.5, 1.5, 1.5), // Cube
        new THREE.SphereGeometry(0.9, 32, 32), // Sphere
        new THREE.ConeGeometry(1, 2, 32), // Pyramid
        new THREE.TorusGeometry(1, 0.4, 16, 100), // Torus (donut)
        new THREE.CylinderGeometry(1, 1, 2, 32) // Cylinder
    ];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(randomShape, material); // ✅ "cube" variable is still used

    // ✅ Add slight random offset for a more natural formation
    const randomOffsetX = (Math.random() - 0.5) * 3;
    const randomOffsetY = (Math.random() - 0.5) * 3;
    const randomOffsetZ = (Math.random() - 0.5) * 1;

    cube.position.set(baseX + randomOffsetX, baseY + randomOffsetY, baseZ + randomOffsetZ);
    cube.geometry.computeBoundingBox();
    cube.frustumCulled = false;

    // ✅ Random rotation for variety
    cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    scene.add(cube);
    cubes.push(cube);
    originalPositions.push({ x: baseX, y: baseY, z: baseZ });

    // ✅ Add Floating Title Above Each Shape
    addFloatingTitle(cube, `Shape ${index + 1}`);

    animateCubeMovement(cube); // ✅ Keep wandering motion
}




// ✅ Function to Make Cubes Wander Randomly
function animateCubeMovement(cube) {
    const randomTime = 2 + Math.random() * 3; // Vary speed between 2-5 seconds

    gsap.to(cube.position, {
        x: cube.position.x + (Math.random() - 0.5) * 1.5, // Small random movement
        y: cube.position.y + (Math.random() - 0.5) * 1.5,
        z: cube.position.z + (Math.random() - 0.5) * 0.5,
        duration: randomTime,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1 // Loop forever
    });

    gsap.to(cube.rotation, {
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        duration: randomTime * 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
    });
}

// ✅ Generate Cubes in a Looser Circular Pattern
for (let i = 0; i < totalCubes; i++) {
    createCube(i);
}


// scene.add(light);

// ✅ Position the Camera
camera.position.set(0, 0, 16);
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

function zoomCubeIn(cube) {
    if (activeCube === cube) return;

    if (activeCube) {
        returnCubeToFormation(activeCube);
    }

    // ✅ Stop the wandering animation for this cube
    gsap.killTweensOf(cube.position); // Stops its movement
    gsap.killTweensOf(cube.rotation); // Stops any rotation changes

    // ✅ Move the Cube to Center and Scale Up
    gsap.to(cube.position, { x: 0, y: 0, z: 0, duration: 1, ease: "back.out(1.7)" });
    gsap.to(cube.scale, { x: 2.2, y: 2.2, z: 2.2, duration: 1, ease: "back.out(1.7)" });

    // ✅ Fade in the iframe smoothly
    setTimeout(() => {
        cssObject.visible = true; // ✅ Make iframe visible
        gsap.to(iframeElement, { opacity: 1, duration: 0.5, ease: "power2.out" });

        // ✅ Show Reset Button when the iframe is visible
        showCloseButton();
    }, 500);

    activeCube = cube;
}





function returnCubeToFormation(cube) {
    const index = cubes.indexOf(cube);
    if (index !== -1) {
        // ✅ Move cube back to its original position
        gsap.to(cube.position, { 
            x: originalPositions[index].x, 
            y: originalPositions[index].y, 
            z: originalPositions[index].z, 
            duration: 1, 
            ease: "back.out(1.7)" 
        });

        noShowCloseButton();

        gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)" });

        // ✅ Fade out iframe before hiding it
        gsap.to(iframeElement, { opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => {
            cssObject.visible = false; // ✅ Hide iframe after fade-out
        }});

        // ✅ Restart the wandering animation when cube returns
        setTimeout(() => animateCubeMovement(cube), 1000); // Delay to prevent instant movement
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
    if (event.touches.length === 0) return; // ✅ Prevents errors if no touches exist

    // ✅ Convert touch position to normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;

    // ✅ Check if the touch intersects any cubes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes, true);

    if (intersects.length === 0) {
        // ✅ Tapped outside cubes → Close the iframe
        playSound(zoomOutSound);
        returnCubeToFormation(activeCube);
    }
}, { passive: false });



window.addEventListener("wheel", (event) => {
    event.preventDefault(); // ✅ Prevents default browser zooming

    let zoomAmount = event.deltaY * 0.01; // Adjust sensitivity
    camera.position.z += zoomAmount * 5; // Move the camera closer/further
}, { passive: false });




/* BACKGROUND FEATURES */
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

// the pinch to zoom is kinda jittery, but ig it works :(
let touchDistance = 0;
let lastPinchZoom = 0; // Stores last zoom position

let isPinching = false; // Tracks pinch gesture

// ✅ Detect Touch Start
window.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) {
        // ✅ Single finger → Start dragging background
        isDragging = true;
        isPinching = false; // Ensure not pinching
        lastX = event.touches[0].clientX;
        lastY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // ✅ Two fingers → Start pinch zoom
        event.preventDefault(); // Prevent browser zoom
        isPinching = true;
        touchDistance = getTouchDistance(event.touches);
        lastPinchZoom = camera.position.z;
    }
}, { passive: false });

// ✅ Detect Touch Move
window.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2 && isPinching) {
        // ✅ Pinch Zoom (Two Fingers)
        event.preventDefault();
        let newDistance = getTouchDistance(event.touches);
        let zoomFactor = (newDistance - touchDistance) * 0.02; // Adjust sensitivity

        // ✅ Adjust camera zoom but keep within limits
        camera.position.z = Math.max(5, Math.min(50, lastPinchZoom - zoomFactor * 20));

        touchDistance = newDistance;
    } else if (event.touches.length === 1 && isDragging) {
        // ✅ Move Background (One Finger)
        if (!isInterrupted) {
            let deltaX = (event.touches[0].clientX - lastX) * 0.002;
            let deltaY = (event.touches[0].clientY - lastY) * 0.002;

            targetRotationX += deltaX;
            targetRotationY += deltaY;

            lastX = event.touches[0].clientX;
            lastY = event.touches[0].clientY;

            // ✅ Rotate background smoothly
            starField.rotation.y += (targetRotationX - starField.rotation.y) * 0.05;
            starField.rotation.x += (targetRotationY - starField.rotation.x) * 0.05;
        }
    }
}, { passive: false });

// ✅ Detect Touch End
window.addEventListener("touchend", (event) => {
    if (event.touches.length === 0) {
        isDragging = false;
        isPinching = false;
    }
}, { passive: true });

// ✅ Helper function to calculate pinch distance
function getTouchDistance(touches) {
    let dx = touches[0].clientX - touches[1].clientX;
    let dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// ✅ Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // ✅ Ensure the big title always faces the camera
    if (bigTitle) {
        bigTitle.lookAt(camera.position);
    }

    // ✅ Ensure titles always face the camera
    titleObjects.forEach(title => {
        title.position.copy(title.userData.cube.position); // Keep above the cube
        title.position.y += 2; // Keep it floating
        title.lookAt(camera.position); // Ensure it faces the camera
    });

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