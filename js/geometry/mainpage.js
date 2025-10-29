export function mainPageGeometry() {
    const group = new THREE.Group();

    // Main dark panel
    const panelGeometry = new THREE.BoxGeometry(5, 7, 0.2);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    group.add(panel);

    // Inner white panel
    const innerPanelGeometry = new THREE.BoxGeometry(4.5, 6.5, 0.1);
    const innerPanelMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const innerPanel = new THREE.Mesh(innerPanelGeometry, innerPanelMaterial);
    innerPanel.position.z = 0.11;
    panel.add(innerPanel);

    // Top buttons
    const buttonColors = [0xbbbbbb, 0xffffff, 0x00ccff];
    for (let i = 0; i < 3; i++) {
        const button = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshStandardMaterial({ color: buttonColors[i] })
        );
        button.position.set(-1 + i * 0.5, 3, 0.2);
        panel.add(button);
    }

    // Blue bars (text lines)
    const barMaterial = new THREE.MeshStandardMaterial({ color: 0x00ccff });
    for (let i = 0; i < 6; i++) {
        const barWidth = 3 - (i === 5 ? 1.5 : 0); // Last bar shorter
        const barGeometry = new THREE.BoxGeometry(barWidth, 0.3, 0.1);
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(0, 2.2 - i * 1, 0.12);
        innerPanel.add(bar);
    }
        // Scale everything down by 1/3
    group.scale.setScalar(1 / 3);

    return group;
}
