// Intro overlay, enter button, transition to main 3D page
import { bgm } from './audio-controls.js';

export function init3DWorld() {
    const introPage = document.getElementById('intro-page');
    const threeCanvas = document.getElementById('three-canvas');
    gsap.to(introPage, { opacity: 0, duration: 1, ease: 'power2.out', onComplete: () => {
        introPage.style.display = 'none';
    }});
    setTimeout(() => {
        bgm.volume = 0.45;
        threeCanvas.style.display = 'block';
        document.querySelector('.three-css3d').style.display = 'block';
        gsap.to(threeCanvas, { opacity: 1, duration: 10, ease: 'power2.out' });
    }, 500);
}


document.getElementById('enter-button').addEventListener('click', () => {
    bgm.play();
    init3DWorld();
});
document.getElementById('enter-button').addEventListener('touchstart', (event) => {
    event.stopPropagation();
    event.preventDefault();
    bgm.play();
    init3DWorld();
}, { passive: false });
