// geometry/insta.js — Instagram flat rounded square with texture (like LinkedIn card)

// Module-level texture cache — loaded once, reused across factory calls
let _instaTexture = null;
function getInstaTexture() {
    if (_instaTexture) return _instaTexture;
    const T = window.THREE;
    _instaTexture = new T.Texture();
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        _instaTexture.image = canvas;
        _instaTexture.needsUpdate = true;
    };
    img.crossOrigin = 'anonymous';
    img.src = 'assets/textures/insta.png';
    return _instaTexture;
}

export function instaGeometry() {
    const T = window.THREE;
    const instaTexture = getInstaTexture();

    // Flat rounded square — same approach as LinkedIn geometry
    const w = 1.5, h = 1.5, d = 0.3, r = 0.5;

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
    geometry.center();

    // UV map front/back faces
    const pos = geometry.attributes.position;
    const nor = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const nz = nor.getZ(i);
        if (Math.abs(nz) > 0.8) {
            const px = pos.getX(i);
            const py = pos.getY(i);
            uv.setXY(i, (px + w / 2) / w, (py + h / 2) / h);
        }
    }
    uv.needsUpdate = true;

    const sideMaterial = new T.MeshStandardMaterial({ color: 0xc13584, roughness: 0.4 }); // Instagram gradient pink
    const faceMaterial = new T.MeshStandardMaterial({ map: instaTexture });

    // Rebuild groups per-triangle using true face normals from vertex positions
    geometry.clearGroups();
    const posA = geometry.attributes.position, idxA = geometry.index;
    const _v0 = new T.Vector3(), _v1 = new T.Vector3(), _v2 = new T.Vector3();
    const _e1 = new T.Vector3(), _e2 = new T.Vector3(), _fn = new T.Vector3();
    const triCount = idxA ? idxA.count / 3 : posA.count / 3;
    for (let t = 0; t < triCount; t++) {
        const a = idxA ? idxA.getX(t*3) : t*3, b = idxA ? idxA.getX(t*3+1) : t*3+1, c = idxA ? idxA.getX(t*3+2) : t*3+2;
        _v0.fromBufferAttribute(posA, a); _v1.fromBufferAttribute(posA, b); _v2.fromBufferAttribute(posA, c);
        _fn.crossVectors(_e1.subVectors(_v1, _v0), _e2.subVectors(_v2, _v0)).normalize();
        geometry.addGroup(t * 3, 3, Math.abs(_fn.z) > 0.5 ? 0 : 1);
    }

    const mesh = new T.Mesh(geometry, [faceMaterial, sideMaterial]);
    return mesh;
}
