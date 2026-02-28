// geometry/mini-game.js - Simple white 3D cube (matches original site screenshot)
export function miniGameCube() {
    const T = window.THREE;
    const group = new T.Group();

    // White cube with visible edges — like the original screenshot
    const cubeMat = new T.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.35, metalness: 0.05 });
    const cube = new T.Mesh(new T.BoxGeometry(1.0, 1.0, 1.0), cubeMat);
    group.add(cube);

    // Dark edge wireframe overlay for that clean 3D look
    const edgeGeo = new T.EdgesGeometry(new T.BoxGeometry(1.01, 1.01, 1.01));
    const edgeMat = new T.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
    const edges = new T.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    // Subtle shadow on one face to give depth
    const shadowFace = new T.Mesh(
        new T.PlaneGeometry(1.0, 1.0),
        new T.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4 })
    );
    shadowFace.position.set(0, -0.501, 0);
    shadowFace.rotation.x = -Math.PI / 2;
    group.add(shadowFace);

    group.scale.setScalar(0.8);
    return group;
}
