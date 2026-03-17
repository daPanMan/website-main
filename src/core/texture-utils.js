// Shared logo texture loader — canvas-based for cross-origin + background fill support.
// Results are cached by src so each image is fetched and decoded only once,
// even if multiple geometry factories call loadLogoTexture with the same path.

const _cache = new Map();

/**
 * Load a logo texture with an optional canvas background fill.
 * @param {string} src       - Image path or URL
 * @param {string} [bgColor='#ffffff'] - CSS fill color drawn behind the image
 * @returns {THREE.Texture}
 */
export function loadLogoTexture(src, bgColor = '#ffffff') {
    if (_cache.has(src)) return _cache.get(src);

    const T = window.THREE;
    const texture = new T.Texture();
    const img = new Image();

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        texture.image = canvas;
        texture.needsUpdate = true;
    };

    img.crossOrigin = 'anonymous';
    img.src = src;

    _cache.set(src, texture);
    return texture;
}
