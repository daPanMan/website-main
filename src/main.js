// Main entry point for the website
import { scene, camera, renderer, controls } from './core/scene-setup.js';
import { addBigTitle } from './features/big-title.js';
import { playSound, bgm, zoomInSound, zoomOutSound } from './features/audio-controls.js';
import { setupCubes, titleObjects, cubes, subObjects, subTitles, expandedParent, reloadSubItems } from './geometry/cube-logic.js';
import { starField, createStars } from './geometry/background-stars.js';
import { animate } from './core/animation-loop.js';
import { gamepad } from './geometry/gamepad.js';
import { linkedInGeometry } from './geometry/linkedin.js';
import { mainPageGeometry } from './geometry/mainpage.js';
import { emailGeometry } from './geometry/email.js';
import { gmailGeometry } from './geometry/gmail.js';
import { instaGeometry } from './geometry/insta.js';
import { snapGeometry } from './geometry/snap.js';
import { wechatGeometry } from './geometry/wechat.js';
import { xiaohongshuGeometry } from './geometry/xiaohongshu.js';
import { pongBall } from './geometry/pong.js';
import { pigGameDice } from './geometry/pig-game.js';
import { miniGameCube } from './geometry/mini-game.js';
import { snakeGeometry } from './geometry/snake.js';
import { tictactoeGeometry } from './geometry/tictactoe.js';
import { euchreGeometry } from './geometry/euchre.js';
import { combatSimulatorGeometry } from './geometry/combat-simulator.js';
import { guessNumberGeometry } from './geometry/guess-number.js';
import { recordGeometry } from './geometry/record.js';
import { projectsGeometry } from './geometry/projects.js';
import { chefHatGeometry } from './geometry/chef-hat.js';
import { t } from './i18n.js';
import './ui-intro.js';

// Setup big title
const bigTitle = addBigTitle(t('bigTitle'));
window.bigTitle = bigTitle;

// Setup interactive 3D objects
// _labelKey / _titleKey store the i18n keys so the langchange handler can
// retranslate everything in-place without a page reload.
const cubeSpecs = [
    {
        _labelKey: 'aboutMe',
        type: mainPageGeometry(), label: t('aboutMe'), url: './about.html',
        userData: { title: t('aboutMe'), _titleKey: 'aboutMe' }
    },
    {
        _labelKey: 'contactMe',
        type: emailGeometry(), label: t('contactMe'), url: './pages/email.html',
        userData: { title: t('contactMe'), _titleKey: 'contactMe' },
        subItems: [
            { _labelKey: 'linkedin',  _titleKey: 'linkedin',  factory: () => linkedInGeometry(), label: t('linkedin'),   title: t('linkedin'),   url: './pages/linkedin.html' },
            { _labelKey: 'email',     _titleKey: 'email',     factory: () => gmailGeometry(),    label: t('email'),      title: t('email'),      url: './pages/email.html' },
            { _labelKey: 'instagram',   _titleKey: 'instagram',   factory: () => instaGeometry(),        label: t('instagram'),    title: t('instagram'),    url: './pages/insta.html' },
            { _labelKey: 'snapchat',    _titleKey: 'snapchat',    factory: () => snapGeometry(),         label: t('snapchat'),     title: t('snapchat'),     url: './pages/snap.html',     langOnly: 'en' },
            { _labelKey: 'wechat',      _titleKey: 'wechat',      factory: () => wechatGeometry(),       label: t('wechat'),       title: t('wechat'),       url: './pages/wechat.html',      langOnly: 'zh' },
            { _labelKey: 'xiaohongshu', _titleKey: 'xiaohongshu', factory: () => xiaohongshuGeometry(),  label: t('xiaohongshu'),  title: t('xiaohongshu'),  url: './pages/xiaohongshu.html', langOnly: 'zh' },
        ]
    },
    {
        _labelKey: 'myTracks',
        type: recordGeometry(), label: t('myTracks'), url: './pages/spotify.html',
        userData: { title: t('myTracks'), _titleKey: 'myTracks' }
    },
    {
        _labelKey: 'myProjects',
        type: projectsGeometry(), label: t('myProjects'), url: './pages/projects/index.html',
        userData: { title: t('myProjects'), _titleKey: 'myProjects' },
        subItems: [
            { _labelKey: 'recipes', _titleKey: 'recipesTitle', factory: () => chefHatGeometry(), label: t('recipes'), title: t('recipesTitle'), url: './pages/projects/showcase.html' }
        ]
    },
    {
        _labelKey: 'games',
        type: gamepad(), label: t('games'), url: './pages/pong.html',
        userData: { title: t('games'), _titleKey: 'games' },
        subItems: [
            { _labelKey: 'pong',        _titleKey: 'pong',             factory: () => pongBall(),                label: t('pong'),        title: t('pong'),             url: './pages/pong.html' },
            { _labelKey: 'pigGame',     _titleKey: 'pigGame',          factory: () => pigGameDice(),             label: t('pigGame'),     title: t('pigGame'),          url: './pages/pig-game/index.html' },
            { _labelKey: 'miniGame',    _titleKey: 'miniGame',         factory: () => miniGameCube(),            label: t('miniGame'),    title: t('miniGame'),         url: './pages/unity/index.html' },
            { _labelKey: 'snake',       _titleKey: 'snake',            factory: () => snakeGeometry(),           label: t('snake'),       title: t('snake'),            url: './pages/snake.html' },
            { _labelKey: 'tictactoe',   _titleKey: 'tictactoe',        factory: () => tictactoeGeometry(),       label: t('tictactoe'),   title: t('tictactoe'),        url: './pages/tictactoe.html' },
            { _labelKey: 'euchre',      _titleKey: 'euchre',           factory: () => euchreGeometry(),          label: t('euchre'),      title: t('euchre'),           url: './pages/euchre.html' },
            { _labelKey: 'combat',      _titleKey: 'combatTitle',      factory: () => combatSimulatorGeometry(), label: t('combat'),      title: t('combatTitle'),      url: './pages/1d-combat-simulator/index.html' },
            { _labelKey: 'guessNumber', _titleKey: 'guessNumberTitle', factory: () => guessNumberGeometry(),     label: t('guessNumber'), title: t('guessNumberTitle'), url: './pages/guess-my-number/index.html' },
        ]
    }
];
setupCubes(cubeSpecs);

// Start animation loop
animate();

// ── Hot language switch ──────────────────────────────────────────────────────
// Fires whenever setPageLang() dispatches 'langchange' (no page reload needed).
window.addEventListener('langchange', () => {
    const gsap = window.gsap;

    // Big title: fade out → swap text → fade in (only if currently visible)
    const bigTitleEl = window.bigTitle?.element;
    if (bigTitleEl) {
        const titleWasVisible = parseFloat(bigTitleEl.style.opacity || '1') > 0.1;
        if (titleWasVisible) {
            gsap.to(bigTitleEl, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    if (window.bigTitle?.updateText) window.bigTitle.updateText(t('bigTitle'));
                    gsap.to(bigTitleEl, { opacity: 1, duration: 0.4 });
                }
            });
        } else {
            // Hidden (subpage) — just swap text silently, don't resurface it
            if (window.bigTitle?.updateText) window.bigTitle.updateText(t('bigTitle'));
        }
    }
    cubeSpecs.forEach((spec, i) => {
        if (spec._labelKey) {
            spec.label = t(spec._labelKey);
            if (cubes[i]) cubes[i].userData.label = spec.label;
        }
        if (spec.userData?._titleKey) {
            spec.userData.title = t(spec.userData._titleKey);
            if (cubes[i]) cubes[i].userData.title = spec.userData.title;
        }
        (spec.subItems || []).forEach(sub => {
            if (sub._labelKey) sub.label = t(sub._labelKey);
            if (sub._titleKey) sub.title = t(sub._titleKey);
        });
    });
    const enterBtn = document.getElementById('enter-button');
    if (enterBtn) enterBtn.textContent = t('enterButton');

    if (expandedParent) {
        // ── Expanded state: collapse current sub-items and respawn with new lang filter
        reloadSubItems();
    } else {
        // ── Main scene: fade labels out, revolve formation, fade labels back in
        titleObjects.forEach(titleObj => {
            const opacity = parseFloat(titleObj.element.style.opacity ?? '1');
            titleObj.userData._wasVisible = opacity > 0.1;
            if (titleObj.userData._wasVisible) gsap.to(titleObj.element, { opacity: 0, duration: 0.2 });
        });

        if (window.innerWidth >= 768) {
            cubes.forEach((obj, i) => {
                const startAngle = Math.atan2(obj.position.y, obj.position.x);
                const radius = Math.sqrt(obj.position.x ** 2 + obj.position.y ** 2);
                if (radius < 1) return;
                const proxy = { angle: startAngle };
                gsap.to(proxy, {
                    angle: startAngle + Math.PI * 2,
                    duration: 1.6,
                    delay: 0.15 + i * 0.04, // stagger slightly so it flows rather than snaps
                    ease: 'sine.inOut',      // sinusoidal — much gentler than power2
                    onUpdate() {
                        obj.position.x = Math.cos(proxy.angle) * radius;
                        obj.position.y = Math.sin(proxy.angle) * radius;
                    }
                });
            });
        }

        // Update label text while hidden, then fade back in
        setTimeout(() => {
            titleObjects.forEach(titleObj => {
                const key = titleObj.userData.cube?.userData?._titleKey;
                if (key) titleObj.element.innerText = t(key);
            });
            setTimeout(() => {
                titleObjects.forEach(titleObj => {
                    if (titleObj.userData._wasVisible) gsap.to(titleObj.element, { opacity: 1, duration: 0.4 });
                });
            }, 1800);
        }, 200);
    }
});

// demo query handling removed – projects now all in one page.
// Additional UI, event, and iframe logic can be imported and initialized here