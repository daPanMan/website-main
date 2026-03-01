
// geometry/email.js — 3D "@" symbol for Contact Me
export function emailGeometry() {
    const group = new window.THREE.Group();
    const T = window.THREE;

    const material = new T.MeshStandardMaterial({ color: 0xff6600 });

    // Invisible hitbox so raycasting/clicking always works (even during async font load)
    const hitboxGeo = new T.BoxGeometry(1.8, 1.8, 0.6);
    const hitboxMat = new T.MeshBasicMaterial({ visible: false });
    const hitbox = new T.Mesh(hitboxGeo, hitboxMat);
    group.add(hitbox);

    // Create a placeholder mesh immediately (torus looks like @)
    const torusGeo = new T.TorusGeometry(0.6, 0.2, 16, 32);
    const placeholder = new T.Mesh(torusGeo, material);
    group.add(placeholder);

    // Also add a small sphere in the center to suggest the @ symbol
    const dotGeo = new T.SphereGeometry(0.2, 16, 16);
    const dot = new T.Mesh(dotGeo, material);
    group.add(dot);

    // Load proper text geometry async and replace when ready
    const fontLoader = new T.FontLoader();
    fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', function (font) {
        const textGeo = new T.TextGeometry("@", {
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
        const textMesh = new T.Mesh(textGeo, material);
        group.add(textMesh);
    }, undefined, function (error) {
        console.error("Font failed to load, keeping placeholder:", error);
    });

    group.scale.setScalar(0.7);
    return group;
}
