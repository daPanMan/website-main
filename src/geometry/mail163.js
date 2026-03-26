// geometry/mail163.js — 3D "163" text for Chinese email contact
export function mail163Geometry() {
    const group = new window.THREE.Group();
    const T = window.THREE;

    const material = new T.MeshStandardMaterial({ color: 0xd40000, roughness: 0.4 });

    // Invisible hitbox for reliable raycasting before font loads
    const hitboxGeo = new T.BoxGeometry(2.2, 1.4, 0.6);
    const hitboxMat = new T.MeshBasicMaterial({ visible: false });
    const hitbox = new T.Mesh(hitboxGeo, hitboxMat);
    group.add(hitbox);

    // Placeholder: three small boxes to suggest "163"
    const boxGeo = new T.BoxGeometry(0.35, 1.0, 0.25);
    [-0.75, 0, 0.75].forEach(x => {
        const b = new T.Mesh(boxGeo, material);
        b.position.x = x;
        b.userData._isPlaceholder = true;
        group.add(b);
    });

    // Load proper text geometry async
    const fontLoader = new T.FontLoader();
    fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', function (font) {
        const textGeo = new T.TextGeometry("163", {
            font: font,
            size: 0.9,
            height: 0.3,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.04,
            bevelSize: 0.04,
            bevelSegments: 4
        });
        textGeo.computeBoundingBox();
        textGeo.center();

        // Remove placeholders
        const toRemove = group.children.filter(c => c.userData._isPlaceholder);
        toRemove.forEach(c => { group.remove(c); c.geometry.dispose(); });

        const textMesh = new T.Mesh(textGeo, material);
        group.add(textMesh);
    }, undefined, function (err) {
        console.error('163 font failed to load, keeping placeholder:', err);
    });

    group.scale.setScalar(0.85);
    return group;
}
