// iframe-display.js — In-scene iframe overlay using CSS3DObject
// Shows a page inside the 3D scene without opening a new browser tab.
import { scene, camera } from '../core/scene-setup.js';

// --- Create the iframe element ---
const isMobile = window.innerWidth < 768;
const iframeEl = document.createElement('iframe');
iframeEl.style.width = isMobile ? '900px' : '1024px';
iframeEl.style.height = isMobile ? '1400px' : '768px';
iframeEl.style.border = 'none';
iframeEl.style.borderRadius = '10px';
iframeEl.style.background = '#fff';
iframeEl.style.backfaceVisibility = 'hidden';
iframeEl.style.willChange = 'transform';
iframeEl.style.opacity = '0';
iframeEl.style.pointerEvents = 'none'; // start with no interaction
iframeEl.style.overflowY = 'auto';
iframeEl.setAttribute('scrolling', 'yes');

// Allow scrolling inside the iframe on mobile
iframeEl.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
iframeEl.addEventListener('touchmove',  e => e.stopPropagation(), { passive: true });

// --- Wrap in a CSS3DObject and add to scene (hidden) ---
const cssObject = new window.THREE.CSS3DObject(iframeEl);
cssObject.scale.set(0.01, 0.01, 0.01);
cssObject.position.set(0, 0, 3);
cssObject.visible = false;
scene.add(cssObject);

// Adjust scale and size for mobile / orientation changes
function adjustIframeScale() {
    const mobile = window.innerWidth < 768;
    if (mobile) {
        // Larger scale so content is readable on mobile
        const scale = 0.008;
        cssObject.scale.set(scale, scale, scale);
        iframeEl.style.width = '900px';
        iframeEl.style.height = '1400px';
    } else {
        cssObject.scale.set(0.01, 0.01, 0.01);
        iframeEl.style.width = '1024px';
        iframeEl.style.height = '768px';
    }
}
window.addEventListener('resize', adjustIframeScale);
window.addEventListener('orientationchange', () => setTimeout(adjustIframeScale, 200));
adjustIframeScale();

let _isVisible = false;

/**
 * Show the in-scene iframe with the given URL.
 * @param {string} url — page to load
 */
export function showIframe(url) {
    iframeEl.src = url;
    cssObject.visible = true;
    _isVisible = true;
    iframeEl.style.pointerEvents = 'auto'; // allow interaction
    // On mobile, position iframe below the top-hanging geometry
    if (window.innerWidth < 768) {
        cssObject.position.set(0, -1, 3);
    } else {
        cssObject.position.set(0, 0, 3);
    }
    gsap.to(iframeEl, { opacity: 0.85, duration: 0.5 });
}

/**
 * Hide the in-scene iframe (fade out then hide).
 * @returns {Promise} resolves when fade-out is complete
 */
export function hideIframe() {
    if (!_isVisible) return Promise.resolve();
    _isVisible = false;
    iframeEl.style.pointerEvents = 'none'; // block interaction while fading
    return new Promise(resolve => {
        gsap.to(iframeEl, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                cssObject.visible = false;
                iframeEl.src = 'about:blank'; // free resources
                resolve();
            }
        });
    });
}

/** @returns {boolean} whether the iframe is currently displayed */
export function isIframeVisible() {
    return _isVisible;
}
