
// geometry/email.js — 3D "@" symbol for email
export function emailGeometry() {
    const group = new window.THREE.Group();

    // Create a placeholder mesh immediately (torus looks like @)
    const torusGeo = new window.THREE.TorusGeometry(0.6, 0.2, 16, 32);
    const material = new window.THREE.MeshStandardMaterial({ color: 0xff6600 });
    const placeholder = new window.THREE.Mesh(torusGeo, material);
    group.add(placeholder);

    // Also add a small sphere in the center to suggest the @ symbol
    const dotGeo = new window.THREE.SphereGeometry(0.2, 16, 16);
    const dot = new window.THREE.Mesh(dotGeo, material);
    group.add(dot);

    // Load proper text geometry async and replace when ready
    const fontLoader = new window.THREE.FontLoader();
    fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', function (font) {
        const textGeo = new window.THREE.TextGeometry("@", {
            font: font,
            size: 1.5,
            height: 0.4,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 5
        });
        textGeo.computeBoundingBox();
        textGeo.center();

        // Remove placeholder parts
        group.remove(placeholder);
        group.remove(dot);
        placeholder.geometry.dispose();
        torusGeo.dispose();
        dotGeo.dispose();

        // Add the real @ text
        const textMesh = new window.THREE.Mesh(textGeo, material);
        group.add(textMesh);
    }, undefined, function (error) {
        console.error("Font failed to load, keeping placeholder:", error);
    });

    group.scale.setScalar(0.7);
    return group;
}
