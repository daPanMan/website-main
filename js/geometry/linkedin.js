export function linkedInGeometry() {
    const textureLoader = new THREE.TextureLoader();

    // Load the LinkedIn texture
    const linkedinTexture = textureLoader.load('textures/linkedin.png');

    // Create a simple cube geometry (no rounded corners for now)
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);

 

    // Update the geometry to reflect the changes
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Recalculate normals for proper lighting

    // Create materials for the cube
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Right side (red)
        new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // Left side (green)
        new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Top side (blue)
        new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Bottom side (yellow)
        new THREE.MeshStandardMaterial({ map: linkedinTexture }), // Front side (LinkedIn texture)
        new THREE.MeshStandardMaterial({ map: linkedinTexture })  // Back side (LinkedIn texture)
    ];

    // Create the cube with materials
    const cube = new THREE.Mesh(geometry, materials);

    return cube;
}
