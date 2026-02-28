// geometry/linkedin.js — LinkedIn logo rounded box with texture
export function linkedInGeometry() {
    const T = window.THREE;
    const textureLoader = new T.TextureLoader();
    const linkedinTexture = textureLoader.load('assets/textures/linkedin.png');

    // RoundedBoxGeometry: width, height, depth, segments, radius
    // We build it manually using ExtrudeGeometry with a rounded rectangle shape
    const w = 1.5, h = 1.5, d = 0.3, r = 0.25;

    const shape = new T.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const extrudeSettings = {
        depth: d,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 4
    };

    const geometry = new T.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry (extrude goes from 0 to depth along z)
    geometry.center();

    // Generate proper UVs for front/back faces to display the texture
    const pos = geometry.attributes.position;
    const nor = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
        // Front and back faces (normal pointing mostly along z)
        if (Math.abs(nz) > 0.8) {
            const px = pos.getX(i);
            const py = pos.getY(i);
            uv.setXY(i, (px + w / 2) / w, (py + h / 2) / h);
        }
    }
    uv.needsUpdate = true;

    const sideMaterial = new T.MeshStandardMaterial({ color: 0x0077b5 }); // LinkedIn blue
    const faceMaterial = new T.MeshStandardMaterial({ map: linkedinTexture });

    // ExtrudeGeometry groups: 0 = front, 1 = back, 2 = sides/bevel
    const mesh = new T.Mesh(geometry, [faceMaterial, faceMaterial, sideMaterial]);
    return mesh;
}
