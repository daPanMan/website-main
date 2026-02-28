// geometry/pong.js - Yellow tennis/pong ball (matches original site screenshot)
export function pongBall() {
    const T = window.THREE;
    const group = new T.Group();

    // Yellow sphere — tennis ball style
    const ballMat = new T.MeshStandardMaterial({ color: 0xd4d940, roughness: 0.45, metalness: 0.05 });
    const ball = new T.Mesh(new T.SphereGeometry(0.65, 28, 28), ballMat);
    group.add(ball);

    // Seam line (the curved white stripe on a tennis ball)
    const seamMat = new T.MeshStandardMaterial({ color: 0xf0f0e0, roughness: 0.5 });
    const seam = new T.Mesh(new T.TorusGeometry(0.65, 0.03, 8, 48), seamMat);
    seam.rotation.x = Math.PI / 4;
    group.add(seam);

    const seam2 = new T.Mesh(new T.TorusGeometry(0.65, 0.03, 8, 48), seamMat);
    seam2.rotation.x = -Math.PI / 4;
    group.add(seam2);

    group.scale.setScalar(0.8);
    return group;
}
