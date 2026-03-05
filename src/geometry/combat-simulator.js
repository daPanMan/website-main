// sword-shaped geometry for combat simulator
export function combatSimulatorGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // blade: thin tapered cylinder (narrower tip) oriented vertically
    const blade = new T.Mesh(
        // use slim radii to avoid thickness; top radius smaller than bottom
        new T.CylinderGeometry(0.05, 0.08, 1.6, 8),
        new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 })
    );
    // shift up so bottom of blade sits at y=0 (half of height 1.6)
    blade.position.set(0, 0.8, 0);
    // no rotation needed; default cylinder axis is along Y
    group.add(blade);

    // guard: flat box located at the base of the blade
    const guard = new T.Mesh(
        new T.BoxGeometry(0.6, 0.1, 0.2),
        new T.MeshStandardMaterial({ color: 0x444444 })
    );
    guard.position.set(0, 0, 0);
    group.add(guard);

    // handle: slimmer cylinder for a narrower grip
    const handle = new T.Mesh(
        new T.CylinderGeometry(0.06, 0.06, 0.8, 12), // smaller radius & slightly shorter
        new T.MeshStandardMaterial({ color: 0x552200 })
    );
    handle.position.set(0, -0.4, 0);
    group.add(handle);

    // pommel: small sphere sitting right at the bottom of the handle
    const pommel = new T.Mesh(
        new T.SphereGeometry(0.12, 8, 8),
        new T.MeshStandardMaterial({ color: 0x444444 })
    );
    // handle bottom is at -0.8, sphere radius 0.12 -> center at -0.8 - 0.12
    pommel.position.set(0, -0.92, 0);
    group.add(pommel);

    // invisible hitbox covering entire weapon
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitSphere = new T.Mesh(new T.SphereGeometry(1.5, 8, 8), hitMat);
    group.add(hitSphere);

    // rotate slightly so blade points up-right and forward
    group.rotation.z = -Math.PI / 8;
    group.rotation.x = -Math.PI / 16; // tilt forward for better tip visibility
    return group;
}    