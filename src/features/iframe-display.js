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

// --- Helper: create a fresh iframe element ---
function createIframe() {
    const iframe = document.createElement('iframe');
    const isMobile = window.innerWidth < 768;
    Object.assign(iframe.style, {
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
    iframe.setAttribute('scrolling', 'yes');
    // allow features that Unity/games inside the iframe may need
    iframe.setAttribute('allow', 'autoplay; fullscreen; webgl; gamepad');

    // stop touch events from bubbling out of the iframe
    iframe.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    iframe.addEventListener('touchmove',  e => e.stopPropagation(), { passive: true });

    return iframe;
}

// maintain a reference to the *current* iframe element
let iframeEl = createIframe();
wrapper.appendChild(iframeEl);
document.body.appendChild(wrapper);

// Adjust size for mobile / orientation changes
function adjustIframeSize() {
    const mobile = window.innerWidth < 768;
    if (iframeEl) {
        iframeEl.style.width  = mobile ? '95vw' : '65vw';
        iframeEl.style.height = mobile ? '75vh' : '80vh';
    }
}
window.addEventListener('resize', adjustIframeSize);
window.addEventListener('orientationchange', () => setTimeout(adjustIframeSize, 200));

let _isVisible = false;
let _hidePromise = null; // track in-flight hide so show can wait for it

// Replace the existing iframe with a fresh one. Used when hiding
// (to ensure heavyweight pages like Unity are torn down) and also at
// the start of showIframe so we always start with a clean slate.
function replaceIframe() {
    if (iframeEl) {
        // if there is an existing iframe, remove it from DOM; loading
        // will be cancelled and all JS inside it is destroyed.
        if (iframeEl.parentNode) iframeEl.parentNode.removeChild(iframeEl);
    }
    iframeEl = createIframe();
    wrapper.appendChild(iframeEl);
}

/**
 * Show the overlay iframe with the given URL.
 * @param {string} url — page to load
 */
export function showIframe(url) {
    // Cancel any pending hide animation; we will show immediately.
    if (_hidePromise) {
        gsap.killTweensOf(wrapper);
        _hidePromise = null;
    }

    // Always recreate the iframe for a fresh context. This is especially
    // important after a Unity WebGL page has been shown because the engine
    // tends to hold onto the WebGL context and memory, which can interfere
    // with subsequent navigations.
    replaceIframe();

    iframeEl.src = url;
    wrapper.style.display = 'flex';
    _isVisible = true;
    // clear any leftover hide promise state
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

    // Cancel any running animation on the wrapper (fade-in or fade-out)
    gsap.killTweensOf(wrapper);

    // Immediately stop whatever the iframe is loading by clearing its src
    // and replacing the element. This ensures that heavy pages like the
    // Unity WebGL build are torn down without waiting for the fade animation.
    iframeEl.src = 'about:blank';
    replaceIframe();

    // Fade the wrapper out; the promise resolves once the fade completes.
    _hidePromise = new Promise(resolve => {
        gsap.to(wrapper, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                wrapper.style.display = 'none';
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
