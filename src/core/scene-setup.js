// Scene, camera, renderer, controls, lighting, resize handling
export const scene = new window.THREE.Scene();

// Mobile: orthographic camera for flat 2D-plane scrolling (no perspective distortion)
// Desktop: perspective camera for immersive 3D experience
function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    if (window.innerWidth < 768) {
        const frustumSize = 20; // visible height in world units
        const cam = new window.THREE.OrthographicCamera(
            -frustumSize * aspect / 2, frustumSize * aspect / 2,
            frustumSize / 2, -frustumSize / 2,
            0.1, 1000
        );
        cam.userData.frustumSize = frustumSize;
        return cam;
    }
    return new window.THREE.PerspectiveCamera(80, aspect, 0.1, 1000);
}
export const camera = createCamera();
export const renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: window.innerWidth > 768 });

// Set pixel ratio (cap at 2 for performance on high-DPI mobile screens)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// CSS3DRenderer for HTML-in-3D (titles, iframe overlay)
export const cssRenderer = new window.THREE.CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
Object.assign(cssRenderer.domElement.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    pointerEvents: 'none'
});

export function adjustCamera() {
    if (window.innerWidth < 768) {
        // Ortho camera — just set position, no FOV
        camera.position.set(0, 0, 24);
    } else {
        camera.fov = 80;
        camera.position.set(0, 0, 14);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
}
adjustCamera();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(cssRenderer.domElement);

// Prevent default touch gestures on the canvas (pull-to-refresh, scroll bounce)
// On mobile, allow pan-y so native scroll works
if (window.innerWidth < 768) {
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.position = 'fixed';
    cssRenderer.domElement.style.position = 'fixed';
    // Create scroll spacer for native vertical scroll
    const spacer = document.createElement('div');
    spacer.id = 'mobile-scroll-spacer';
    spacer.style.cssText = 'width:1px; pointer-events:none; height:350vh;';
    document.body.appendChild(spacer);
} else {
    renderer.domElement.style.touchAction = 'none';
}

export const controls = new window.THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.05,
  enableZoom: window.innerWidth >= 768, // disable pinch-zoom on mobile to prevent gesture conflicts
  zoomSpeed: 1.2,
  enableRotate: false,
  enablePan: false
});
// On mobile, disable OrbitControls entirely so it doesn't interfere with native scroll
if (window.innerWidth < 768) controls.enabled = false;

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    if (camera.isOrthographicCamera) {
        const aspect = window.innerWidth / window.innerHeight;
        const fs = camera.userData.frustumSize;
        camera.left   = -fs * aspect / 2;
        camera.right  =  fs * aspect / 2;
        camera.top    =  fs / 2;
        camera.bottom = -fs / 2;
    } else {
        camera.aspect = window.innerWidth / window.innerHeight;
    }
    camera.updateProjectionMatrix();
    adjustCamera();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

// Lighting
scene.add(new window.THREE.AmbientLight(0xffffff, 0.7));

export function addBigTitle(text) {
    const mobile = window.innerWidth < 768;
    const titleElement = Object.assign(document.createElement('div'), {
        className: 'big-title',
        innerText: text
    });
    Object.assign(titleElement.style, {
        position: 'absolute',
        color: 'white',
        fontSize: mobile ? '80px' : '132px',
        fontWeight: 'bold',
        textShadow: '0px 0px 10px rgba(255,255,255,0.8)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'text-shadow 0.3s ease, color 0.3s ease'
    });

    // --- Gimmick state ---
    let glowing = false;
    let exploded = false;
    let driftRAF = null;
    let resetTimer = null;
    let spans = [];
    let drifts = [];
    let originalText = text;

    const GLOW_SHADOW = [
        '0 0 20px rgba(100,160,255,1)',
        '0 0 40px rgba(80,140,255,0.9)',
        '0 0 80px rgba(60,120,255,0.7)',
        '0 0 120px rgba(40,100,255,0.5)',
        '0 0 160px rgba(20,80,255,0.3)'
    ].join(', ');
    const DEFAULT_SHADOW = '0px 0px 10px rgba(255,255,255,0.8)';

    function applyGlow() {
        titleElement.style.color = '#aaccff';
        titleElement.style.textShadow = GLOW_SHADOW;
    }

    function removeGlow() {
        titleElement.style.color = 'white';
        titleElement.style.textShadow = DEFAULT_SHADOW;
    }

    function splitIntoSpans() {
        titleElement.innerHTML = '';
        spans = [];
        for (const char of originalText) {
            if (char === '\n') {
                titleElement.appendChild(document.createElement('br'));
            } else {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.transition = 'none';
                span.style.position = 'relative';
                titleElement.appendChild(span);
                spans.push(span);
            }
        }
    }

    function startExplode() {
        splitIntoSpans();
        drifts = spans.map(() => ({
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 600,
            rot: (Math.random() - 0.5) * 720,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            vr: (Math.random() - 0.5) * 4
        }));

        requestAnimationFrame(() => {
            spans.forEach((span, i) => {
                span.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.4s ease';
                span.style.transform = `translate(${drifts[i].x}px, ${drifts[i].y}px) rotate(${drifts[i].rot}deg)`;
                span.style.opacity = '0.4';
            });
        });

        // Start continuous drift after initial fling
        setTimeout(() => {
            spans.forEach(span => { span.style.transition = 'none'; });
            function drift() {
                drifts.forEach((d, i) => {
                    d.x += d.vx;
                    d.y += d.vy;
                    d.rot += d.vr;
                    if (spans[i]) spans[i].style.transform = `translate(${d.x}px, ${d.y}px) rotate(${d.rot}deg)`;
                });
                driftRAF = requestAnimationFrame(drift);
            }
            driftRAF = requestAnimationFrame(drift);
        }, 700);
    }

    function stopExplode() {
        if (driftRAF) { cancelAnimationFrame(driftRAF); driftRAF = null; }
        spans.forEach(span => {
            span.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1.2), opacity 0.5s ease';
            span.style.transform = 'translate(0, 0) rotate(0deg)';
            span.style.opacity = '1';
        });
        // Restore plain text after return animation
        setTimeout(() => {
            titleElement.innerText = originalText;
        }, 900);
    }

    function resetAll() {
        if (driftRAF) { cancelAnimationFrame(driftRAF); driftRAF = null; }
        // Return letters if exploded
        if (exploded) {
            spans.forEach(span => {
                span.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1.2), opacity 0.5s ease';
                span.style.transform = 'translate(0, 0) rotate(0deg)';
                span.style.opacity = '1';
            });
            setTimeout(() => { titleElement.innerText = originalText; }, 900);
        }
        // Remove glow
        removeGlow();
        glowing = false;
        exploded = false;
        spans = [];
        drifts = [];
    }

    function scheduleReset() {
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            resetAll();
            resetTimer = null;
        }, 5000);
    }

    titleElement.addEventListener('click', () => {
        if (!glowing && !exploded) {
            // Nothing active — randomly pick one
            if (Math.random() < 0.5) {
                glowing = true;
                applyGlow();
            } else {
                exploded = true;
                startExplode();
            }
        } else if (glowing && !exploded) {
            // Glowing → layer explode on top (letters fly while glowing)
            exploded = true;
            startExplode();
        } else if (!glowing && exploded) {
            // Exploded → layer glow on top (letters glow while flying)
            glowing = true;
            applyGlow();
        } else {
            // Both active — reset early and start fresh
            if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
            resetAll();
            return;
        }
        scheduleReset();
    });

    const bigTitleObject = new window.THREE.CSS3DObject(titleElement);
    bigTitleObject.scale.set(0.01, 0.01, 0.01);
    bigTitleObject.position.set(0, 0, 0);
    scene.add(bigTitleObject);

    /** Hot-swap displayed text and the explode-reset target without rebuilding the object */
    bigTitleObject.updateText = function (newText) {
        originalText = newText;
        if (!exploded) {
            titleElement.innerText = newText;
        }
        // if currently exploded, new text will apply when the animation resets
    };

    return bigTitleObject;
}
