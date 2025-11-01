// Background music, volume slider, mute/unmute, sound effects
export const bgm = document.getElementById('bgm');
export const volumeSlider = document.getElementById('volume-slider');
export const musicIcon = document.getElementById('music-icon');
export const volumeSliderContainer = document.getElementById('volume-slider-container');
export const muteButton = document.getElementById('mute-button');
export const zoomInSound = new Audio('audio/zoom-in.wav');
export const zoomOutSound = new Audio('audio/zoom-out.wav');

muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
let isInterrupted = false;

export function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

export function toggleVolumeSlider() {
    if (bgm.paused) {
        bgm.volume = 0.45;
        bgm.play();
    }
    muteButton.style.display = (muteButton.style.display === 'none') ? 'block' : 'none';
    volumeSliderContainer.style.display = (volumeSliderContainer.style.display === 'none') ? 'block' : 'none';
}

export function toggleMute() {
    bgm.muted = !bgm.muted;
    muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
    volumeSliderContainer.style.display = !bgm.muted ? 'block' : 'none';
}

export function updateVolume() {
    isInterrupted = true;
    event.stopPropagation();
    if (bgm.muted) {
        bgm.muted = false;
    }
    zoomInSound.volume = volumeSlider.value;
    zoomOutSound.volume = volumeSlider.value;
    bgm.volume = volumeSlider.value;
}

musicIcon.addEventListener('click', toggleVolumeSlider);
musicIcon.addEventListener('touchstart', (event) => {
    event.preventDefault();
    toggleVolumeSlider();
}, { passive: true });

muteButton.addEventListener('click', toggleMute);

volumeSlider.addEventListener('input', updateVolume);
volumeSlider.addEventListener('touchmove', (event) => {
    event.preventDefault();
    updateVolume();
}, { passive: false });

volumeSlider.addEventListener('change', () => {
    gsap.to(bgm, { volume: bgm.volume, duration: 2 });
});

volumeSlider.addEventListener('touchend', () => {
    isInterrupted = false;
});

volumeSlider.addEventListener('mouseup', () => {
    isInterrupted = false;
});
