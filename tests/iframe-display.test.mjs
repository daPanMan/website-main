// iframe-display.test.mjs
// Basic unit tests for the iframe display module using ES modules syntax.

import { JSDOM } from 'jsdom';

// helpers to import the module after setting up globals
async function loadModule() {
    const path = '../src/features/iframe-display.js';
    return await import(path);
}

describe('iframe-display', () => {
    beforeEach(() => {
        // reset DOM
        const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
        global.window = dom.window;
        global.document = dom.window.document;
        global.gsap = {
            to: jest.fn((target, opts) => {
                if (opts && typeof opts.onComplete === 'function') {
                    setTimeout(opts.onComplete, 0);
                }
                return { kill: jest.fn() };
            }),
            killTweensOf: jest.fn()
        };
    });

    test('showIframe displays wrapper and sets src', async () => {
        const { showIframe, isIframeVisible } = await loadModule();
        showIframe('foo.html');
        const wrapper = document.querySelector('div');
        const iframe = wrapper.querySelector('iframe');
        expect(wrapper.style.display).toBe('flex');
        expect(iframe.src).toContain('foo.html');
        expect(isIframeVisible()).toBe(true);
    });

    test('hideIframe hides wrapper and clears src', async () => {
        const { showIframe, hideIframe, isIframeVisible } = await loadModule();
        showIframe('bar.html');
        await hideIframe();
        const wrapper = document.querySelector('div');
        const iframe = wrapper.querySelector('iframe');
        expect(wrapper.style.display).toBe('none');
        expect(iframe.src).toBe('about:blank');
        expect(isIframeVisible()).toBe(false);
    });

    test('iframe element is replaced after hide', async () => {
        const { showIframe, hideIframe } = await loadModule();
        showIframe('first.html');
        const firstIframe = document.querySelector('iframe');
        await hideIframe();
        showIframe('second.html');
        const secondIframe = document.querySelector('iframe');
        expect(secondIframe).not.toBe(firstIframe);
        expect(secondIframe.src).toContain('second.html');
    });

    test('calling showIframe while hide animation is pending cancels hide', async () => {
        const { showIframe, hideIframe } = await loadModule();
        showIframe('start.html');
        const wrapper = document.querySelector('div');
        const iframe = wrapper.querySelector('iframe');
        hideIframe();
        showIframe('other.html');
        expect(wrapper.style.display).toBe('flex');
        expect(iframe.src).toContain('other.html');
    });
});