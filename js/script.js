// ✅ Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cssRenderer = new THREE.CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = "absolute";
cssRenderer.domElement.style.top = 0;
document.body.appendChild(cssRenderer.domElement);

const bigTitle = addBigTitle("This is\nJohn Pan");

// ✅ Global Variables & Settings
let isInterrupted = false;
let activeCube = null;
const cubes = [];
const originalPositions = [];
const totalCubes = 6;
const circleRadius = 6;

// ✅ Load Textures Once
const textureLoader = new THREE.TextureLoader();
const diskTexture = textureLoader.load("textures/disk.png");
const unityTexture = textureLoader.load("textures/unity.jpg");
const appIconTexture = textureLoader.load("textures/linkedin.png");

const diceTextures = [...Array(6)].map((_, i) =>
    textureLoader.load(`./html/Pig-Game-with-Dice/dice-${i + 1}.png`)
);

// ✅ Dictionary for HTML Pages
const shapeLinks = {
    pigGame: "./html/Pig-Game-with-Dice/index.html",
    spotify: "./html/spotify.html",
    linkedIn: "./html/linkedIn.html",
    unityGame: "./html/unity/index.html",
    about: "about.html",
};

// ✅ Create a CSS3D iframe Element (Initially Hidden)
const iframeElement = document.createElement("iframe");
iframeElement.style.width = "1024px";
iframeElement.style.height = "768px";
iframeElement.style.border = "none";
iframeElement.style.transform = "translate(-50%, -50%) scale(1)";
iframeElement.style.opacity = "0";

const cssObject = new THREE.CSS3DObject(iframeElement);
cssObject.scale.set(0.01, 0.01, 0.01);
cssObject.position.set(0, 0, 3);
cssObject.visible = false;
scene.add(cssObject);

// ✅ Function to Create App Icon Shape
function createAppIconShape() {
    const shape = new THREE.Shape();
    const r = 0.3, w = 2, h = 2;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return shape;
}

// ✅ Load Font & Create LinkedIn "in" Shape
const fontLoader = new THREE.FontLoader();
let linkedInGeometry = null;

fontLoader.load("fonts/helvetiker_bold.typeface.json", (font) => {
    linkedInGeometry = new THREE.TextGeometry("in", {
        font,
        size: 1.5,
        height: 0.4,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 5,
    });
    linkedInGeometry.computeBoundingBox();
    linkedInGeometry.center();
});

// ✅ Function to Create Random Shapes
function createCube(index) {
    const isMobile = window.innerWidth < 568;
    let baseX, baseY, baseZ;

    if (isMobile) {
        baseX = 0;
        baseY = index * 2.5 - (totalCubes / 2) * 2.5;
        baseZ = 0;
    } else {
        const angle = (index / totalCubes) * Math.PI * 2;
        baseX = Math.cos(angle) * circleRadius * 1.5;
        baseY = Math.sin(angle) * circleRadius * 1.5;
        baseZ = (Math.random() - 0.5) * 2;
    }

    const shapes = [
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.SphereGeometry(0.9, 32, 32),
        new THREE.ConeGeometry(1, 2, 32),
        new THREE.BoxGeometry(1.6, 1.6, 1.6),
        new THREE.CylinderGeometry(2, 2, 0.2, 64),
        linkedInGeometry || new THREE.BoxGeometry(1, 1, 1),
    ];

    const shape = shapes[index];
    const material = getMaterialForShape(shape);

    const cube = new THREE.Mesh(shape, material);
    cube.userData.url = material.userData?.url || shapeLinks.about;

    cube.position.set(baseX, baseY, baseZ);
    cube.geometry.computeBoundingBox();
    scene.add(cube);
    cubes.push(cube);
    originalPositions.push({ x: baseX, y: baseY, z: baseZ });

    animateCubeMovement(cube);
}

// ✅ Function to Get Material Based on Shape
function getMaterialForShape(shape) {
    if (shape instanceof THREE.BoxGeometry && shape.parameters.height === 1.5) {
        return new Array(6).fill().map((_, i) => new THREE.MeshBasicMaterial({ map: diceTextures[i] }));
    }
    if (shape instanceof THREE.CylinderGeometry && shape.parameters.height <= 0.2) {
        return new THREE.MeshStandardMaterial({ map: diskTexture, side: THREE.DoubleSide, userData: { url: shapeLinks.spotify } });
    }
    if (shape === linkedInGeometry) {
        return new THREE.MeshStandardMaterial({ color: 0xffffff, userData: { url: shapeLinks.linkedIn } });
    }
    return new THREE.MeshPhysicalMaterial({ color: 0xF5F5DC, roughness: 0.6, metalness: 0.1, clearcoat: 0.3, reflectivity: 0.5 });
}

// ✅ Function to Make Cubes Move Randomly
function animateCubeMovement(cube) {
    gsap.to(cube.position, {
        x: cube.position.x + (Math.random() - 0.5) * 1.5,
        y: cube.position.y + (Math.random() - 0.5) * 1.5,
        z: cube.position.z + (Math.random() - 0.5) * 0.5,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
    });

    gsap.to(cube.rotation, {
        y: Math.random() * Math.PI * 2,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
    });
}

// ✅ Create Cubes
for (let i = 0; i < totalCubes; i++) createCube(i);

// ✅ Handle Window Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ✅ Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
animate();
