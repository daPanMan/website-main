// geometry/pig-game.js - Dice with real face textures from the Pig Game
export function pigGameDice() {
    const T = window.THREE;
    const group = new T.Group();

    const loader = new T.TextureLoader();
    // Load dice face textures (dice-1.png through dice-6.png)
    // Three.js BoxGeometry face order: +x, -x, +y, -y, +z, -z
    // Map: right=3, left=4, top=2, bottom=5, front=1, back=6
    const faceMaterials = [
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-3.png'), roughness: 0.3 }),  // +x (right)
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-4.png'), roughness: 0.3 }),  // -x (left)
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-2.png'), roughness: 0.3 }),  // +y (top)
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-5.png'), roughness: 0.3 }),  // -y (bottom)
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-1.png'), roughness: 0.3 }),  // +z (front)
        new T.MeshStandardMaterial({ map: loader.load('assets/textures/dice-6.png'), roughness: 0.3 }),  // -z (back)
    ];

    const size = 1.1;
    const dice = new T.Mesh(new T.BoxGeometry(size, size, size), faceMaterials);
    group.add(dice);

    // Slight tilt to show multiple faces
    group.rotation.set(0.3, 0.4, 0.15);
    group.scale.setScalar(0.7);
    return group;
}
