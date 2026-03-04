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

(async () => {
    try {
        await testShowAndVisibility();
        await testHideAndClear();
        await testReplacement();
        await testInterruptHide();
        console.log('All tests passed.');
    } catch (err) {
        console.error('Test failure:', err);
        process.exit(1);
    }
})();
