// geometry/mainpage.js — Stylized "About Me" page/document shape
export function mainPageGeometry() {
    const group = new window.THREE.Group();

    // Main dark panel
    const panelGeometry = new window.THREE.BoxGeometry(5, 7, 0.2);
    const panelMaterial = new window.THREE.MeshStandardMaterial({ color: 0x2b2b2b });
    const panel = new window.THREE.Mesh(panelGeometry, panelMaterial);
    group.add(panel);

    // Inner white panel
    const innerPanelGeometry = new window.THREE.BoxGeometry(4.5, 6.5, 0.1);
    const innerPanelMaterial = new window.THREE.MeshStandardMaterial({ color: 0xffffff });
    const innerPanel = new window.THREE.Mesh(innerPanelGeometry, innerPanelMaterial);
    innerPanel.position.z = 0.11;
    panel.add(innerPanel);

    // Top buttons (traffic-light style)
    const buttonColors = [0xbbbbbb, 0xffffff, 0x00ccff];
    for (let i = 0; i < 3; i++) {
        const button = new window.THREE.Mesh(
            new window.THREE.SphereGeometry(0.2, 16, 16),
            new window.THREE.MeshStandardMaterial({ color: buttonColors[i] })
        );
        button.position.set(-1 + i * 0.5, 3, 0.2);
        panel.add(button);
    }

    // Blue bars (text lines)
    const barMaterial = new window.THREE.MeshStandardMaterial({ color: 0x00ccff });
    for (let i = 0; i < 6; i++) {
        const barWidth = 3 - (i === 5 ? 1.5 : 0);
        const barGeometry = new window.THREE.BoxGeometry(barWidth, 0.3, 0.1);
        const bar = new window.THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(0, 2.2 - i * 1, 0.12);
        innerPanel.add(bar);
    }

    group.scale.setScalar(1 / 3);
    return group;
}
