// Big title CSS3D element with interactive glow + letter-explode effects.
// Extracted from scene-setup.js so that file stays thin infrastructure.
import { scene } from '../core/scene-setup.js';

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
        setTimeout(() => { titleElement.innerText = originalText; }, 900);
    }

    function resetAll() {
        if (driftRAF) { cancelAnimationFrame(driftRAF); driftRAF = null; }
        if (exploded) {
            spans.forEach(span => {
                span.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1.2), opacity 0.5s ease';
                span.style.transform = 'translate(0, 0) rotate(0deg)';
                span.style.opacity = '1';
            });
            setTimeout(() => { titleElement.innerText = originalText; }, 900);
        }
        removeGlow();
        glowing = false;
        exploded = false;
        spans = [];
        drifts = [];
    }

    function scheduleReset() {
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { resetAll(); resetTimer = null; }, 5000);
    }

    titleElement.addEventListener('click', () => {
        if (!glowing && !exploded) {
            if (Math.random() < 0.5) { glowing = true; applyGlow(); }
            else                      { exploded = true; startExplode(); }
        } else if (glowing && !exploded) {
            exploded = true; startExplode();
        } else if (!glowing && exploded) {
            glowing = true; applyGlow();
        } else {
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

    /** Hot-swap displayed text without rebuilding the CSS3D object */
    bigTitleObject.updateText = function (newText) {
        originalText = newText;
        if (!exploded) titleElement.innerText = newText;
    };

    return bigTitleObject;
}
