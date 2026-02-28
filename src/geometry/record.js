// geometry/record.js — Vinyl record / disc with disk.png texture
export function recordGeometry() {
    const T = window.THREE;
    const group = new T.Group();
    const loader = new T.TextureLoader();
    const diskTexture = loader.load('assets/textures/disk.png');

    // Disc body — flat cylinder
    const discMat = new T.MeshStandardMaterial({
        map: diskTexture,
        side: T.DoubleSide,
        roughness: 0.35,
        metalness: 0.1
    });
    const disc = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.12, 64), discMat);
    group.add(disc);

    // Center hole ring
    const holeMat = new T.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.2 });
    const hole = new T.Mesh(new T.TorusGeometry(0.15, 0.04, 12, 32), holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.y = 0.07;
    group.add(hole);

    // Subtle groove rings on vinyl surface
    const grooveMat = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, transparent: true, opacity: 0.3 });
    [0.4, 0.6, 0.85].forEach(r => {
        const groove = new T.Mesh(new T.TorusGeometry(r, 0.008, 8, 64), grooveMat);
        groove.rotation.x = Math.PI / 2;
        groove.position.y = 0.065;
        group.add(groove);
    });

    // Tilt slightly to show the face
    group.rotation.x = 0.3;
    group.scale.setScalar(1.0);
    return group;
}
