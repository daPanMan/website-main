// geometry/mini-game.js - Unity game cube with real texture on all faces
export function miniGameCube() {
    const T = window.THREE;
    const group = new T.Group();

    // Load unity texture and apply to all 6 faces
    const loader = new T.TextureLoader();
    const unityTexture = loader.load('assets/textures/unity.jpg');
    const cubeMat = new T.MeshStandardMaterial({ map: unityTexture, roughness: 0.35, metalness: 0.05 });
    const cube = new T.Mesh(new T.BoxGeometry(1.0, 1.0, 1.0), cubeMat);
    group.add(cube);

    // Dark edge wireframe overlay for that clean 3D look
    const edgeGeo = new T.EdgesGeometry(new T.BoxGeometry(1.01, 1.01, 1.01));
    const edgeMat = new T.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
    const edges = new T.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    group.scale.setScalar(0.8);
    return group;
}
