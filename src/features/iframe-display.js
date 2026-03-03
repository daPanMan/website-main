// iframe-display.js — Plain DOM overlay iframe (no CSS3D transforms).
// Switched from CSS3DObject to a regular fixed-position overlay so that
// WebGL content inside the iframe (e.g. Unity) isn't broken by per-frame
// CSS3D matrix transforms applied by CSS3DRenderer.

// --- Create a wrapper div (for positioning/fading) ---
const wrapper = document.createElement('div');
Object.assign(wrapper.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'none',          // hidden by default
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000',            // above both renderers
    pointerEvents: 'none',
    opacity: '0'
});

// --- Create the iframe element ---
const iframeEl = document.createElement('iframe');
const isMobile = window.innerWidth < 768;
Object.assign(iframeEl.style, {
    width:  isMobile ? '95vw' : '65vw',
    height: isMobile ? '75vh' : '80vh',
    maxWidth: '900px',
    maxHeight: '850px',
    border: 'none',
    borderRadius: '10px',
    background: '#fff',
    opacity: '0.95',
    pointerEvents: 'auto'      // clicks pass to iframe, not wrapper
});
iframeEl.setAttribute('scrolling', 'yes');
// Allow features that Unity/games inside the iframe may need
iframeEl.setAttribute('allow', 'autoplay; fullscreen; webgl; gamepad');

// Allow scrolling inside the iframe on mobile
iframeEl.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
iframeEl.addEventListener('touchmove',  e => e.stopPropagation(), { passive: true });

wrapper.appendChild(iframeEl);
document.body.appendChild(wrapper);

// Adjust size for mobile / orientation changes
function adjustIframeSize() {
    const mobile = window.innerWidth < 768;
    iframeEl.style.width  = mobile ? '95vw' : '65vw';
    iframeEl.style.height = mobile ? '75vh' : '80vh';
}
window.addEventListener('resize', adjustIframeSize);
window.addEventListener('orientationchange', () => setTimeout(adjustIframeSize, 200));

let _isVisible = false;
let _hidePromise = null; // track in-flight hide so show can wait for it

/**
 * Show the overlay iframe with the given URL.
 * @param {string} url — page to load
 */
export function showIframe(url) {
    // Kill any in-flight tweens so we start from a clean state
    gsap.killTweensOf(wrapper);

    iframeEl.src = url;
    wrapper.style.display = 'flex';
    _isVisible = true;
    _hidePromise = null;

    // On mobile, shift iframe towards top so the hanging geometry stays visible
    if (window.innerWidth < 768) {
        wrapper.style.alignItems = 'flex-start';
        wrapper.style.paddingTop = '15vh';
    } else {
        wrapper.style.alignItems = 'center';
        wrapper.style.paddingTop = '0';
    }

    // Fade in
    wrapper.style.opacity = '0';
    gsap.to(wrapper, { opacity: 1, duration: 0.5 });
}

/**
 * Hide the overlay iframe (fade out then hide).
 * @returns {Promise} resolves when fade-out is complete
 */
export function hideIframe() {
    if (!_isVisible) return Promise.resolve();
    _isVisible = false;

    // Kill any in-flight tweens to prevent conflicts
    gsap.killTweensOf(wrapper);

    _hidePromise = new Promise(resolve => {
        gsap.to(wrapper, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                wrapper.style.display = 'none';
                iframeEl.src = 'about:blank'; // free resources
                _hidePromise = null;
                resolve();
            }
        });
    });
    return _hidePromise;
}

/** @returns {boolean} whether the iframe is currently displayed */
export function isIframeVisible() {
    return _isVisible;
}
