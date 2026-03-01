// geometry/pong.js - Tennis/pong ball with real tennis texture
export function pongBall() {
    const T = window.THREE;
    const group = new T.Group();

    // Tennis ball with texture
    const loader = new T.TextureLoader();
    const tennisTexture = loader.load('assets/textures/tennis.jpg');
    const ballMat = new T.MeshStandardMaterial({ map: tennisTexture, roughness: 0.6, metalness: 0.02, color: 0xcccccc });
    const ball = new T.Mesh(new T.SphereGeometry(0.65, 32, 32), ballMat);
    group.add(ball);

    group.scale.setScalar(0.8);
    return group;
}
