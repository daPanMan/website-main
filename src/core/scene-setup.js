// Scene, camera, renderer, controls, lighting, resize handling
export const scene = new window.THREE.Scene();
export const camera = new window.THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
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
        camera.position.set(0, 0, 18);
    } else {
        camera.position.set(0, 0, 14);
    }
    camera.lookAt(0, 0, 0);
}
adjustCamera();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(cssRenderer.domElement);

// Prevent default touch gestures on the canvas (pull-to-refresh, scroll bounce)
renderer.domElement.style.touchAction = 'none';

export const controls = new window.THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: window.innerWidth >= 768, // disable pinch-zoom on mobile to prevent gesture conflicts
  zoomSpeed: 1.2,
  enableRotate: false,
  enablePan: false
});

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    adjustCamera();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

// Lighting
scene.add(new window.THREE.AmbientLight(0xffffff, 0.7));

export function addBigTitle(text) {
    const mobile = window.innerWidth < 768;
    const titleElement = Object.assign(document.createElement('div'), {
        className: 'big-title',
        innerText: text
    });
    Object.assign(titleElement.style, {
        position: 'absolute',
        color: 'white',
        fontSize: mobile ? '80px' : '132px',
        fontWeight: 'bold',
        textShadow: '0px 0px 10px rgba(255,255,255,0.8)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
    });
    const bigTitleObject = new window.THREE.CSS3DObject(titleElement);
    bigTitleObject.scale.set(0.01, 0.01, 0.01);
    bigTitleObject.position.set(0, 0, 0);
    scene.add(bigTitleObject);
    return bigTitleObject;
}
