// geometry/mainpage.js — "About Me" as a two-sided business card
export function mainPageGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    const frontMat = new T.MeshStandardMaterial({
        color: 0xf6f2ea,
        metalness: 0.03,
        roughness: 0.95
    });

    const edgeMat = new T.MeshStandardMaterial({
        color: 0xddd6ca,
        metalness: 0.04,
        roughness: 0.92
    });

    const darkMat = new T.MeshStandardMaterial({
        color: 0x2b2f3a,
        metalness: 0.08,
        roughness: 0.88
    });

    const accentMat = new T.MeshStandardMaterial({
        color: 0x00b8ff,
        metalness: 0.1,
        roughness: 0.8
    });

    const textMat = new T.MeshStandardMaterial({
        color: 0xaeb8c8,
        metalness: 0.03,
        roughness: 0.92
    });

    const darkTextMat = new T.MeshStandardMaterial({
        color: 0x3a4250,
        metalness: 0.03,
        roughness: 0.9
    });

    // Back shadow card for depth
    const shadowCard = new T.Mesh(
        new T.BoxGeometry(5.3, 3.25, 0.16),
        darkMat
    );
    shadowCard.position.set(0.12, -0.1, -0.18);
    shadowCard.rotation.z = -0.04;
    group.add(shadowCard);

    // Main business card body
    const card = new T.Mesh(
        new T.BoxGeometry(5.2, 3.2, 0.16),
        edgeMat
    );
    group.add(card);

    // ---------- FRONT SIDE ----------

    // Front face panel
    const frontFace = new T.Mesh(
        new T.BoxGeometry(5.0, 3.0, 0.02),
        frontMat
    );
    frontFace.position.z = 0.09;
    group.add(frontFace);

    // Accent strip across the top
    const topStrip = new T.Mesh(
        new T.BoxGeometry(5.0, 0.38, 0.03),
        accentMat
    );
    topStrip.position.set(0, 1.31, 0.1);
    group.add(topStrip);

    // Avatar circle on the left
    const avatar = new T.Mesh(
        new T.CylinderGeometry(0.55, 0.55, 0.05, 28),
        darkMat
    );
    avatar.rotation.x = Math.PI / 2;
    avatar.position.set(-1.65, 0.35, 0.11);
    group.add(avatar);

    // Simple head inside avatar
    const head = new T.Mesh(
        new T.SphereGeometry(0.17, 18, 18),
        frontMat
    );
    head.position.set(-1.65, 0.48, 0.15);
    group.add(head);

    // Simple shoulders inside avatar
    const shoulders = new T.Mesh(
        new T.SphereGeometry(0.28, 18, 14),
        frontMat
    );
    shoulders.position.set(-1.65, 0.18, 0.15);
    shoulders.scale.set(1.0, 0.55, 0.6);
    group.add(shoulders);

    // Name line
    const nameBar = new T.Mesh(
        new T.BoxGeometry(1.95, 0.16, 0.03),
        darkTextMat
    );
    nameBar.position.set(0.7, 0.75, 0.11);
    group.add(nameBar);

    // Title line
    const titleBar = new T.Mesh(
        new T.BoxGeometry(1.45, 0.11, 0.025),
        accentMat
    );
    titleBar.position.set(0.45, 0.46, 0.11);
    group.add(titleBar);

    // Contact / detail lines
    for (let i = 0; i < 3; i++) {
        const line = new T.Mesh(
            new T.BoxGeometry(1.85 - i * 0.18, 0.09, 0.02),
            textMat
        );
        line.position.set(0.52, 0.02 - i * 0.34, 0.11);
        group.add(line);
    }

    // Small icon bullets
    for (let i = 0; i < 3; i++) {
        const bullet = new T.Mesh(
            new T.CylinderGeometry(0.06, 0.06, 0.03, 16),
            accentMat
        );
        bullet.rotation.x = Math.PI / 2;
        bullet.position.set(-0.48, 0.02 - i * 0.34, 0.115);
        group.add(bullet);
    }

    // Bottom-right logo / QR placeholder
    const cornerMark = new T.Mesh(
        new T.BoxGeometry(0.55, 0.55, 0.03),
        darkMat
    );
    cornerMark.position.set(1.82, -0.95, 0.11);
    group.add(cornerMark);

    const cornerDot = new T.Mesh(
        new T.CylinderGeometry(0.1, 0.1, 0.03, 18),
        accentMat
    );
    cornerDot.rotation.x = Math.PI / 2;
    cornerDot.position.set(1.82, -0.95, 0.13);
    group.add(cornerDot);

    // ---------- BACK SIDE ----------

    // Back face panel
    const backFace = new T.Mesh(
        new T.BoxGeometry(5.0, 3.0, 0.02),
        darkMat
    );
    backFace.position.z = -0.09;
    group.add(backFace);

    // Large accent band on back
    const backBand = new T.Mesh(
        new T.BoxGeometry(5.0, 0.55, 0.025),
        accentMat
    );
    backBand.position.set(0, 1.05, -0.1);
    group.add(backBand);

    // Center logo mark
    const logoPlate = new T.Mesh(
        new T.CylinderGeometry(0.52, 0.52, 0.03, 28),
        frontMat
    );
    logoPlate.rotation.x = Math.PI / 2;
    logoPlate.position.set(0, 0.35, -0.11);
    group.add(logoPlate);

    const logoDot = new T.Mesh(
        new T.CylinderGeometry(0.16, 0.16, 0.03, 20),
        accentMat
    );
    logoDot.rotation.x = Math.PI / 2;
    logoDot.position.set(0, 0.35, -0.13);
    group.add(logoDot);

    // Brand / website style lines
    const backLine1 = new T.Mesh(
        new T.BoxGeometry(1.8, 0.12, 0.02),
        frontMat
    );
    backLine1.position.set(0, -0.35, -0.1);
    group.add(backLine1);

    const backLine2 = new T.Mesh(
        new T.BoxGeometry(1.2, 0.08, 0.02),
        accentMat
    );
    backLine2.position.set(0, -0.62, -0.1);
    group.add(backLine2);

    // Decorative mini chips on back
    for (let i = 0; i < 3; i++) {
        const chip = new T.Mesh(
            new T.BoxGeometry(0.35, 0.12, 0.02),
            i === 1 ? accentMat : frontMat
        );
        chip.position.set(-0.5 + i * 0.5, -1.05, -0.1);
        group.add(chip);
    }

    group.rotation.y = Math.PI; // flip to show back by default

    // Slight tilt so it feels more alive
    group.rotation.z = -0.05;

    // Invisible hitbox
    const hit = new T.Mesh(
        new T.BoxGeometry(5.8, 3.8, 1.2),
        new T.MeshBasicMaterial({ visible: false })
    );
    group.add(hit);

    group.scale.setScalar(0.34);
    return group;
}