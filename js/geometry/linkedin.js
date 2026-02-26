// geometry/linkedin.js — LinkedIn logo cube with texture
export function linkedInGeometry() {
    const textureLoader = new window.THREE.TextureLoader();
    const linkedinTexture = textureLoader.load('textures/linkedin.png');

    const geometry = new window.THREE.BoxGeometry(1.5, 1.5, 0.3);

    const sideMaterial = new window.THREE.MeshStandardMaterial({ color: 0x0077b5 }); // LinkedIn blue
    const materials = [
        sideMaterial, // right
        sideMaterial, // left
        sideMaterial, // top
        sideMaterial, // bottom
        new window.THREE.MeshStandardMaterial({ map: linkedinTexture }), // front
        new window.THREE.MeshStandardMaterial({ map: linkedinTexture })  // back
    ];

    const cube = new window.THREE.Mesh(geometry, materials);
    return cube;
}
