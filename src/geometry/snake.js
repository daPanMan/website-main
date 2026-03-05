// geometry/snake.js — Snake game icon (connected tube body)
export function snakeGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // --- Materials ---
    const bodyMat = new T.MeshStandardMaterial({ color: 0x22cc44, roughness: 0.35, metalness: 0.1 });
    const bellyMat = new T.MeshStandardMaterial({ color: 0x66dd77, roughness: 0.4, metalness: 0.05 });
    const headMat = new T.MeshStandardMaterial({ color: 0x119933, roughness: 0.3, metalness: 0.15 });
    const eyeMat  = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    const tongueMat = new T.MeshStandardMaterial({ color: 0xdd2244, roughness: 0.4 });
    const foodMat = new T.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3, metalness: 0.05 });

    // --- Smooth S-curve path for the body ---
    const curvePoints = [
        new T.Vector3( 0.00,  0.95,  0.00),   // head (top)
        new T.Vector3( 0.35,  0.65,  0.05),
        new T.Vector3( 0.50,  0.25,  0.00),
        new T.Vector3( 0.25, -0.10, -0.05),
        new T.Vector3(-0.20, -0.35,  0.00),
        new T.Vector3(-0.50, -0.55,  0.05),
        new T.Vector3(-0.35, -0.80,  0.00),
        new T.Vector3( 0.00, -0.95,  0.00),   // tail tip
    ];
    const curve = new T.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);

    // Tapering radius function: thick at head end, thin at tail
    function radiusAt(t) {
        const headR = 0.14;
        const tailR = 0.035;
        // Slight bulge near head, then smooth taper
        const bulge = Math.exp(-t * 4) * 0.03;
        return headR * (1 - t) + tailR * t + bulge;
    }

    // Build tube manually for tapering (TubeGeometry has uniform radius)
    const tubeSeg = 64;
    const radSeg = 10;
    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i <= tubeSeg; i++) {
        const t = i / tubeSeg;
        const pos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        // Build a local frame
        let up = new T.Vector3(0, 0, 1);
        if (Math.abs(tangent.dot(up)) > 0.99) up = new T.Vector3(0, 1, 0);
        const side = new T.Vector3().crossVectors(tangent, up).normalize();
        up = new T.Vector3().crossVectors(side, tangent).normalize();

        const r = radiusAt(t);
        for (let j = 0; j <= radSeg; j++) {
            const angle = (j / radSeg) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const nx = side.x * cos + up.x * sin;
            const ny = side.y * cos + up.y * sin;
            const nz = side.z * cos + up.z * sin;
            vertices.push(pos.x + nx * r, pos.y + ny * r, pos.z + nz * r);
            normals.push(nx, ny, nz);
            uvs.push(t, j / radSeg);
        }
    }
    for (let i = 0; i < tubeSeg; i++) {
        for (let j = 0; j < radSeg; j++) {
            const a = i * (radSeg + 1) + j;
            const b = a + radSeg + 1;
            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    const tubeGeo = new T.BufferGeometry();
    tubeGeo.setIndex(indices);
    tubeGeo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    tubeGeo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    tubeGeo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));

    const bodyMesh = new T.Mesh(tubeGeo, bodyMat);
    group.add(bodyMesh);

    // --- Head sphere (slightly larger, sits at curve start) ---
    const headPos = curve.getPointAt(0);
    const headSphere = new T.Mesh(new T.SphereGeometry(0.17, 16, 16), headMat);
    headSphere.position.copy(headPos);
    group.add(headSphere);

    // --- Eyes ---
    const headTangent = curve.getTangentAt(0).normalize();
    // Face direction: roughly +z and offset left/right
    const eyeGeo = new T.SphereGeometry(0.055, 10, 10);
    const pupilGeo = new T.SphereGeometry(0.03, 8, 8);

    const leftEye = new T.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(headPos.x - 0.09, headPos.y + 0.04, headPos.z + 0.13);
    group.add(leftEye);
    const leftPupil = new T.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(headPos.x - 0.09, headPos.y + 0.04, headPos.z + 0.17);
    group.add(leftPupil);

    const rightEye = new T.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(headPos.x + 0.09, headPos.y + 0.04, headPos.z + 0.13);
    group.add(rightEye);
    const rightPupil = new T.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(headPos.x + 0.09, headPos.y + 0.04, headPos.z + 0.17);
    group.add(rightPupil);

    // --- Tongue ---
    const tongueGeo = new T.CylinderGeometry(0.012, 0.005, 0.12, 6);
    const tongue = new T.Mesh(tongueGeo, tongueMat);
    tongue.position.set(headPos.x, headPos.y + 0.02, headPos.z + 0.22);
    tongue.rotation.x = Math.PI / 2;
    group.add(tongue);
    // Tongue fork (two tiny prongs)
    const forkGeo = new T.CylinderGeometry(0.006, 0.002, 0.05, 4);
    const forkL = new T.Mesh(forkGeo, tongueMat);
    forkL.position.set(headPos.x - 0.015, headPos.y + 0.02, headPos.z + 0.30);
    forkL.rotation.x = Math.PI / 2;
    forkL.rotation.z = 0.3;
    group.add(forkL);
    const forkR = new T.Mesh(forkGeo, tongueMat);
    forkR.position.set(headPos.x + 0.015, headPos.y + 0.02, headPos.z + 0.30);
    forkR.rotation.x = Math.PI / 2;
    forkR.rotation.z = -0.3;
    group.add(forkR);

    // --- Tail cap (smooth rounded end) ---
    const tailPos = curve.getPointAt(1);
    const tailCap = new T.Mesh(new T.SphereGeometry(0.04, 8, 8), bodyMat);
    tailCap.position.copy(tailPos);
    group.add(tailCap);

    // --- Little red food apple ---
    const apple = new T.Mesh(new T.SphereGeometry(0.1, 12, 12), foodMat);
    apple.position.set(0.50, 0.25, 0);
    group.add(apple);
    const stemMat = new T.MeshStandardMaterial({ color: 0x553311 });
    const stem = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.08, 6), stemMat);
    stem.position.set(0.50, 0.35, 0);
    group.add(stem);
    // Little leaf
    const leafMat = new T.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.5 });
    const leafGeo = new T.SphereGeometry(0.04, 6, 6);
    const leaf = new T.Mesh(leafGeo, leafMat);
    leaf.scale.set(1, 0.4, 1);
    leaf.position.set(0.53, 0.37, 0.02);
    leaf.rotation.z = -0.5;
    group.add(leaf);

    // --- invisible halo for easier clicking ---
    // compute a rough bounding sphere around the assembled snake and add a
    // larger, fully transparent mesh. The raycaster will hit this instead of
    // the thin tube when the user clicks near the body.
    const bbox = new T.Box3().setFromObject(group);
    const center = bbox.getCenter(new T.Vector3());
    const size = bbox.getSize(new T.Vector3()).length();
    const radius = size * 0.6; // a bit larger than the diagonal length
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitSphere = new T.Mesh(new T.SphereGeometry(radius, 8, 8), hitMat);
    hitSphere.position.copy(center);
    group.add(hitSphere);

    group.scale.setScalar(1.2);
    return group;
}
