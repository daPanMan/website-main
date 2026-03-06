// Stylized "My Projects" icon - a folder with a tab
export function projectsGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    // main folder body
    const body = new T.Mesh(
        new T.BoxGeometry(2.5, 1.5, 0.5),
        new T.MeshStandardMaterial({ color: 0xffcc33 })
    );
    body.position.set(0, 0, 0);
    group.add(body);

    // folder tab on top
    const tab = new T.Mesh(
        new T.BoxGeometry(1.2, 0.4, 0.2),
        new T.MeshStandardMaterial({ color: 0xffdd66 })
    );
    tab.position.set(-0.6, 0.95, 0.35);
    group.add(tab);

    // simple front detail lines
    const lineMat = new T.MeshStandardMaterial({ color: 0xccaa00 });
    for (let i = 0; i < 3; i++) {
        const line = new T.Mesh(
            new T.BoxGeometry(1.8, 0.05, 0.02),
            lineMat
        );
        line.position.set(0, 0.4 - i * 0.3, 0.26);
        group.add(line);
    }

    // hitbox sphere to ease clicking
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitSphere = new T.Mesh(new T.SphereGeometry(1.2, 8, 8), hitMat);
    group.add(hitSphere);

    return group;
}