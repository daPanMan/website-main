// Scene, camera, renderer, controls, lighting, resize handling
export const scene = new window.THREE.Scene();
export const camera = new window.THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });

export function adjustCamera() {
    if (window.innerWidth < 768) {
        camera.position.set(0, 0, 25);
    } else {
        camera.position.set(0, 0, 14);
    }
    camera.lookAt(0, 0, 0);
}
adjustCamera();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

export const controls = new window.THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: true,
  zoomSpeed: 1.2,
  enableRotate: false,
  enablePan: false
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    adjustCamera();
});

// Lighting
scene.add(new window.THREE.AmbientLight(0xffffff, 1));

export function addBigTitle(text) {
    const titleElement = Object.assign(document.createElement('div'), {
        className: 'big-title',
        innerText: text
    });
    Object.assign(titleElement.style, {
        position: 'absolute',
        color: 'white',
        fontSize: '132px',
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
