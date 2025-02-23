import gsap from 'https://cdn.skypack.dev/gsap';

// Animate Cube on Scroll
gsap.to(cube.rotation, {
    x: 2 * Math.PI,
    y: 2 * Math.PI,
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});
