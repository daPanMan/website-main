// geometry/pig-game.js - Dice with red dots (matches original site screenshot)
export function pigGameDice() {
    const T = window.THREE;
    const group = new T.Group();

    const whiteMat = new T.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3, metalness: 0.02 });
    const dotMat = new T.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });

    // White cube body
    const size = 1.1;
    const dice = new T.Mesh(new T.BoxGeometry(size, size, size), whiteMat);
    group.add(dice);

    // Rounded edges (subtle)
    const edgeMat = new T.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.35 });
    const edgeGeo = new T.CylinderGeometry(0.04, 0.04, size - 0.05, 8);
    // Vertical edges
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sz]) => {
        const edge = new T.Mesh(edgeGeo, edgeMat);
        edge.position.set(sx * size/2, 0, sz * size/2);
        group.add(edge);
    });

    // Dot helper
    const dotR = 0.08;
    const dotGeo = new T.SphereGeometry(dotR, 12, 12);
    function addDot(x, y, z) {
        const dot = new T.Mesh(dotGeo, dotMat);
        dot.position.set(x, y, z);
        group.add(dot);
    }

    const h = size / 2 + 0.01; // just above face
    const s = 0.22;             // dot spacing from center

    // Front face (z+) — 5 dots (like the screenshot shows scattered dots)
    addDot(0, 0, h);           // center
    addDot(-s, -s, h);         // corners
    addDot( s, -s, h);
    addDot(-s,  s, h);
    addDot( s,  s, h);

    // Right face (x+) — 3 dots
    addDot(h, 0, 0);
    addDot(h, -s, -s);
    addDot(h,  s,  s);

    // Top face (y+) — 2 dots
    addDot(-s, h, 0);
    addDot( s, h, 0);

    // Left face (x-) — 4 dots
    addDot(-h, -s, -s);
    addDot(-h,  s, -s);
    addDot(-h, -s,  s);
    addDot(-h,  s,  s);

    // Back face (z-) — 6 dots
    addDot(-s, -s, -h);
    addDot( s, -s, -h);
    addDot(-s,  0, -h);
    addDot( s,  0, -h);
    addDot(-s,  s, -h);
    addDot( s,  s, -h);

    // Bottom face (y-) — 1 dot
    addDot(0, -h, 0);

    // Slight tilt to show multiple faces (like screenshot)
    group.rotation.set(0.3, 0.4, 0.15);
    group.scale.setScalar(0.7);
    return group;
}
