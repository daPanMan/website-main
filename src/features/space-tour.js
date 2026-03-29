// Space Tour — cinematic 1st-person flythrough of the star field
// Features: warp-flash launch, star streaks (optimised), nebula Points,
//           comets, near-miss orbs, engine audio, speed bursts, gradual exit.

import { camera, controls } from '../core/scene-setup.js';
import { playSound, zoomOutSound, currentVolume, soundMuted } from './audio-controls.js';
import { scatterAllForTour, restoreAllFromTour } from '../geometry/cube-logic.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOUR_DURATION = 30;
const NUM_STREAKS   = 100;   // was 180 — each is still a Line but updates are cheaper now
const NUM_NEBULA    = 280;   // all in ONE Points draw call — basically free
const NUM_COMETS    = 7;
const TAIL_SEGS     = 12;

// ─── State ────────────────────────────────────────────────────────────────────
let tourActive        = false;
let tourTimeout       = null;
let countdownInterval = null;
let rafId             = null;
let tourStartTime     = 0;
let savedCamPos       = null;
let savedCamQuat      = null;
let _scene            = null;
let _reformTriggered  = false;

// ─── DOM helpers ──────────────────────────────────────────────────────────────
const getBtn  = () => document.getElementById('space-tour-btn');
const getBack = () => document.getElementById('space-tour-back');

let _posSpline = null;

function buildSplines() {
    const V3 = window.THREE.Vector3;

    // Procedural dampened-random-walk path
    // z: sine arc — 14 → -26 → 14 (outbound then return, always smooth)
    // x/y: small incremental drift with centre-pull so it never pendulums
    const STEPS = 18;
    const DEEP  = -26;
    const pts   = [];

    pts.push(new V3(0, 0, 14)); // home

    let x = 0, y = 0, ax = 0, ay = 0;
    for (let i = 1; i <= STEPS; i++) {
        const frac = i / STEPS;
        const z    = 14 + (DEEP - 14) * Math.sin(frac * Math.PI);

        const pull = 0.05 + Math.max(0, (frac - 0.5) * 0.25);
        ax += (Math.random() - 0.5) * 1.8;
        ay += (Math.random() - 0.5) * 1.2;
        ax -= x * pull; ay -= y * pull;
        ax *= 0.55; ay *= 0.55;
        x = Math.max(-18, Math.min(18, x + ax));
        y = Math.max(-12, Math.min(12, y + ay));

        pts.push(new V3(x, y, z));
    }

    pts.push(new V3(0, 0, 14)); // home
    _posSpline = new window.THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeT(raw) {
    if (raw < 0.08) return raw * raw / (0.08 * 0.08) * 0.08;
    if (raw > 0.88) return 1 - Math.pow((1 - raw) / 0.12, 2) * 0.12;
    return raw;
}

function speedCurve(t) {
    const b1 = Math.exp(-Math.pow((t - 0.12) / 0.07, 2));
    const b2 = Math.exp(-Math.pow((t - 0.55) / 0.10, 2)) * 0.7;
    return Math.min(1, b1 + b2);
}

// ─── Warp flash ───────────────────────────────────────────────────────────────
let _warpFlash = null;
function createWarpFlash() {
    const el = document.createElement('div');
    el.id = 'warp-flash';
    Object.assign(el.style, {
        position: 'fixed', inset: '0', background: 'white',
        opacity: '0', pointerEvents: 'none', zIndex: '9999', transition: 'none'
    });
    document.body.appendChild(el);
    return el;
}
function triggerWarpFlash(cb) {
    if (!_warpFlash) _warpFlash = createWarpFlash();
    gsap.killTweensOf(_warpFlash);
    gsap.fromTo(_warpFlash, { opacity: 0 }, {
        opacity: 0.22, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
            if (cb) cb();
            gsap.to(_warpFlash, { opacity: 0, duration: 0.5, ease: 'power2.out' });
        }
    });
}

// ─── Engine audio ─────────────────────────────────────────────────────────────
// Use RAF-based volume fade — GSAP tweening Audio.volume is unreliable across
// browsers and can leave audio playing after the tour ends.
const _tourAudio = new Audio('assets/audio/space-tour.wav');
_tourAudio.loop = true;

let _audioFadeRaf  = null;
let _audioTargetVol = 0;
let _audioFadeSpeed = 0;

function _audioFadeTick() {
    const diff = _audioTargetVol - _tourAudio.volume;
    if (Math.abs(diff) < 0.002) {
        _tourAudio.volume = _audioTargetVol;
        if (_audioTargetVol === 0) { _tourAudio.pause(); _tourAudio.currentTime = 0; }
        _audioFadeRaf = null;
        return;
    }
    _tourAudio.volume = Math.max(0, Math.min(1, _tourAudio.volume + diff * _audioFadeSpeed));
    _audioFadeRaf = requestAnimationFrame(_audioFadeTick);
}

function _startAudioFade(target, speed) {
    if (_audioFadeRaf) cancelAnimationFrame(_audioFadeRaf);
    _audioTargetVol  = Math.max(0, Math.min(1, target));
    _audioFadeSpeed  = speed; // fraction per frame, e.g. 0.04 = ~25 frames to converge
    _audioFadeRaf    = requestAnimationFrame(_audioFadeTick);
}

function startEngineAudio() {
    if (soundMuted) return;
    _tourAudio.volume      = 0;
    _tourAudio.currentTime = 0;
    const p = _tourAudio.play();
    if (p && p.catch) p.catch(() => {});
    _startAudioFade(currentVolume, 0.03);  // fade in over ~33 frames (~0.55s)
}

function stopEngineAudio(delayMs = 0) {
    // Delay allows the FX fade to start before audio drops
    setTimeout(() => _startAudioFade(0, 0.012), delayMs); // slow fade ~83 frames (~1.4s)
}

// ─── Star streaks (optimised) ─────────────────────────────────────────────────
// Each streak is a Line with a pre-allocated Float32Array buffer.
// We write directly into the attribute instead of calling setFromPoints()
// so no GC churn — just typed-array writes + needsUpdate flag.
const _streaks = [];

function _makeStreakLine() {
    const arr = new Float32Array(6); // 2 points × 3 floats
    arr[0] = 0; arr[1] = 0; arr[2] = 0;
    arr[3] = 0; arr[4] = 0; arr[5] = -1;
    const attr = new window.THREE.BufferAttribute(arr, 3);
    attr.setUsage(window.THREE.DynamicDrawUsage);
    const geo  = new window.THREE.BufferGeometry();
    geo.setAttribute('position', attr);
    const mat  = new window.THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 });
    return new window.THREE.Line(geo, mat);
}

function _resetStreakPos(line, initial) {
    const r     = Math.random() * 14 + 2;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(Math.random() * 2 - 1);
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = initial ? (-Math.random() * 28) : (camera.position.z - 4);
    let x = cx + r * Math.sin(phi) * Math.cos(theta);
    let y = cy + r * Math.sin(phi) * Math.sin(theta);
    let z = cz;
    const mag = Math.sqrt(x*x + y*y + z*z);
    if (mag > 34) { const s = 34 / mag; x *= s; y *= s; z *= s; }
    line.position.set(x, y, z);
}

function spawnStreaks() {
    for (let i = 0; i < NUM_STREAKS; i++) {
        const line = _makeStreakLine();
        _resetStreakPos(line, true);
        // Start invisible — opacity builds naturally with speed in updateStreaks
        line.material.opacity = 0;
        _scene.add(line);
        _streaks.push(line);
    }
}

// Reusable vector for streak movement direction (camera's forward in world space)
const _streakDir = new window.THREE.Vector3();

function updateStreaks(speed) {
    const len = 0.04 + speed * 2.2;
    const opa = 0.08 + speed * 0.75;

    // Camera's forward = -Z in camera space → world space
    _streakDir.set(0, 0, 1).applyQuaternion(camera.quaternion);

    const drift = 0.30 + speed * 2.0;
    _streaks.forEach(line => {
        // Move each streak toward the camera (opposite to forward = into the screen)
        line.position.addScaledVector(_streakDir, drift);

        // Recycle when it passes behind the camera (dot with forward > 8)
        const toCam = line.position.clone().sub(camera.position);
        if (toCam.dot(_streakDir) > 8) _resetStreakPos(line, false);

        const attr = line.geometry.attributes.position;
        attr.array[3] = 0;
        attr.array[4] = 0;
        attr.array[5] = len;
        attr.needsUpdate = true;
        line.material.opacity = opa;
    });
}

function fadeOutStreaks(duration) {
    _streaks.forEach(l => {
        gsap.to(l.material, { opacity: 0, duration, ease: 'power2.in' });
    });
    setTimeout(removeStreaks, duration * 1000 + 100);
}

function removeStreaks() {
    _streaks.forEach(l => {
        _scene?.remove(l);
        l.geometry.dispose();
        l.material.dispose();
    });
    _streaks.length = 0;
}

// ─── Nebula (single Points draw call — was 260 individual meshes) ─────────────
let _nebulaPoints = null;
let _nebulaPosArr = null;   // Float32Array, direct access
let _nebulaMeta   = [];     // per-particle speed/wobble

function spawnNebula() {
    _nebulaPosArr = new Float32Array(NUM_NEBULA * 3);
    _nebulaMeta   = [];

    for (let i = 0; i < NUM_NEBULA; i++) {
        _nebulaPosArr[i*3]   = (Math.random() - 0.5) * 54;
        _nebulaPosArr[i*3+1] = (Math.random() - 0.5) * 54;
        _nebulaPosArr[i*3+2] = -Math.random() * 30;
        _nebulaMeta.push({
            speed  : Math.random() * 0.14 + 0.05,
            wobbleX: (Math.random() - 0.5) * 0.003,
            wobbleY: (Math.random() - 0.5) * 0.003,
        });
    }

    const geo  = new window.THREE.BufferGeometry();
    const attr = new window.THREE.BufferAttribute(_nebulaPosArr, 3);
    attr.setUsage(window.THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);

    const mat = new window.THREE.PointsMaterial({
        color: 0xaaccff, size: 0.18, transparent: true, opacity: 0.7,
        sizeAttenuation: true
    });
    _nebulaPoints = new window.THREE.Points(geo, mat);
    _nebulaPoints.material.opacity = 0; // fade in gently
    _scene.add(_nebulaPoints);
    gsap.to(_nebulaPoints.material, { opacity: 0.7, duration: 2.0, ease: 'power2.out' });
}

function updateNebula(speed) {
    if (!_nebulaPoints) return;
    const burst = 1 + speed * 5;
    for (let i = 0; i < NUM_NEBULA; i++) {
        const m = _nebulaMeta[i];
        _nebulaPosArr[i*3]   += m.wobbleX;
        _nebulaPosArr[i*3+1] += m.wobbleY;
        _nebulaPosArr[i*3+2] += m.speed * burst;
        if (_nebulaPosArr[i*3+2] > 16) {
            _nebulaPosArr[i*3]   = (Math.random() - 0.5) * 54;
            _nebulaPosArr[i*3+1] = (Math.random() - 0.5) * 54;
            _nebulaPosArr[i*3+2] = -28 - Math.random() * 10;
        }
    }
    _nebulaPoints.geometry.attributes.position.needsUpdate = true;
}

function fadeOutNebula(duration) {
    if (!_nebulaPoints) return;
    gsap.to(_nebulaPoints.material, { opacity: 0, duration, ease: 'power2.in',
        onComplete: removeNebula });
}

function removeNebula() {
    if (!_nebulaPoints) return;
    _scene?.remove(_nebulaPoints);
    _nebulaPoints.geometry.dispose();
    _nebulaPoints.material.dispose();
    _nebulaPoints = null;
    _nebulaPosArr = null;
    _nebulaMeta   = [];
}

// ─── Comets ───────────────────────────────────────────────────────────────────
const _comets      = [];
const COMET_COLORS = [0xffffff, 0xaaddff, 0xffeebb, 0xccaaff, 0x88ffee, 0xffccaa];

function _randomVelocity() {
    const theta = Math.random() * Math.PI * 2;
    const phi   = (Math.random() - 0.5) * 0.5;
    const speed = 0.13 + Math.random() * 0.16;
    return new window.THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed,
        Math.sin(theta) * Math.cos(phi) * speed * 0.25
    );
}

function _randomSpawnPos(initial = false) {
    const angle = Math.random() * Math.PI * 2;
    const r     = 14 + Math.random() * 12;
    return new window.THREE.Vector3(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 16,
        initial ? (-Math.random() * 24) : (-4 - Math.random() * 20)
    );
}

function spawnComet(initial = false) {
    const color   = COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)];
    const tailLen = 2.5 + Math.random() * 3.0;

    const headGeo = new window.THREE.SphereGeometry(0.055, 6, 6);
    const headMat = new window.THREE.MeshBasicMaterial({ color });
    const head    = new window.THREE.Mesh(headGeo, headMat);

    // Pre-allocate tail buffer — direct writes, no setFromPoints in the hot path
    const tailArr  = new Float32Array((TAIL_SEGS + 1) * 3);
    const tailAttr = new window.THREE.BufferAttribute(tailArr, 3);
    tailAttr.setUsage(window.THREE.DynamicDrawUsage);
    const tailGeo = new window.THREE.BufferGeometry();
    tailGeo.setAttribute('position', tailAttr);
    const tailMat = new window.THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const tail    = new window.THREE.Line(tailGeo, tailMat);

    const vel = _randomVelocity();
    const pos = _randomSpawnPos(initial);
    head.position.copy(pos);

    // Init tail buffer
    for (let i = 0; i <= TAIL_SEGS; i++) {
        const t = i / TAIL_SEGS;
        tailArr[i*3]   = pos.x - vel.x * tailLen * t;
        tailArr[i*3+1] = pos.y - vel.y * tailLen * t;
        tailArr[i*3+2] = pos.z - vel.z * tailLen * t;
    }
    tailAttr.needsUpdate = true;

    // Fade head in gently — no pop-in
    headMat.transparent = true;
    headMat.opacity = 0;
    tailMat.opacity = 0;
    _scene.add(head);
    _scene.add(tail);
    const delay = Math.random() * 1.5;
    gsap.to(headMat, { opacity: 1,   duration: 1.0, delay, ease: 'power2.out' });
    gsap.to(tailMat, { opacity: 0.7, duration: 1.2, delay, ease: 'power2.out' });
    _comets.push({ head, tail, tailGeo, tailArr, tailAttr, vel, pos: pos.clone(), tailLen, dying: false });
}

function spawnComets() {
    for (let i = 0; i < NUM_COMETS; i++) spawnComet(true);
}

function updateComets() {
    _comets.forEach(c => {
        if (c.dying) return;
        c.pos.add(c.vel);
        c.head.position.copy(c.pos);

        // Write tail directly into Float32Array — no Vector3 allocation in the loop
        for (let i = 0; i <= TAIL_SEGS; i++) {
            const t = i / TAIL_SEGS;
            c.tailArr[i*3]   = c.pos.x - c.vel.x * c.tailLen * t;
            c.tailArr[i*3+1] = c.pos.y - c.vel.y * c.tailLen * t;
            c.tailArr[i*3+2] = c.pos.z - c.vel.z * c.tailLen * t;
        }
        c.tailAttr.needsUpdate = true;

        if (c.pos.length() > 32) {
            c.vel.copy(_randomVelocity());
            c.pos.copy(_randomSpawnPos(false));
            c.head.position.copy(c.pos);
        }
    });
}

function blastCometsAway(duration) {
    _comets.forEach(c => {
        c.dying = true;
        gsap.to(c.head.position, {
            x: c.pos.x + (Math.random() - 0.5) * 40,
            y: c.pos.y + (Math.random() - 0.5) * 30,
            z: c.pos.z - 15 - Math.random() * 15,
            duration, ease: 'power2.in'
        });
        gsap.to(c.head.material, { opacity: 0, duration: duration * 0.7 });
        gsap.to(c.tail.material, { opacity: 0, duration: duration * 0.5 });
    });
    setTimeout(removeComets, duration * 1000 + 100);
}

function removeComets() {
    _comets.forEach(c => {
        _scene?.remove(c.head);
        _scene?.remove(c.tail);
        c.head.geometry.dispose(); c.head.material.dispose();
        c.tailGeo.dispose();       c.tail.material.dispose();
    });
    _comets.length = 0;
}

// ─── Extra 3D space objects ───────────────────────────────────────────────────
// Asteroid rings, crystal shards, pulsing energy orbs, tumbling debris.
// All stored in _extras; updated in updateExtras(); removed in removeExtras().
const _extras = [];

// Placed positions — used to enforce minimum separation between extras
const _placedPositions = [];
const MIN_SEP = 7; // minimum world-unit distance between any two extras

function _safePos(zMin = -28, zMax = -6) {
    // Find a position that's inside the skybox AND far enough from all placed objects
    for (let attempt = 0; attempt < 40; attempt++) {
        const x = (Math.random() - 0.5) * 42;
        const y = (Math.random() - 0.5) * 32;
        const z = zMin + Math.random() * (zMax - zMin);
        if (Math.sqrt(x*x + y*y + z*z) > 33) continue; // outside skybox
        // Check separation from all already-placed objects
        const tooClose = _placedPositions.some(p => {
            const dx = p[0]-x, dy = p[1]-y, dz = p[2]-z;
            return Math.sqrt(dx*dx + dy*dy + dz*dz) < MIN_SEP;
        });
        if (!tooClose) {
            _placedPositions.push([x, y, z]);
            return [x, y, z];
        }
    }
    // Fallback: place at a deterministic offset from the last placed item
    const last = _placedPositions[_placedPositions.length - 1] || [0, 0, zMin];
    const pos  = [last[0] + MIN_SEP * (Math.random() > 0.5 ? 1 : -1), last[1] + MIN_SEP * 0.5, zMin + Math.random() * (zMax - zMin)];
    _placedPositions.push(pos);
    return pos;
}

// Helper: build a ship part mesh and add to group
// rot = [rx,ry,rz] optional Euler rotation of the part
function _shipPart(group, geo, color, opacity, pos, rot) {
    const mat  = new window.THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
    mat._targetOpacity = opacity;
    const mesh = new window.THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    group.add(mesh);
}

// Helper: fade in a mesh material after a delay
function _fadeIn(mat, targetOpacity, duration, delay) {
    mat.transparent = true;
    mat.opacity = 0;
    gsap.to(mat, { opacity: targetOpacity, duration, delay, ease: 'power2.out' });
}

// Helper: add all meshes in a group to _extras and scene, with fade-in
function _addGroup(group, userData, delay) {
    group.userData = userData;
    group.traverse(c => {
        if (c.isMesh) _fadeIn(c.material, c.material._targetOpacity ?? 0.9, 2.0, delay);
    });
    _scene.add(group);
    _extras.push(group);
}

function spawnExtras() {
    const T3  = window.THREE;
    let   idx = 0; // stagger counter
    _placedPositions.length = 0; // reset separation tracking each tour

    // ── 1. UFO saucers ────────────────────────────────────────────────────────
    // Flat squished sphere body + torus rim + tiny dome on top
    for (let i = 0; i < 3; i++) {
        const group   = new T3.Group();
        const bodyGeo = new T3.SphereGeometry(0.7, 10, 6);
        const bodyMat = new T3.MeshBasicMaterial({ color: 0x99bbdd });
        bodyMat._targetOpacity = 0.85;
        const body    = new T3.Mesh(bodyGeo, bodyMat);
        body.scale.y  = 0.3; // squish into saucer shape
        group.add(body);

        const rimGeo  = new T3.TorusGeometry(0.75, 0.12, 5, 20);
        const rimMat  = new T3.MeshBasicMaterial({ color: 0x77aacc });
        rimMat._targetOpacity = 0.9;
        const rim     = new T3.Mesh(rimGeo, rimMat);
        rim.rotation.x = Math.PI / 2;
        group.add(rim);

        const domeGeo = new T3.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new T3.MeshBasicMaterial({ color: 0xcceeff, transparent: true });
        domeMat._targetOpacity = 0.5;
        const dome    = new T3.Mesh(domeGeo, domeMat);
        dome.position.y = 0.18;
        group.add(dome);

        group.position.set(..._safePos(-22, -6));
        _addGroup(group, {
            type: 'ufo',
            ry: 0.012 + Math.random() * 0.008,
            hoverSpeed: 0.018 + Math.random() * 0.012,
            hoverPhase: Math.random() * Math.PI * 2,
            baseY: group.position.y,
        }, idx * 0.3);
        idx++;
    }

    // ── 3. Spaceships — 7 ships, each flying in the direction they're pointing ──
    // Ships are built nose-up (+Y) in local space. In updateExtras we use
    // lookAt so the group's +Y faces the velocity direction, then apply
    // a lean/bank angle so they tilt into turns naturally.
    const shipDefs = [
        // Fighter: sleek cone + slim body + swept delta wings
        (col) => {
            const g = new T3.Group();
            _shipPart(g, new T3.CylinderGeometry(0.08, 0.18, 1.1, 7), col, 0.9, [0,0,0]);
            _shipPart(g, new T3.ConeGeometry(0.08, 0.5, 7),            col, 0.9, [0, 0.8, 0]);
            [-1,1].forEach(s => {
                _shipPart(g, new T3.BoxGeometry(1.0, 0.03, 0.42), col, 0.85, [s*0.55,-0.2,-0.08], [0,0,s*0.22]);
            });
            return g;
        },
        // Cruiser: wide body + blunt nose + box engine nacelles
        (col) => {
            const g = new T3.Group();
            _shipPart(g, new T3.CylinderGeometry(0.28, 0.32, 1.2, 8), col, 0.9, [0,0,0]);
            _shipPart(g, new T3.SphereGeometry(0.28, 8, 6),            col, 0.9, [0, 0.6, 0]);
            [-1,1].forEach(s => {
                _shipPart(g, new T3.CylinderGeometry(0.09,0.09,0.9,6), col, 0.8, [s*0.45,-0.1,0]);
                _shipPart(g, new T3.ConeGeometry(0.09,0.25,6),         col, 0.8, [s*0.45, 0.62,0]);
            });
            return g;
        },
        // Wedge: flat triangular profile — box hull + angled nose
        (col) => {
            const g = new T3.Group();
            _shipPart(g, new T3.BoxGeometry(0.7, 0.18, 0.9),  col, 0.9, [0,0,0]);
            _shipPart(g, new T3.ConeGeometry(0.12, 0.6, 4),   col, 0.9, [0, 0.39, 0], [0,Math.PI/4,0]);
            [-1,1].forEach(s => {
                _shipPart(g, new T3.BoxGeometry(0.35, 0.06, 0.55), col, 0.8, [s*0.52, -0.04, 0.1], [0,0,s*0.15]);
            });
            return g;
        },
        // Heavy bomber: thick cylinder + flat wings + rear engine pod
        (col) => {
            const g = new T3.Group();
            _shipPart(g, new T3.CylinderGeometry(0.22, 0.22, 1.4, 8), col, 0.9, [0,0,0]);
            _shipPart(g, new T3.ConeGeometry(0.22, 0.4, 8),            col, 0.9, [0, 0.9, 0]);
            [-1,1].forEach(s => {
                _shipPart(g, new T3.BoxGeometry(1.2, 0.05, 0.35), col, 0.8, [s*0.7, 0.1, 0], [0,0,s*0.1]);
                _shipPart(g, new T3.CylinderGeometry(0.07,0.1,0.4,6), col, 0.75, [s*0.7,-0.55,0]);
            });
            return g;
        },
    ];

    const shipColors = [0x5577aa, 0xaa6644, 0x44aa88, 0x887733, 0x774488, 0x448866, 0x667799];
    for (let i = 0; i < 7; i++) {
        const col     = shipColors[i % shipColors.length];
        const factory = shipDefs[i % shipDefs.length];
        const group   = factory(col);

        const spd   = 0.06 + Math.random() * 0.08;
        // Random flight direction — mostly lateral/diagonal, not straight at camera
        const theta = Math.random() * Math.PI * 2;
        const phi   = (Math.random() - 0.5) * 0.7;
        const vel   = new T3.Vector3(
            Math.cos(theta) * Math.cos(phi) * spd,
            Math.sin(phi) * spd,
            Math.sin(theta) * Math.cos(phi) * spd * 0.5
        );

        group.position.set(..._safePos(-26, -6));

        // Orient nose along initial velocity
        const _aim = new T3.Object3D();
        _aim.position.copy(group.position).add(vel);
        group.lookAt(_aim.position);

        _addGroup(group, {
            type    : 'ship',
            vel,
            prevVel : vel.clone(),
            bank    : 0,          // current bank/roll angle
        }, idx * 0.2);
        idx++;
    }

    // ── 4. Space stations (cross of cylinders + solar panel boxes) ────────────
    for (let i = 0; i < 2; i++) {
        const group  = new T3.Group();
        const hubGeo = new T3.SphereGeometry(0.35, 8, 8);
        const hubMat = new T3.MeshBasicMaterial({ color: 0x889999 });
        hubMat._targetOpacity = 0.9;
        group.add(new T3.Mesh(hubGeo, hubMat));

        // Cross arms
        [[1,0,0],[0,1,0],[0,0,1]].forEach(axis => {
            const armGeo = new T3.CylinderGeometry(0.06, 0.06, 1.8, 6);
            const armMat = new T3.MeshBasicMaterial({ color: 0x778888 });
            armMat._targetOpacity = 0.85;
            const arm    = new T3.Mesh(armGeo, armMat);
            if (axis[0]) arm.rotation.z = Math.PI / 2;
            if (axis[2]) arm.rotation.x = Math.PI / 2;
            group.add(arm);
        });

        // Solar panels (flat boxes on the ends of X arms)
        [-1, 1].forEach(side => {
            const panGeo = new T3.BoxGeometry(0.55, 0.04, 0.3);
            const panMat = new T3.MeshBasicMaterial({ color: 0x2255aa });
            panMat._targetOpacity = 0.8;
            const pan    = new T3.Mesh(panGeo, panMat);
            pan.position.x = side * 1.1;
            group.add(pan);
        });

        group.position.set(..._safePos(-24, -10));
        group.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.4);
        _addGroup(group, { type: 'station', rx: 0.002, ry: 0.003, rz: 0.001 }, idx * 0.3);
        idx++;
    }

    // ── 5. Satellites ─────────────────────────────────────────────────────────
    for (let i = 0; i < 4; i++) {
        const group  = new T3.Group();
        const bodyGeo = new T3.BoxGeometry(0.2, 0.2, 0.35);
        const bodyMat = new T3.MeshBasicMaterial({ color: 0x999988 });
        bodyMat._targetOpacity = 0.9;
        group.add(new T3.Mesh(bodyGeo, bodyMat));

        // Dish (partial torus)
        const dishGeo = new T3.TorusGeometry(0.18, 0.03, 5, 16, Math.PI);
        const dishMat = new T3.MeshBasicMaterial({ color: 0xccccaa });
        dishMat._targetOpacity = 0.85;
        const dish    = new T3.Mesh(dishGeo, dishMat);
        dish.position.set(0, 0.22, 0);
        dish.rotation.x = -Math.PI / 4;
        group.add(dish);

        // Solar wings
        [-1, 1].forEach(side => {
            const wingGeo = new T3.BoxGeometry(0.5, 0.04, 0.18);
            const wingMat = new T3.MeshBasicMaterial({ color: 0x2244aa });
            wingMat._targetOpacity = 0.8;
            const wing    = new T3.Mesh(wingGeo, wingMat);
            wing.position.x = side * 0.35;
            group.add(wing);
        });

        group.position.set(..._safePos(-18, -5));
        group.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*0.5);
        _addGroup(group, {
            type: 'satellite',
            rx: (Math.random()-0.5)*0.010,
            ry: (Math.random()-0.5)*0.014,
            rz: (Math.random()-0.5)*0.008,
        }, idx * 0.25);
        idx++;
    }
}

let _extraTick = 0;
function updateExtras() {
    _extraTick++;
    _extras.forEach(g => {
        const d = g.userData;

        // Non-ship types still tumble on their own axes
        if (d.type !== 'ship' && d.type !== 'ufo') {
            g.rotation.x += d.rx || 0;
            g.rotation.y += d.ry || 0;
            g.rotation.z += d.rz || 0;
        }

        // UFOs hover up and down + spin
        if (d.type === 'ufo') {
            g.rotation.y += d.ry;
            g.position.y  = d.baseY + Math.sin(_extraTick * d.hoverSpeed + d.hoverPhase) * 0.4;
        }

        // Ships fly in the direction they're pointing, loop around the safe zone
        if (d.type === 'ship') {
            const v = d.vel;

            // Gently curve the trajectory over time for organic flight arcs
            v.x += (Math.random() - 0.5) * 0.0015;
            v.y += (Math.random() - 0.5) * 0.0010;
            // Clamp speed so curves don't accelerate forever
            const spd = v.length();
            if (spd > 0.15) v.multiplyScalar(0.14 / spd);
            if (spd < 0.04) v.multiplyScalar(0.05 / spd);

            g.position.add(v);

            // Wrap around safe zone (teleport to opposite side — no bounce snap)
            if (g.position.x >  28) g.position.x = -28;
            if (g.position.x < -28) g.position.x =  28;
            if (g.position.y >  22) g.position.y = -22;
            if (g.position.y < -22) g.position.y =  22;
            if (g.position.z >  -3) g.position.z = -28;
            if (g.position.z < -30) g.position.z =  -4;

            // Point nose along velocity using lookAt
            const _tgt = g.position.clone().add(v);
            g.lookAt(_tgt);

            // Bank into turns — measure how much direction changed laterally
            const lateralDelta = v.x - d.prevVel.x;
            d.bank = d.bank * 0.88 + lateralDelta * 18; // accumulate, dampen
            d.bank = Math.max(-0.55, Math.min(0.55, d.bank));
            g.rotateY(d.bank * 0.4); // lean into the turn
            d.prevVel.copy(v);
        }
    });
}

function fadeOutExtras(duration) {
    _extras.forEach(g => {
        g.traverse(c => {
            if (c.isMesh && c.material) {
                gsap.to(c.material, { opacity: 0, duration, ease: 'power2.in' });
            }
        });
    });
    setTimeout(removeExtras, duration * 1000 + 200);
}

function removeExtras() {
    _extras.forEach(g => {
        _scene?.remove(g);
        g.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
    });
    _extras.length = 0;
    _placedPositions.length = 0;
}

// ─── Near-miss orbs ───────────────────────────────────────────────────────────
const _orbs = [];
const ORB_DATA = [
    { pos: [ 12,  2, -24], color: 0x3355ff, r: 3.5 },
    { pos: [-10, -4, -28], color: 0xff3344, r: 2.8 },
    { pos: [-14, 10, -22], color: 0xffaa00, r: 4.0 },
    { pos: [ 16, -6, -20], color: 0x44ffaa, r: 2.2 },
    { pos: [  4, 16, -26], color: 0xcc44ff, r: 3.0 },
    { pos: [-18,  2, -14], color: 0xff6600, r: 2.5 },
    { pos: [  8, -16,-18], color: 0x88ddff, r: 2.0 },
];

function spawnOrbs() {
    ORB_DATA.forEach((d, i) => {
        const geo  = new window.THREE.SphereGeometry(d.r, 10, 10);
        const mat  = new window.THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0 });
        const mesh = new window.THREE.Mesh(geo, mat);
        mesh.position.set(...d.pos);
        const glowGeo = new window.THREE.SphereGeometry(d.r * 1.5, 8, 8);
        const glowMat = new window.THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0, side: window.THREE.BackSide });
        const glow = new window.THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);
        _scene.add(mesh);
        _orbs.push(mesh);
        // Staggered fade-in so they materialise gradually
        gsap.to(mat,     { opacity: 0.18, duration: 1.5, delay: i * 0.15, ease: 'power2.out' });
        gsap.to(glowMat, { opacity: 0.06, duration: 1.5, delay: i * 0.15, ease: 'power2.out' });
    });
}

function fadeOutOrbs(duration) {
    _orbs.forEach(o => {
        o.traverse(c => {
            if (c.material) gsap.to(c.material, { opacity: 0, duration, ease: 'power2.in' });
        });
    });
    setTimeout(removeOrbs, duration * 1000 + 100);
}

function removeOrbs() {
    _orbs.forEach(o => {
        _scene?.remove(o);
        o.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
    });
    _orbs.length = 0;
}

// ─── FOV warp (gated) ─────────────────────────────────────────────────────────
let _baseFov  = 80;
let _lastFov  = 80;
function applyFovWarp(speed) {
    if (!camera.isPerspectiveCamera) return;
    const targetFov = _baseFov + speed * 32;
    camera.fov += (targetFov - camera.fov) * 0.07;
    // Only rebuild projection matrix when FOV changed more than 0.05°
    if (Math.abs(camera.fov - _lastFov) > 0.05) {
        camera.updateProjectionMatrix();
        _lastFov = camera.fov;
    }
}

// ─── Camera velocity (world-space, updated each tick) ─────────────────────────
const _camVel   = new window.THREE.Vector3 ? new window.THREE.Vector3() : null;
let   _prevCamPos = null;
let   _camRoll    = 0;

// ─── Main animation tick ──────────────────────────────────────────────────────
function tourTick() {
    if (!tourActive) return;

    const elapsed = (Date.now() - tourStartTime) / 1000;
    const rawT    = Math.min(elapsed / TOUR_DURATION, 1);
    const t       = easeT(rawT);
    const speed   = speedCurve(rawT);

    // Sample current position
    const pos = _posSpline.getPoint(t);

    // Look-ahead: sample slightly ahead on the SAME spline so camera always
    // faces where it is going, not a separate (wrong) target
    const LOOK_DELTA = 0.025;
    const lookAhead  = _posSpline.getPoint(Math.min(t + LOOK_DELTA, 1.0));

    camera.position.copy(pos);
    camera.lookAt(lookAhead);

    // Track world-space velocity for streaks + roll
    if (_prevCamPos) {
        _camVel.subVectors(pos, _prevCamPos);
    } else {
        _camVel.set(0, 0, 0);
    }
    _prevCamPos = pos.clone();

    // Camera roll — driven by lateral velocity in camera's own right vector
    const rightVel = _camVel.dot(
        new window.THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    );
    _camRoll += rightVel * 1.2;
    _camRoll *= 0.88;
    _camRoll  = Math.max(-0.45, Math.min(0.45, _camRoll));
    camera.rotation.z = _camRoll;

    applyFovWarp(speed);
    modulateEngine(speed);
    updateStreaks(speed);
    updateNebula(speed);
    updateComets();
    updateExtras();

    // At 72% through, slowly reform cubes over ~6s
    if (rawT >= 0.72 && !_reformTriggered) {
        _reformTriggered = true;
        restoreAllFromTour(5.5);
    }

    rafId = requestAnimationFrame(tourTick);
}

function modulateEngine(_s) { /* volume-only, no pitch mod */ }

// ─── Gradual closing sequence ─────────────────────────────────────────────────
// Called by endTour — fades all effects out over ~EXIT_DUR seconds before
// the camera starts gliding home, so nothing pops out suddenly.
const EXIT_FX_DUR  = 2.2;  // how long tour FX fade out
const EXIT_CAM_DUR = 2.8;  // how long camera glides home
const EXIT_CAM_DELAY = 1.0; // pause between fx fade and cam move (overlap at the end)

function runExitSequence() {
    // 1. Fade all tour FX out smoothly
    fadeOutStreaks(EXIT_FX_DUR);
    fadeOutNebula(EXIT_FX_DUR);
    fadeOutOrbs(EXIT_FX_DUR);
    blastCometsAway(EXIT_FX_DUR * 0.9);
    fadeOutExtras(EXIT_FX_DUR);
    // Start audio fade after FX are well underway — sounds like the engine winding down
    stopEngineAudio(EXIT_FX_DUR * 400); // delay in ms = ~40% into the fx fade

    // 2. FOV eases back over the full exit window — not rushed
    gsap.to({ fov: camera.fov }, {
        fov: _baseFov,
        duration: EXIT_FX_DUR + EXIT_CAM_DELAY + EXIT_CAM_DUR * 0.6,
        ease: 'power1.inOut',
        onUpdate: function() {
            camera.fov = this.targets()[0].fov;
            camera.updateProjectionMatrix();
        }
    });

    // 3. Camera roll eases to 0 before cam starts moving
    gsap.to({ roll: _camRoll }, {
        roll: 0,
        duration: EXIT_FX_DUR + EXIT_CAM_DELAY,
        ease: 'power2.out',
        onUpdate: function() { camera.rotation.z = this.targets()[0].roll; }
    });

    // 4. Glide camera home — starts after a short overlap with the FX fade
    setTimeout(() => {
        playSound(zoomOutSound);

        // Capture current look direction so we can slerp smoothly to origin
        const startQuat = camera.quaternion.clone();
        const endCam    = savedCamPos.clone();

        // Dummy target to interpolate quaternion toward looking at origin
        const _tmpCam = new window.THREE.Object3D();
        _tmpCam.position.copy(camera.position);
        _tmpCam.lookAt(0, 0, 0);
        const endQuat = _tmpCam.quaternion.clone();

        const proxy = { t: 0 };
        gsap.to(proxy, {
            t: 1,
            duration: EXIT_CAM_DUR,
            ease: 'power2.inOut',
            onUpdate: function() {
                const p = proxy.t;
                // Smooth position lerp
                camera.position.lerpVectors(
                    camera.position, // NOTE: we update in-place so use separate stored values
                    endCam, 0.04    // gentle pull each frame
                );
                // Slerp rotation — no snap
                window.THREE.Quaternion.slerp(startQuat, endQuat, camera.quaternion, p);
            },
            onComplete: () => {
                // Snap only position at the very end (imperceptible at this point)
                camera.position.copy(savedCamPos);
                camera.lookAt(0, 0, 0);
                camera.rotation.z = 0;
                controls.enabled  = window.innerWidth >= 768;
                if (!_reformTriggered) restoreAllFromTour(1.4);
            }
        });
    }, EXIT_CAM_DELAY * 1000);
}

// ─── Start ────────────────────────────────────────────────────────────────────
export function startTour(scene) {
    if (tourActive) return;

    _scene           = scene;
    tourActive       = true;
    window.spaceTourActive = true;
    tourStartTime    = Date.now();
    _baseFov         = camera.fov || 80;
    _lastFov         = _baseFov;
    _camRoll         = 0;
    _prevCamPos      = null;
    _reformTriggered = false;

    buildSplines();
    savedCamPos  = camera.position.clone();
    savedCamQuat = camera.quaternion.clone();
    controls.enabled = false;

    triggerWarpFlash(() => {
        scatterAllForTour();
        spawnStreaks();
        spawnNebula();
        spawnOrbs();
        spawnComets();
        spawnExtras();
        startEngineAudio();
        rafId = requestAnimationFrame(tourTick);
    });

    const btn  = getBtn();
    if (btn)  { btn.textContent = `${TOUR_DURATION}s`; btn.classList.add('tour-active'); }
    const back = getBack();
    if (back) back.style.display = 'block';

    updateCountdown(TOUR_DURATION);
    countdownInterval = setInterval(() => {
        const rem = Math.max(0, TOUR_DURATION - Math.floor((Date.now() - tourStartTime) / 1000));
        updateCountdown(rem);
    }, 500);

    tourTimeout = setTimeout(endTour, TOUR_DURATION * 1000);
}

// ─── End ──────────────────────────────────────────────────────────────────────
export function endTour() {
    if (!tourActive) return;
    tourActive = false;

    clearTimeout(tourTimeout);        tourTimeout        = null;
    clearInterval(countdownInterval); countdownInterval  = null;
    cancelAnimationFrame(rafId);      rafId              = null;
    window.spaceTourActive = false;

    // UI — hide back button immediately
    const back = getBack();
    if (back) back.style.display = 'none';
    const btn  = getBtn();
    if (btn)  { btn.style.display = 'flex'; btn.textContent = '🛸'; btn.classList.remove('tour-active'); }

    // Gradual exit — fades everything, then glides camera home
    runExitSequence();
}

function updateCountdown(seconds) {
    const btn = getBtn();
    if (btn) btn.textContent = `${seconds}s`;
}

// ─── Keep tour audio in sync with mute toggle ─────────────────────────────────
window.addEventListener('mutetoggle', (e) => {
    if (e.detail.muted) {
        if (_audioFadeRaf) { cancelAnimationFrame(_audioFadeRaf); _audioFadeRaf = null; }
        _tourAudio.pause();
    } else if (tourActive) {
        _tourAudio.volume = 0;
        const p = _tourAudio.play();
        if (p && p.catch) p.catch(() => {});
        _startAudioFade(currentVolume, 0.05);
    }
});

// ─── Show rocket button after intro ───────────────────────────────────────────
export function showSpaceTourBtn() {
    const btn = getBtn();
    if (btn) btn.style.display = 'flex';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initSpaceTour(scene) {
    const btn  = getBtn();
    const back = getBack();
    if (!btn || !back) return;

    const onLaunch = (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); if (!tourActive) startTour(scene); };
    const onExit   = (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); endTour(); };

    btn.addEventListener('click',       onLaunch);
    btn.addEventListener('touchstart',  onLaunch, { passive: false });
    back.addEventListener('click',      onExit);
    back.addEventListener('touchstart', onExit,   { passive: false });
}
