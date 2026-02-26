// geometry/gamepad.js - NES controller
export function gamepad() {
    const group = new window.THREE.Group();
    const T = window.THREE;

    // --- NES color palette ---
    const lightGrey = new T.MeshStandardMaterial({ color: 0xd4d0c8, roughness: 0.45, metalness: 0.02 });
    const darkGrey  = new T.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.08 });
    const blackMat  = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.1 });
    const redMat    = new T.MeshStandardMaterial({ color: 0xbc2031, roughness: 0.35 });
    const darkRedMt = new T.MeshStandardMaterial({ color: 0x8b1a2b, roughness: 0.4 });
    const goldStripe= new T.MeshStandardMaterial({ color: 0xc8a84e, roughness: 0.3, metalness: 0.15 });

    // ==================== MAIN BODY ====================
    // NES controller: flat wide rectangle, ~3:1.6 aspect
    const W = 4.2, H = 0.3, D = 2.2;

    // Use a rounded shape via extruded rounded rect
    const bodyShape = new T.Shape();
    const r = 0.35; // corner radius
    bodyShape.moveTo(-W/2 + r, -D/2);
    bodyShape.lineTo( W/2 - r, -D/2);
    bodyShape.quadraticCurveTo( W/2, -D/2,  W/2, -D/2 + r);
    bodyShape.lineTo( W/2,  D/2 - r);
    bodyShape.quadraticCurveTo( W/2,  D/2,  W/2 - r,  D/2);
    bodyShape.lineTo(-W/2 + r,  D/2);
    bodyShape.quadraticCurveTo(-W/2,  D/2, -W/2,  D/2 - r);
    bodyShape.lineTo(-W/2, -D/2 + r);
    bodyShape.quadraticCurveTo(-W/2, -D/2, -W/2 + r, -D/2);

    const extrudeSettings = { depth: H, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 };
    const bodyGeo = new T.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.center();
    const body = new T.Mesh(bodyGeo, lightGrey);
    body.rotation.x = -Math.PI / 2; // lay flat
    group.add(body);

    // ==================== DARK CENTER STRIP ====================
    // The NES has a recessed dark horizontal band across the middle
    const stripShape = new T.Shape();
    const sW = 3.0, sD = 0.75, sR = 0.12;
    stripShape.moveTo(-sW/2 + sR, -sD/2);
    stripShape.lineTo( sW/2 - sR, -sD/2);
    stripShape.quadraticCurveTo( sW/2, -sD/2,  sW/2, -sD/2 + sR);
    stripShape.lineTo( sW/2,  sD/2 - sR);
    stripShape.quadraticCurveTo( sW/2,  sD/2,  sW/2 - sR,  sD/2);
    stripShape.lineTo(-sW/2 + sR,  sD/2);
    stripShape.quadraticCurveTo(-sW/2,  sD/2, -sW/2,  sD/2 - sR);
    stripShape.lineTo(-sW/2, -sD/2 + sR);
    stripShape.quadraticCurveTo(-sW/2, -sD/2, -sW/2 + sR, -sD/2);

    const stripGeo = new T.ExtrudeGeometry(stripShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    stripGeo.center();
    const strip = new T.Mesh(stripGeo, darkGrey);
    strip.rotation.x = -Math.PI / 2;
    strip.position.y = H / 2 + 0.01;
    group.add(strip);

    // ==================== D-PAD (left side) ====================
    const dX = -1.35, dY = H / 2 + 0.05, dZ = 0.0;

    // D-pad base disc (recessed well)
    const dpadBase = new T.Mesh(
        new T.CylinderGeometry(0.52, 0.52, 0.04, 24),
        darkGrey
    );
    dpadBase.position.set(dX, dY - 0.02, dZ);
    group.add(dpadBase);

    // Cross - horizontal
    const crossH = new T.Mesh(
        new T.BoxGeometry(0.75, 0.1, 0.25),
        blackMat
    );
    crossH.position.set(dX, dY, dZ);
    group.add(crossH);

    // Cross - vertical
    const crossV = new T.Mesh(
        new T.BoxGeometry(0.25, 0.1, 0.75),
        blackMat
    );
    crossV.position.set(dX, dY, dZ);
    group.add(crossV);

    // ==================== A & B BUTTONS (right side) ====================
    // NES has two round buttons angled slightly
    const btnR = 0.22, btnH = 0.13;
    const btnGeo = new T.CylinderGeometry(btnR, btnR * 0.92, btnH, 20);
    const bX = 1.05, bZ = 0.15;
    const aX = 1.55, aZ = 0.15;
    const btnY = H / 2 + 0.04;

    // B button (left, darker red)
    const bBtn = new T.Mesh(btnGeo, darkRedMt);
    bBtn.position.set(bX, btnY, bZ);
    group.add(bBtn);

    // A button (right, red)
    const aBtn = new T.Mesh(btnGeo, redMat);
    aBtn.position.set(aX, btnY, aZ);
    group.add(aBtn);

    // Button wells (subtle rings)
    const wellGeo = new T.TorusGeometry(btnR + 0.02, 0.03, 8, 20);
    [bBtn, aBtn].forEach(b => {
        const well = new T.Mesh(wellGeo, darkGrey);
        well.position.copy(b.position);
        well.position.y -= 0.04;
        well.rotation.x = Math.PI / 2;
        group.add(well);
    });

    // ==================== SELECT & START (center) ====================
    // Pill-shaped buttons
    const ssShape = new T.Shape();
    const ssW = 0.3, ssD2 = 0.09, ssR2 = 0.09;
    ssShape.moveTo(-ssW/2 + ssR2, -ssD2);
    ssShape.lineTo( ssW/2 - ssR2, -ssD2);
    ssShape.quadraticCurveTo( ssW/2, -ssD2,  ssW/2, 0);
    ssShape.quadraticCurveTo( ssW/2,  ssD2,  ssW/2 - ssR2,  ssD2);
    ssShape.lineTo(-ssW/2 + ssR2,  ssD2);
    ssShape.quadraticCurveTo(-ssW/2,  ssD2, -ssW/2, 0);
    ssShape.quadraticCurveTo(-ssW/2, -ssD2, -ssW/2 + ssR2, -ssD2);
    const ssGeo = new T.ExtrudeGeometry(ssShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 2 });
    ssGeo.center();

    const selectBtn = new T.Mesh(ssGeo, darkGrey);
    selectBtn.rotation.x = -Math.PI / 2;
    selectBtn.position.set(-0.25, H / 2 + 0.03, 0.35);
    group.add(selectBtn);

    const startBtn = new T.Mesh(ssGeo, darkGrey);
    startBtn.rotation.x = -Math.PI / 2;
    startBtn.position.set(0.25, H / 2 + 0.03, 0.35);
    group.add(startBtn);

    // ==================== RED STRIPE / LABEL AREA ====================
    // The iconic red stripe along the top of the NES controller
    const redStripe = new T.Mesh(
        new T.BoxGeometry(W * 0.92, 0.03, 0.2),
        redMat
    );
    redStripe.position.set(0, H / 2 + 0.02, -D / 2 + 0.35);
    group.add(redStripe);

    // Gold pinstripe above red
    const goldLine = new T.Mesh(
        new T.BoxGeometry(W * 0.92, 0.035, 0.04),
        goldStripe
    );
    goldLine.position.set(0, H / 2 + 0.025, -D / 2 + 0.22);
    group.add(goldLine);

    // "Nintendo" label area (dark rectangle)
    const labelBg = new T.Mesh(
        new T.BoxGeometry(1.2, 0.03, 0.35),
        blackMat
    );
    labelBg.position.set(0, H / 2 + 0.025, -D / 2 + 0.55);
    group.add(labelBg);

    // ==================== BOTTOM EDGE DETAIL ====================
    // Subtle seam line around body edge
    const seamGeo = new T.BoxGeometry(W - 0.4, 0.015, 0.03);
    const seamFront = new T.Mesh(seamGeo, darkGrey);
    seamFront.position.set(0, 0, D / 2 - 0.05);
    group.add(seamFront);

    const seamBack = new T.Mesh(seamGeo, darkGrey);
    seamBack.position.set(0, 0, -D / 2 + 0.05);
    group.add(seamBack);

    // ==================== FINAL TRANSFORMS ====================
    group.rotation.x = -0.3;   // slight tilt toward viewer
    group.scale.setScalar(0.7);

    return group;
}
