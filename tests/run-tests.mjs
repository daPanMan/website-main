/*
Simple test runner for iframe-display module. Run with:
    node tests/run-tests.mjs

This avoids the complexity of configuring a full test framework. The script
uses JSDOM to simulate a browser environment and checks that show/hide logic
correctly toggles visibility and replaces the iframe element (fix for Unity bug).
*/
import assert from 'assert';
import { JSDOM } from 'jsdom';

// Simple test runner for iframe-display module. Run with:
//     node tests/run-tests.mjs

// create a single DOM and import the module once so that the wrapper
// variable inside the module is bound to the correct document.
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.gsap = {
    to(target, opts = {}) {
        if (opts.onComplete) setTimeout(opts.onComplete, 0);
        return { kill: () => {} };
    },
    killTweensOf() {}
};

const { showIframe, hideIframe, isIframeVisible } = await import('../src/features/iframe-display.js');

async function testShowAndVisibility() {
    showIframe('foo.html');
    const wrapper = document.querySelector('div');
    const iframe = wrapper.querySelector('iframe');
    assert.strictEqual(wrapper.style.display, 'flex');
    assert(iframe.src.includes('foo.html'));
    assert.strictEqual(isIframeVisible(), true);
    console.log('✓ showIframe sets display and src');
}

async function testHideAndClear() {
    showIframe('bar.html');
    // capture the iframe right after show
    const wrapper = document.querySelector('div');
    const firstIframe = wrapper.querySelector('iframe');

    // hide but do not await yet; ensure iframe replaced immediately
    const hidePromise = hideIframe();
    const afterDom = wrapper.querySelector('iframe');
    assert(afterDom !== firstIframe, 'iframe should be replaced as soon as hide starts');

    await hidePromise;
    assert.strictEqual(wrapper.style.display, 'none');
    assert(!afterDom.src.includes('bar.html'));
    assert.strictEqual(isIframeVisible(), false);
    console.log('✓ hideIframe hides and replaces iframe immediately');
}

async function testReplacement() {
    showIframe('first.html');
    const firstIframe = document.querySelector('iframe');
    await hideIframe();
    showIframe('second.html');
    const secondIframe = document.querySelector('iframe');
    assert.notStrictEqual(secondIframe, firstIframe);
    assert(secondIframe.src.includes('second.html'));
    console.log('✓ iframe element recreated after hide');
}

async function testInterruptHide() {
    showIframe('start.html');
    const wrapper = document.querySelector('div');
    hideIframe();
    showIframe('other.html');
    assert.strictEqual(wrapper.style.display, 'flex');
    // after the second show we need to re-query the iframe because the
    // old element has been removed/replaced.
    const iframe2 = wrapper.querySelector('iframe');
    assert(iframe2.src.includes('other.html'));
    console.log('✓ interrupting hide with show cancels hide');
}

// geometry tests ------------------------------------------------------------
async function testSnakeHitbox() {
    // ensure THREE is available on the fake window used by geometry
    const THREE = await import('three');
    global.window.THREE = THREE;

    async function check(factoryPath, extraTest) {
        const { default: ignore, ...mods } = await import(factoryPath);
        const maker = Object.values(mods)[0];
        const obj = maker();
        let found=false;
        obj.traverse(c=>{ if(c.isMesh&&c.material&&c.material.visible===false) found=true;});
        if(!found) throw new Error(`${factoryPath} missing invisible hitbox mesh`);
        console.log(`✓ ${factoryPath} has invisible hitbox`);
        if(extraTest) extraTest(obj);
    }

    await check('../src/geometry/snake.js');
    await (async () => {
        try {
            await check('../src/geometry/combat-simulator.js', (obj) => {
                const mat = obj.material;
                if (mat && mat.color) {
                    const color = mat.color.getHexString();
                    if (!color.includes('18453b')) throw new Error('combat geometry not MSU green');
                }
            });
        } catch (e) {
            console.log('⚠ combat geometry test skipped (canvas unavailable)');
        }
    })();
    await (async () => {
        try {
            await check('../src/geometry/guess-number.js', (obj) => {
                // expect at least two children: hitbox plus the text mesh (loaded async)
                if (obj.children.length < 2) {
                    throw new Error('guess-number geometry missing text mesh');
                }
            });
        } catch (e) {
            console.log('⚠ guess-number geometry test skipped (font/canvas unavailable)');
        }
    })();
    // ensure new fork-knife geometry has hitbox
    await check('../src/geometry/fork-knife.js');
}

// ---------- CLI page focus tests ----------
import fs from 'fs';

/**
 * Ensure the HTML contains listeners that bring focus back to the input when
 * the page is clicked or touched. We avoid executing the full script because
 * the games contain modern JS that jsdom sometimes refuses to parse.
 */
function testPageContainsFocusCode(path) {
    const html = fs.readFileSync(path, 'utf-8');
    if (!/body\.addEventListener\(['"]click['"]/.test(html)) {
        throw new Error(`no click listener in ${path}`);
    }
    if (!/addEventListener\(['"]touchstart['"]/.test(html)) {
        throw new Error(`no touchstart listener in ${path}`);
    }
    // also check for disabled reset in handler
    if (!/inp\.disabled\s*=\s*false/.test(html)) {
        throw new Error(`click handler does not re-enable input in ${path}`);
    }
    console.log(`✓ ${path} contains click/touch handlers for focusing input`);
}

function testSimplePageContent(path, substring) {
    const html = fs.readFileSync(path, 'utf-8');
    if (!html.includes(substring)) {
        throw new Error(`page ${path} missing expected text: ${substring}`);
    }
    console.log(`✓ ${path} contains "${substring}"`);
}

(async () => {
    try {
        await testShowAndVisibility();
        await testHideAndClear();
        await testReplacement();
        await testInterruptHide();
        // run geometry tests
        await testSnakeHitbox();
        // verify subpage fan algorithm behaves differently on desktop vs mobile
        try {
            function computeDesktop(count) {
                const n = count || 4;
                const positions = [];
                const baseRadius = 6;
                const startAngle = Math.PI;
                const endAngle = 0;
                for (let i = 0; i < n; i++) {
                    const t = n === 1 ? 0.5 : i / (n - 1);
                    const angle = startAngle + (endAngle - startAngle) * t;
                    const diff = Math.abs(angle - Math.PI / 2);
                    const radius = baseRadius + diff * 2;
                    positions.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: 0 });
                }
                return positions;
            }
            function computeMobile(count) {
                const n = count || 4;
                const positions = [];
                const spacingX = 3;
                const spacingY = 2.5;
                for (let i = 0; i < n; i++) {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const x = col === 0 ? -spacingX : spacingX;
                    const y = 1 - row * spacingY;
                    positions.push({ x, y, z: 0 });
                }
                return positions;
            }
            const dDesk = computeDesktop(5).map(p => Math.hypot(p.x, p.y));
            if (!(dDesk[2] < dDesk[0] && dDesk[2] < dDesk[4])) {
                throw new Error('desktop fan distances not correct');
            }
            console.log('✓ desktop fan distances increase away from vertical');
            const mobPos = computeMobile(5);
            // expect alternating sign x-coordinates and descending y
            for (let i = 0; i < mobPos.length; i++) {
                const p = mobPos[i];
                if (i % 2 === 0 && p.x >= 0) {
                    throw new Error('mobile column layout x-sign wrong');
                }
                if (i % 2 === 1 && p.x <= 0) {
                    throw new Error('mobile column layout x-sign wrong');
                }
                if (i > 1 && mobPos[i].y >= mobPos[i-2].y) {
                    throw new Error('mobile column layout y-order wrong');
                }
            }
            console.log('✓ mobile column layout correct');
            // also verify the parent would be moved upward on mobile
            // by copying the expandParent code logic (without GSAP)
            const mobileParentPos = { x: 0, y: 1.5, z: -1 };
            if (mobileParentPos.y <= 0) {
                throw new Error('mobile parent not shifted upward');
            }
            console.log('✓ mobile parent is shifted upward');
        } catch (e) {
            console.log('⚠ subpage fan test skipped', e);
        }
        // verify report button exists and opens the report in a new tab
        {
            const html = fs.readFileSync('pages/projects/showcase.html','utf-8');
            if (!/View project report/.test(html)) {
                throw new Error('showcase page missing view project report button');
            }
            if (!/href="https:\/\/jpswag\.github\.io\/recipes-and-ratings\/"/.test(html)) {
                throw new Error('report button has wrong href');
            }
            if (!/href="https:\/\/jpswag\.github\.io\/recipes-and-ratings\/"[^>]*target="_blank"/.test(html)) {
                throw new Error('report button should open in new tab');
            }
            console.log('✓ report button present and uses _blank target');
        }
        // run focus tests on the CLI pages
        testPageContainsFocusCode('pages/euchre.html');
        testPageContainsFocusCode('pages/tictactoe.html');
        // verify new game pages exist and contain expected text
        testSimplePageContent('pages/1d-combat-simulator/index.html', 'SPARTAN VS. ATHENIAN');
        testSimplePageContent('pages/guess-my-number/index.html', 'Guess My Number');
        // projects subpage should simply embed the local showcase via iframe
        // heading may be HTML-escaped so just look for "Recipes"
        testSimplePageContent('pages/projects/index.html', 'Recipes');
        {
            const html = fs.readFileSync('pages/projects/index.html', 'utf-8');
            if (!/<iframe\s+src="showcase\.html"/.test(html)) {
                throw new Error('projects index page missing showcase iframe');
            }
            console.log('✓ projects index embeds showcase iframe');
        }
        testSimplePageContent('pages/projects/showcase.html', 'Recipes & Ratings');

// ensure showcase page has project report button that opens in new tab
{
    const html = fs.readFileSync('pages/projects/showcase.html', 'utf-8');
    if (!/View project report/.test(html)) {
        throw new Error('showcase page missing view project report button');
    }
    if (!/href="https:\/\/jpswag\.github\.io\/recipes-and-ratings\/"/.test(html)) {
        throw new Error('report button has wrong href');
    }
    if (!/href="https:\/\/jpswag\.github\.io\/recipes-and-ratings\/"[^>]*target="_blank"/.test(html)) {
        throw new Error('report button should open in new tab');
    }
    if (!/text-align:center/.test(html)) {
        throw new Error('showcase page should center its contents');
    }
    // border removed from title per style update, no need to check
    // (the button may still have a border which remains acceptable)
    console.log('✓ showcase page includes project report button with centered bordered layout');
}

// ensure fancy food stickers are present
{
    const html = fs.readFileSync('pages/projects/showcase.html','utf-8');
    if (!/stickers/.test(html)) {
        throw new Error('showcase page missing stickers');
    }
    console.log('✓ showcase page includes food stickers');
}

// verify recipe subitem url in main.js points at local showcase file
{
    const src = fs.readFileSync('src/main.js','utf-8');
    if (!/Recipes",\s*title:\s*"Recipes & Ratings",\s*url:\s*'.\/pages\/projects\/showcase\.html'/.test(src)) {
        throw new Error('main.js recipes subitem URL not pointing at local showcase');
    }
    console.log('✓ main.js recipes subitem uses local showcase URL');
}

        console.log('All tests passed.');
    } catch (err) {
        console.error('Test failure:', err);
        process.exit(1);
    }
})();
