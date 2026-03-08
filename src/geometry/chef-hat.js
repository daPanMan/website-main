// Chef's hat geometry for Recipes & Ratings (scaled down by 0.7)
export function chefHatGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    const hatMat = new T.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.08,
        roughness: 0.9
    });

    const creaseMat = new T.MeshStandardMaterial({
        color: 0xf2f2f2,
        metalness: 0.05,
        roughness: 0.95
    });

    // Bottom band / brim
    const brim = new T.Mesh(
        new T.CylinderGeometry(0.826, 0.868, 0.168, 40),
        hatMat
    );
    brim.position.y = -0.546;
    group.add(brim);

    // Main tall body
    const body = new T.Mesh(
        new T.CylinderGeometry(0.644, 0.714, 1.015, 40, 1, false),
        hatMat
    );
    body.position.y = 0.014;
    group.add(body);

    // Puffy top section
    const top = new T.Mesh(
        new T.SphereGeometry(0.966, 32, 24),
        hatMat
    );
    top.position.y = 0.714;
    top.scale.set(1.0, 0.62, 1.0);
    group.add(top);

    // Small center puff to make the top feel softer / more toque-like
    const topPuff = new T.Mesh(
        new T.SphereGeometry(0.504, 24, 18),
        hatMat
    );
    topPuff.position.y = 0.966;
    topPuff.scale.set(1.0, 0.72, 1.0);
    group.add(topPuff);

    // Soft vertical cloth creases on the body
    const creaseCount = 10;
    for (let i = 0; i < creaseCount; i++) {
        const crease = new T.Mesh(
            new T.BoxGeometry(0.042, 0.826, 0.035),
            creaseMat
        );

        const angle = (i / creaseCount) * Math.PI * 2;
        const radius = 0.651;

        crease.position.set(
            Math.cos(angle) * radius,
            0.042,
            Math.sin(angle) * radius
        );

        crease.rotation.y = -angle;
        group.add(crease);
    }

    // Slight squash so it feels more icon-like and less perfectly rigid
    group.scale.set(1, 1.06, 1);

    // Invisible hitbox for clicking
    const hit = new T.Mesh(
        new T.SphereGeometry(1.19, 12, 12),
        new T.MeshBasicMaterial({ visible: false })
    );
    hit.position.y = 0.315;
    group.add(hit);

    return group;
}