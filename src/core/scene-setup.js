// Scene, camera, renderer, controls, lighting, resize handling
export const scene = new window.THREE.Scene();

// Mobile: orthographic camera for flat 2D-plane scrolling (no perspective distortion)
// Desktop: perspective camera for immersive 3D experience
function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    if (window.innerWidth < 768) {
        const frustumSize = 20; // visible height in world units
        const cam = new window.THREE.OrthographicCamera(
            -frustumSize * aspect / 2, frustumSize * aspect / 2,
            frustumSize / 2, -frustumSize / 2,
            0.1, 1000
        );
        cam.userData.frustumSize = frustumSize;
        return cam;
    }
    return new window.THREE.PerspectiveCamera(80, aspect, 0.1, 1000);
}
export const camera = createCamera();
export const renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: window.innerWidth > 768 });

// Set pixel ratio (cap at 2 for performance on high-DPI mobile screens)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// CSS3DRenderer for HTML-in-3D (titles, iframe overlay)
export const cssRenderer = new window.THREE.CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
Object.assign(cssRenderer.domElement.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    pointerEvents: 'none'
});

export function adjustCamera() {
    if (window.innerWidth < 768) {
        // Ortho camera — just set position, no FOV
        camera.position.set(0, 0, 24);
    } else {
        camera.fov = 80;
        camera.position.set(0, 0, 14);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
}
adjustCamera();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(cssRenderer.domElement);

// Prevent default touch gestures on the canvas (pull-to-refresh, scroll bounce)
// On mobile, allow pan-y so native scroll works
if (window.innerWidth < 768) {
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.position = 'fixed';
    cssRenderer.domElement.style.position = 'fixed';
    // Create scroll spacer for native vertical scroll
    const spacer = document.createElement('div');
    spacer.id = 'mobile-scroll-spacer';
    spacer.style.cssText = 'width:1px; pointer-events:none; height:350vh;';
    document.body.appendChild(spacer);
} else {
    renderer.domElement.style.touchAction = 'none';
}

export const controls = new window.THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: window.innerWidth >= 768, // disable pinch-zoom on mobile to prevent gesture conflicts
  zoomSpeed: 1.2,
  enableRotate: false,
  enablePan: false
});
// On mobile, disable OrbitControls entirely so it doesn't interfere with native scroll
if (window.innerWidth < 768) controls.enabled = false;

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    if (camera.isOrthographicCamera) {
        const aspect = window.innerWidth / window.innerHeight;
        const fs = camera.userData.frustumSize;
        camera.left   = -fs * aspect / 2;
        camera.right  =  fs * aspect / 2;
        camera.top    =  fs / 2;
        camera.bottom = -fs / 2;
    } else {
        camera.aspect = window.innerWidth / window.innerHeight;
    }
    camera.updateProjectionMatrix();
    // Don't reset camera position/FOV mid space tour — the tour owns the camera
    if (!window.spaceTourActive) adjustCamera();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

// Lighting
scene.add(new window.THREE.AmbientLight(0xffffff, 0.7));

// addBigTitle lives in src/features/big-title.js — import it from there.
