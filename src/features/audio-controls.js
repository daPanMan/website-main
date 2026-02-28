// Background music, volume slider, mute/unmute, sound effects
export const bgm = document.getElementById('bgm');
export const volumeSlider = document.getElementById('volume-slider');
export const musicIcon = document.getElementById('music-icon');
export const volumeSliderContainer = document.getElementById('volume-slider-container');
export const muteButton = document.getElementById('mute-button');
export const zoomInSound = new Audio('assets/audio/zoom-in.wav');
export const zoomOutSound = new Audio('assets/audio/zoom-out.wav');

muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
let panelOpen = false; // single state for the whole volume controls panel

export function playSound(sound) {
    sound.currentTime = 0;
    const p = sound.play();
    if (p && p.catch) p.catch(() => {});
}

export function toggleVolumeSlider() {
    if (bgm.paused) {
        bgm.volume = 0.45;
        bgm.play();
    }
    panelOpen = !panelOpen;
    const show = panelOpen ? 'block' : 'none';
    muteButton.style.display = show;
    volumeSliderContainer.style.display = panelOpen && !bgm.muted ? 'block' : 'none';
}

export function toggleMute() {
    bgm.muted = !bgm.muted;
    muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
    // Hide slider when muted, show when unmuted (panel stays open)
    volumeSliderContainer.style.display = !bgm.muted ? 'block' : 'none';
}

export function updateVolume(event) {
    if (event) event.stopPropagation();
    if (bgm.muted) {
        bgm.muted = false;
        muteButton.innerHTML = '🔊';
    }
    // Exponential curve: perceived loudness scales logarithmically,
    // so we square the linear slider value for a more natural feel.
    const linear = parseFloat(volumeSlider.value);
    const vol = linear * linear;
    zoomInSound.volume = vol;
    zoomOutSound.volume = vol;
    bgm.volume = vol;
}

// --- Stop all volume-control clicks/touches from reaching the 3D scene ---
const volumeControl = document.getElementById('volume-control');
volumeControl.style.pointerEvents = 'auto'; // ensure interactive above CSS3D overlay
volumeControl.addEventListener('click', (e) => e.stopPropagation());
volumeControl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
volumeControl.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

musicIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVolumeSlider();
});
musicIcon.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleVolumeSlider();
}, { passive: false });

muteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
});

volumeSlider.addEventListener('input', updateVolume);
volumeSlider.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    e.preventDefault();
    updateVolume(e);
}, { passive: false });
