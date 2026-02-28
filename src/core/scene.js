export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
export const cssRenderer = new THREE.CSS3DRenderer();

export function initScene() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(cssRenderer.domElement);
    
    adjustCamera();
}

function adjustCamera() {
    if (window.innerWidth < 768) {
        camera.position.set(0, 0, 25);
    } else {
        camera.position.set(0, 0, 14);
    }
    camera.lookAt(0, 0, 0);
}