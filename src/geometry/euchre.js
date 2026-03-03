// geometry/euchre.js — Euchre game icon (fan of playing cards)
export function euchreGeometry() {
    const T = window.THREE;
    const group = new T.Group();

    const cardW = 0.55, cardH = 0.78, cardD = 0.02;

    // Card colours
    const whiteMat = new T.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const redMat   = new T.MeshStandardMaterial({ color: 0xdd3333, roughness: 0.3 });
    const blackMat = new T.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const backMat  = new T.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.4 });

    function createCard(suitColor, angle, yOff) {
        const cardGroup = new T.Group();

        // Card face (white)
        const face = new T.Mesh(new T.BoxGeometry(cardW, cardH, cardD), whiteMat);
        cardGroup.add(face);

        // Card back (blue)
        const back = new T.Mesh(new T.BoxGeometry(cardW - 0.04, cardH - 0.04, 0.005), backMat);
        back.position.z = -0.012;
        cardGroup.add(back);

        // Suit pip (small diamond/circle shape in center)
        const pipMat = suitColor === 'red' ? redMat : blackMat;
        const pip = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.005), pipMat);
        pip.rotation.z = Math.PI / 4; // rotated to look like a diamond
        pip.position.z = 0.012;
        cardGroup.add(pip);

        // Small rank indicator at top-left
        const rankPip = new T.Mesh(new T.BoxGeometry(0.06, 0.09, 0.005), pipMat);
        rankPip.position.set(-0.19, 0.28, 0.012);
        cardGroup.add(rankPip);

        // Fan the card
        cardGroup.rotation.z = angle;
        cardGroup.position.y = yOff;

        return cardGroup;
    }

    // Fan of 5 cards (a Euchre hand)
    const angles = [-0.4, -0.2, 0, 0.2, 0.4];
    const colors = ['red', 'black', 'red', 'black', 'red'];
    for (let i = 0; i < 5; i++) {
        const card = createCard(colors[i], angles[i], -0.15);
        card.position.z = i * 0.01; // slight depth offset so they stack
        group.add(card);
    }

    // Trump indicator — small crown/diamond above the fan
    const trumpGem = new T.Mesh(
        new T.OctahedronGeometry(0.12, 0),
        new T.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.3 })
    );
    trumpGem.position.set(0, 0.6, 0.05);
    trumpGem.rotation.z = Math.PI / 4;
    group.add(trumpGem);

    // Invisible click plane behind everything
    const hitMat = new T.MeshBasicMaterial({ visible: false });
    const hitBox = new T.Mesh(new T.PlaneGeometry(1.8, 1.6), hitMat);
    hitBox.position.z = -0.03;
    group.add(hitBox);

    group.scale.setScalar(2.25);
    return group;
}
