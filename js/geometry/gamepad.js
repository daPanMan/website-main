// geometry/gamepad.js
export function gamepad() {
    const gamepad = new THREE.Group(); // Group to hold all parts of the gamepad

    // Body of the gamepad
    const bodyGeometry = new THREE.BoxGeometry(3, 1, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    gamepad.add(body);

    // Buttons (cylinders)
    const buttonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const buttonPositions = [
        { x: -0.8, y: 0.6, z: 0.75 }, // Left button
        { x: 0.8, y: 0.6, z: 0.75 },  // Right button
        { x: -0.8, y: 0.6, z: -0.75 }, // Bottom left button
        { x: 0.8, y: 0.6, z: -0.75 }   // Bottom right button
    ];

    buttonPositions.forEach(pos => {
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(pos.x, pos.y, pos.z);
        button.rotation.x = Math.PI / 2; // Rotate to lie flat
        gamepad.add(button);
    });

    // Joysticks (cylinders with spheres on top)
    const joystickBaseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
    const joystickStickGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32);
    const joystickMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    const joystickPositions = [
        { x: -1, y: 0.6, z: 0 }, // Left joystick
        { x: 1, y: 0.6, z: 0 }   // Right joystick
    ];

    joystickPositions.forEach(pos => {
        const base = new THREE.Mesh(joystickBaseGeometry, joystickMaterial);
        base.position.set(pos.x, pos.y, pos.z);
        base.rotation.x = Math.PI / 2; // Rotate to lie flat
        gamepad.add(base);

        const stick = new THREE.Mesh(joystickStickGeometry, joystickMaterial);
        stick.position.set(pos.x, pos.y + 0.35, pos.z);
        stick.rotation.x = Math.PI / 2; // Rotate to lie flat
        gamepad.add(stick);
    });

    return gamepad;
}