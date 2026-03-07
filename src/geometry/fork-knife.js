// Fork and knife geometry for the Recipes & Ratings project
export function forkKnifeGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // fork: simple box prongs
    const fork = new T.Mesh(
        new T.BoxGeometry(0.1, 1.2, 0.02),
        new T.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7, roughness: 0.3 })
    );
    // move fork closer to center and raise slightly so prongs are visible
    fork.position.set(-0.3, 0.1, 0);
    group.add(fork);
    for (let i = -1; i <= 1; i++) {
        const prong = new T.Mesh(
            new T.BoxGeometry(0.1, 0.4, 0.02),
            fork.material
        );
        prong.position.set(-0.3, 0.7 - i * 0.1, 0);
        group.add(prong);
    }

    // knife: elongated blade
    const knife = new T.Mesh(
        new T.BoxGeometry(0.05, 1.5, 0.05),
        new T.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 })
    );
    // bring knife next to fork and angle slightly inward
    knife.position.set(0.3, 0, 0);
    knife.rotation.z = -0.15;
    group.add(knife);

    // hitbox
    const hit = new T.Mesh(new T.SphereGeometry(1.5, 8, 8), new T.MeshBasicMaterial({visible:false}));
    group.add(hit);

    return group;
}