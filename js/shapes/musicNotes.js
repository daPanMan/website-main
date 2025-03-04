// 🎵 Function to Create a Music Note Geometry
export function createMusicNote() {
    const noteGroup = new THREE.Group(); // Group to hold all parts

    // 🎶 Note head (ellipse shape)
    const headGeometry = new THREE.SphereGeometry(1, 32, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const noteHead = new THREE.Mesh(headGeometry, headMaterial);
    noteHead.scale.set(1.2, 0.8, 1); // Make it an oval shape
    noteHead.position.set(0, 0, 0); // Center position

    // 🎶 Note stem (vertical line)
    const stemGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
    const stem = new THREE.Mesh(stemGeometry, headMaterial);
    stem.position.set(0.6, 2, 0); // Position slightly to the right
    stem.rotation.z = Math.PI * 0.02; // Slight tilt

    // 🎶 Note flag (curved part)
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.bezierCurveTo(1, 2, 2, 3, 1, 4); // Bezier curve for smooth flag

    const flagGeometry = new THREE.ExtrudeGeometry(flagShape, { depth: 0.1, bevelEnabled: false });
    const noteFlag = new THREE.Mesh(flagGeometry, headMaterial);
    noteFlag.position.set(0.8, 4, 0);
    noteFlag.rotation.z = -Math.PI / 4;

    // 🎶 Group all parts together
    noteGroup.add(noteHead);
    noteGroup.add(stem);
    noteGroup.add(noteFlag);
    
    return noteGroup;
}
