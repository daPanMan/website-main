// Main entry point for the website
import { scene, camera, renderer, controls, addBigTitle } from './core/scene-setup.js';
import { playSound, bgm, zoomInSound, zoomOutSound } from './features/audio-controls.js';
import { setupCubes, titleObjects, cubes } from './geometry/cube-logic.js';
import { starField, createStars } from './geometry/background-stars.js';
import { animate } from './core/animation-loop.js';
import { gamepad } from './geometry/gamepad.js';
import { linkedInGeometry } from './geometry/linkedin.js';
import { mainPageGeometry } from './geometry/mainpage.js';
import { emailGeometry } from './geometry/email.js';
import { gmailGeometry } from './geometry/gmail.js';
import { instaGeometry } from './geometry/insta.js';
import { snapGeometry } from './geometry/snap.js';
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
            { _labelKey: 'instagram', _titleKey: 'instagram', factory: () => instaGeometry(),    label: t('instagram'),  title: t('instagram'),  url: './pages/insta.html' },
            { _labelKey: 'snapchat',  _titleKey: 'snapchat',  factory: () => snapGeometry(),     label: t('snapchat'),   title: t('snapchat'),   url: './pages/snap.html' },
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
    // 1. Big title
    if (window.bigTitle?.updateText) window.bigTitle.updateText(t('bigTitle'));

    // 2. Floating labels on the main 3D cubes
    titleObjects.forEach(titleObj => {
        const key = titleObj.userData.cube?.userData?._titleKey;
        if (key) titleObj.element.innerText = t(key);
    });

    // 3. Retranslate cubeSpec objects so sub-items spawn with the new language
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

    // 4. Intro enter button (visible on intro screen)
    const enterBtn = document.getElementById('enter-button');
    if (enterBtn) enterBtn.textContent = t('enterButton');
});

// demo query handling removed – projects now all in one page.
// Additional UI, event, and iframe logic can be imported and initialized here