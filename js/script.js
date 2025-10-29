import { gamepad } from './geometry/gamepad.js'; 
import { linkedInGeometry } from './geometry/linkedin.js'; 
import { mainPageGeometry } from './geometry/mainpage.js';
import { createCube, 
    animateCubeMovement, 
    onCubeClick, 
    zoomCubeIn, 
    returnCubeToFormation 
} from './qbe.js';
// ✅ Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

const bigTitle = addBigTitle("This is\nJohn Pan");
const isMobile = window.innerWidth < 568; 
// ✅ Function to Adjust the Camera Based on Screen Size
function adjustCamera() {
    if (window.innerWidth < 768) {
        camera.position.set(0, 0, 25); // Move camera back for mobile
    } else {
        camera.position.set(0, 0, 14); // Default for desktop
    }
    camera.lookAt(0, 0, 0); // Ensure the camera is centered
}

adjustCamera(); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const zoomInSound = new Audio("audio/zoom-in.wav");
const zoomOutSound = new Audio("audio/zoom-out.wav");
const spotify = "./html/spotify.html";
const pigGame = "./html/Pig-Game-with-Dice/index.html";
const linkedIn = "./html/linkedIn.html";
const unityGame = './html/unity/index.html';
const email = './html/email.html';
const pong = './html/pong.html';

const extrudeSettings = {
    depth: 0.3, // Thickness of the app icon
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05
};

// ✅ Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  zoomSpeed: 1.2,
  enableRotate: false,
  enablePan: false
});


// ✅ Background Music Controls
const bgm = document.getElementById("bgm");
const volumeSlider = document.getElementById("volume-slider");
const musicIcon = document.getElementById("music-icon");
const volumeSliderContainer = document.getElementById("volume-slider-container");
const muteButton = document.getElementById("mute-button");
muteButton.innerHTML = bgm.muted ? "🔇" : "🔊";
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

function init(){
    const introPage = document.getElementById("intro-page");
    const threeCanvas = document.getElementById("three-canvas");

    // ✅ Fade out intro page
    gsap.to(introPage, { opacity: 0, duration: 1, ease: "power2.out", onComplete: () => {
        introPage.style.display = "none"; // Remove intro page
    }});

    // ✅ Show the 3D world smoothly
    setTimeout(() => {
        
        bgm.volume = 0.45;
        threeCanvas.style.display = "block"; // Show Three.js canvas
        cssRenderer.domElement.style.display = "block"; // Show CSS3DRenderer
        gsap.to(threeCanvas, { opacity: 1, duration: 10, ease: "power2.out" });

    }, 500);
}

// ✅ Function to Enter the Main 3D Page
document.getElementById("enter-button").addEventListener("click", () => {
    bgm.play();
    init();
});
document.getElementById("enter-button").addEventListener("touchstart", (event) => {
    event.stopPropagation();
    event.preventDefault(); // ✅ Prevents unintended scrolling
    bgm.play();
    init();
}, { passive: false });



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
    muteButton.style.display = (muteButton.style.display === "none") ? "block" : "none";
    
    // Toggle slider visibility
    volumeSliderContainer.style.display = (volumeSliderContainer.style.display === "none") ? "block" : "none";
}


// ✅ Toggle Mute Function
function toggleMute() {
    bgm.muted = !bgm.muted;
    muteButton.innerHTML = bgm.muted ? "🔇" : "🔊";
    volumeSliderContainer.style.display = !bgm.muted ? "block" : "none";
}


// ✅ Event Listener for Mute Button
muteButton.addEventListener("click", toggleMute);

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
    const titleElement = Object.assign(document.createElement("div"), {
        className: "big-title",
        innerText: text
    });

    Object.assign(titleElement.style, {
        position: "absolute",
        color: "white",
        fontSize: "132px",
        fontWeight: "bold",
        textShadow: "0px 0px 10px rgba(255,255,255,0.8)",
        pointerEvents: "none",
        whiteSpace: "nowrap"
    });


    // ✅ Create a CSS3DObject for the title
    const bigTitleObject = new THREE.CSS3DObject(titleElement);
    bigTitleObject.scale.set(0.01, 0.01, 0.01); // Prevent infinite scaling

    // ✅ Position it below the cube formation
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
document.getElementById("reset-scale-button").addEventListener("touchstart", resetScale);



/* SHAPE FEATURES */
// ✅ Load Textures for Cubes
const textureLoader = new THREE.TextureLoader();
const diskTexture = textureLoader.load('textures/disk.png');
const unityTexture = textureLoader.load('textures/unity.jpg');
const tennisTexture = textureLoader.load('textures/tennis.jpg');


const diceTextures = [...Array(6)].map((_, i) => 
    textureLoader.load(`./html/Pig-Game-with-Dice/dice-${i + 1}.png`)
);

// ✅ Define Different Shape Sets
const shapeSets = {
    mainMenu: [
        { type: "cube", label: "Pong", texture: tennisTexture, id: "pong" },
        { type: "cube", label: "Unity Game", texture: unityTexture, id: "unity" },
        { type: "cylinder", label: "Spotify", texture: diskTexture, id: "spotify" },
        { type: "cube", label: "Pig Game", texture: diceTextures, id: "pigGame" },
        { type: "text", label: "LinkedIn", geometry: "linkedIn", id: "linkedin" },
        { type: "text", label: "Email", geometry: "email", id: "email" }
    ],
    projects: [
        { type: "cube", label: "Game Dev", id: "game" },
        { type: "sphere", label: "Web Dev", id: "web" },
        { type: "cylinder", label: "AI Models", id: "ai" }
    ],
};

const cubeSpecs = [
    { type: mainPageGeometry(), label: "My LinkedIn", url: linkedIn }
]


// ✅ Create Cubes & Store Positions
const cubes = [];
const originalPositions = [];
let activeCube = null;

// ✅ Add Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1));

// ✅ Store all title objects in an array for updates
const titleObjects = [];




// ✅ Create the `iframe` Element
const iframeElement = document.createElement("iframe");
iframeElement.src = "about.html"; // Replace with your actual page
iframeElement.style.width = "1024px";
iframeElement.style.height = window.innerWidth < 568 ? "1700px" : "768px" ;
iframeElement.style.border = "none";
iframeElement.style.transform = "translate(-50%, -50%) scale(1)";
iframeElement.style.backfaceVisibility = "hidden";
iframeElement.style.willChange = "transform";

let defaultHTML = "about.html";

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

// ✅ Adjust iframe scale for different screen sizes
function adjustIframeScale() {
    if (window.innerWidth < 768) {
        cssObject.scale.set(0.004, 0.004, 0.004);
    } else {
        cssObject.scale.set(0.01, 0.01, 0.01);
    }
}

window.addEventListener("resize", adjustIframeScale);
adjustIframeScale(); // Run on page load

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

// ✅ Function to Create a Random Shape (Circle on Desktop, Vertical on Mobile)




const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, // Border color (black)
    wireframe: true // Show only edges
});

let totalCubes = cubeSpecs.length;

let cubesPerAxis = Math.ceil(Math.pow(totalCubes, 1/3));
let cubeSize = 6; // Distance between cubes
let offset = (cubesPerAxis - 1) / 2; // Centering offset

// ✅ Generate Cubes in a Looser Circular Pattern
for (let i = 0; i < cubeSpecs.length; i++) {
    const cube = createCube(i, cubeSpecs[i]);
    cubes.push(cube);

    // Calculate 3D grid indices
    let xIndex = i % cubesPerAxis;
    let yIndex = Math.floor(i / cubesPerAxis) % cubesPerAxis;
    let zIndex = Math.floor(i / (cubesPerAxis * cubesPerAxis));

    // Centered grid position
    let baseX = (xIndex - offset) * cubeSize;
    let baseY = (yIndex - offset) * cubeSize;
    let baseZ = (zIndex - offset) * cubeSize;

    // Optional: Slight random offset for natural look
    const randomOffsetX = (Math.random() - 0.5) * 1;
    const randomOffsetY = (Math.random() - 0.5) * 1;
    const randomOffsetZ = (Math.random() - 0.5) * 1;

    cube.position.set(baseX + randomOffsetX, baseY + randomOffsetY, baseZ + randomOffsetZ);
    cube.frustumCulled = false;
    cube.rotation.set(0, 0, 0);

    scene.add(cube);

    originalPositions.push({ x: baseX, y: baseY, z: baseZ });

    // Optionally add title and animate
    addFloatingTitle(cube, cube.userData.title);
    animateCubeMovement(cube);
}
adjustCamera();

// scene.add(light);

// ✅ Position the Camera
camera.position.set(0, 0, 16);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();

// ✅ Handle Window Resize
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
    onCubeClick(event, isInterrupted);
}, { passive: false });

function getMouseCoordinates(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (event.touches) { 
        return {
            x: ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1
        };
    } else { 
        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
    }
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
        volumeSliderContainer.style.display = 'none';
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
    camera.position.z += zoomAmount; // Move the camera closer/further
    console.log(camera.position.z);
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




/** FINAL ADD-ONS */
// ✅ Ambient Light (Soft Global Light)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); 
scene.add(ambientLight);

// ✅ Directional Light (Creates Shadows & Depth)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// ✅ Point Light (Responsive Light in Scene)
const pointLight = new THREE.PointLight(0xfff0e5, 1, 50); // Warm light color
pointLight.position.set(0, 5, 5);
scene.add(pointLight);

// ✅ Animation Loop

function updateStars() {
    for (let i = 0; i < stars.length * 0.3; i++) { // Update only 30% of stars
        let star = stars[Math.floor(Math.random() * stars.length)];
        star.position.z += 0.05;
        if (star.position.z > 50) {
            star.position.z = -50;
        }
    }
}


function animate() {
    requestAnimationFrame(animate);

    // ✅ Ensure the big title always faces the camera
    if (bigTitle) {
        bigTitle.lookAt(camera.position);
        bigTitle.position.set(0, 0, -5); // Adjust height
    }

    // ✅ Ensure titles move with their cubes and face the camera
    titleObjects.forEach(title => {
        const cube = title.userData.cube; // Get the associated cube
        if (cube) {
            // Synchronize title position with the cube
            title.position.copy(cube.position);
            title.position.y += 2; // Keep it floating above the cube
            title.lookAt(camera.position); // Ensure it faces the camera
        }
    });

    starField.rotation.y += 0.0005;
    updateStars(); // Call the optimized star movement function


    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    });

    // Move the point light in a circular motion for dynamic shading
    const time = Date.now() * 0.001;
    pointLight.position.x = Math.sin(time) * 10;
    pointLight.position.z = Math.cos(time) * 10;

    controls.update();
    renderer.render(scene, camera);
    
    cssRenderer.render(scene, camera);
}
animate();