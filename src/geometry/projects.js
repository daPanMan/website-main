// "My Projects" icon — criss-crossed wrench and screwdriver
export function projectsGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    const metalMat = new T.MeshStandardMaterial({
        color: 0xc7ced6,
        metalness: 0.72,
        roughness: 0.34
    });

    const darkMetalMat = new T.MeshStandardMaterial({
        color: 0x5d6570,
        metalness: 0.58,
        roughness: 0.42
    });

    const handleMat = new T.MeshStandardMaterial({
        color: 0x2b2f3a,
        metalness: 0.12,
        roughness: 0.88
    });

    const accentMat = new T.MeshStandardMaterial({
        color: 0x00b8ff,
        metalness: 0.16,
        roughness: 0.76
    });

    function makeWrench() {
        const tool = new T.Group();

        // Main handle
        const handle = new T.Mesh(
            new T.CylinderGeometry(0.1, 0.13, 2.8, 18),
            metalMat
        );
        handle.rotation.z = Math.PI / 2;
        tool.add(handle);

        // Grip accent
        const grip = new T.Mesh(
            new T.CylinderGeometry(0.11, 0.11, 0.72, 18),
            accentMat
        );
        grip.rotation.z = Math.PI / 2;
        grip.position.x = -0.9;
        tool.add(grip);

        // Neck
        const neck = new T.Mesh(
            new T.BoxGeometry(0.34, 0.28, 0.18),
            darkMetalMat
        );
        neck.position.set(0.98, 0, 0);
        tool.add(neck);

        // Open jaw
        const jawTop = new T.Mesh(
            new T.BoxGeometry(0.16, 0.62, 0.18),
            darkMetalMat
        );
        jawTop.position.set(1.3, 0.33, 0);
        jawTop.rotation.z = 0.42;
        tool.add(jawTop);

        const jawBottom = new T.Mesh(
            new T.BoxGeometry(0.16, 0.62, 0.18),
            darkMetalMat
        );
        jawBottom.position.set(1.3, -0.33, 0);
        jawBottom.rotation.z = -0.42;
        tool.add(jawBottom);

        const jawBase = new T.Mesh(
            new T.BoxGeometry(0.2, 0.42, 0.18),
            darkMetalMat
        );
        jawBase.position.set(1.12, 0, 0);
        tool.add(jawBase);

        // Ring end
        const ringOuter = new T.Mesh(
            new T.TorusGeometry(0.22, 0.07, 10, 22),
            darkMetalMat
        );
        ringOuter.position.set(-1.26, 0, 0);
        tool.add(ringOuter);

        const ringInner = new T.Mesh(
            new T.CylinderGeometry(0.11, 0.11, 0.12, 18),
            handleMat
        );
        ringInner.rotation.x = Math.PI / 2;
        ringInner.position.set(-1.26, 0, 0);
        tool.add(ringInner);

        return tool;
    }

    function makeScrewdriver() {
        const tool = new T.Group();

        // Handle
        const handle = new T.Mesh(
            new T.CylinderGeometry(0.2, 0.26, 1.2, 20),
            accentMat
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.x = -0.95;
        tool.add(handle);

        // Rear cap
        const cap = new T.Mesh(
            new T.CylinderGeometry(0.12, 0.12, 0.16, 18),
            darkMetalMat
        );
        cap.rotation.z = Math.PI / 2;
        cap.position.x = -1.58;
        tool.add(cap);

        // Metal shaft
        const shaft = new T.Mesh(
            new T.CylinderGeometry(0.07, 0.07, 1.9, 16),
            metalMat
        );
        shaft.rotation.z = Math.PI / 2;
        shaft.position.x = 0.32;
        tool.add(shaft);

        // Collar between handle and shaft
        const collar = new T.Mesh(
            new T.CylinderGeometry(0.1, 0.1, 0.18, 16),
            darkMetalMat
        );
        collar.rotation.z = Math.PI / 2;
        collar.position.x = -0.28;
        tool.add(collar);

        // Flat-head tip
        const tip = new T.Mesh(
            new T.CylinderGeometry(0.03, 0.06, 0.42, 12),
            darkMetalMat
        );
        tip.rotation.z = Math.PI / 2;
        tip.position.x = 1.48;
        tool.add(tip);

        const blade = new T.Mesh(
            new T.BoxGeometry(0.14, 0.05, 0.12),
            darkMetalMat
        );
        blade.position.set(1.7, 0, 0);
        tool.add(blade);

        return tool;
    }

    const wrench = makeWrench();
    wrench.rotation.z = Math.PI / 4;
    wrench.position.set(-0.03, 0.03, 0.04);
    group.add(wrench);

    const screwdriver = makeScrewdriver();
    screwdriver.rotation.z = -Math.PI / 4;
    screwdriver.position.set(0.03, -0.03, -0.04);
    group.add(screwdriver);

    // Center fastener detail
    const centerBolt = new T.Mesh(
        new T.CylinderGeometry(0.17, 0.17, 0.24, 6),
        darkMetalMat
    );
    centerBolt.rotation.x = Math.PI / 2;
    group.add(centerBolt);

    const centerDot = new T.Mesh(
        new T.CylinderGeometry(0.07, 0.07, 0.08, 18),
        accentMat
    );
    centerDot.rotation.x = Math.PI / 2;
    centerDot.position.z = 0.12;
    group.add(centerDot);

    // Invisible hitbox
    const hitSphere = new T.Mesh(
        new T.SphereGeometry(2.3, 12, 12),
        new T.MeshBasicMaterial({ visible: false })
    );
    group.add(hitSphere);

    group.scale.setScalar(0.9);
    return group;
}