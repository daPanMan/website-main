// geometry/tictactoe.js — Tic Tac Toe icon (solid board with X and O)
export function tictactoeGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    const boardMat = new T.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.5, metalness: 0.05 });
    const lineMat  = new T.MeshStandardMaterial({ color: 0x555577, roughness: 0.4 });
    const xMat     = new T.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.3, metalness: 0.1 });
    const oMat     = new T.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.3, metalness: 0.1 });

    // --- Solid background board (easy click target) ---
    const boardSize = 1.1;
    const board = new T.Mesh(
        new T.BoxGeometry(boardSize, boardSize, 0.08),
        boardMat
    );
    group.add(board);

    // --- Grid lines etched into the board ---
    const lineW = 0.03;
    const lineLen = boardSize * 0.85;
    const off = boardSize / 6; // 1/3 spacing

    [-off, off].forEach(x => {
        const bar = new T.Mesh(new T.BoxGeometry(lineW, lineLen, 0.02), lineMat);
        bar.position.set(x, 0, 0.04);
        group.add(bar);
    });
    [-off, off].forEach(y => {
        const bar = new T.Mesh(new T.BoxGeometry(lineLen, lineW, 0.02), lineMat);
        bar.position.set(0, y, 0.04);
        group.add(bar);
    });

    // --- Cell spacing ---
    const cell = boardSize / 3;

    function addX(cx, cy) {
        const len = cell * 0.6;
        const thick = 0.04;
        const arm1 = new T.Mesh(new T.BoxGeometry(thick, len, 0.04), xMat);
        arm1.rotation.z = Math.PI / 4;
        arm1.position.set(cx, cy, 0.06);
        group.add(arm1);
        const arm2 = new T.Mesh(new T.BoxGeometry(thick, len, 0.04), xMat);
        arm2.rotation.z = -Math.PI / 4;
        arm2.position.set(cx, cy, 0.06);
        group.add(arm2);
    }

    function addO(cx, cy) {
        const ring = new T.Mesh(new T.TorusGeometry(cell * 0.25, 0.03, 12, 24), oMat);
        ring.position.set(cx, cy, 0.06);
        group.add(ring);
    }

    // Place some markers on the board
    addX(-cell,  cell);   // top-left
    addO( cell,  cell);   // top-right
    addX(0,      0);      // center
    addO(-cell, -cell);   // bottom-left
    addX( cell, -cell);   // bottom-right

    group.scale.setScalar(1.2);
    return group;
}
