// extruded "67" geometry for Guess My Number
export function guessNumberGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // invisible hitbox sphere to make clicks easy regardless of text shape
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitSphere = new T.Mesh(new T.SphereGeometry(2.0, 8, 8), hitMat);
    group.add(hitSphere);

    // load font and create text once available
    const fontLoader = new T.FontLoader();
    fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', font => {
        const textGeo = new T.TextGeometry('67', {
            font,
            size: 1,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 3
        });
        textGeo.computeBoundingBox();
        textGeo.center();
        const textMat = new T.MeshStandardMaterial({ color: 0x333388 });
        const textMesh = new T.Mesh(textGeo, textMat);
        textMesh.rotation.x = Math.PI / 8;
        group.add(textMesh);
    });

    return group;
}