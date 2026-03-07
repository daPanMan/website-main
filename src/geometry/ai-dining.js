// Simple icon for the AI Dining project: a plate with a spoon
export function aiDiningGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // plate (a flat torus)
    const plate = new T.Mesh(
        new T.TorusGeometry(1, 0.1, 16, 100),
        new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.7 })
    );
    plate.rotation.x = Math.PI / 2;
    group.add(plate);

    // spoon (a simple elongated box)
    const spoon = new T.Mesh(
        new T.BoxGeometry(0.1, 0.5, 0.05),
        new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    spoon.position.set(0.8, 0, 0.25);
    spoon.rotation.z = Math.PI / 4;
    group.add(spoon);

    // hitbox sphere for clicking
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitSphere = new T.Mesh(new T.SphereGeometry(1.2, 8, 8), hitMat);
    group.add(hitSphere);

    return group;
}