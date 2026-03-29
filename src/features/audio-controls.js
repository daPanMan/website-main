// Background music, volume slider, mute/unmute, sound effects
export const bgm = document.getElementById('bgm');
export const volumeSlider = document.getElementById('volume-slider');
export const musicIcon = document.getElementById('music-icon');
export const volumeSliderContainer = document.getElementById('volume-slider-container');
export const muteButton = document.getElementById('mute-button');
export let soundMuted = bgm.muted; // global mute flag
export const zoomInSound = new Audio('assets/audio/zoom-in.wav');
export const zoomOutSound = new Audio('assets/audio/zoom-out.wav');

muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
let panelOpen = false; // single state for the whole volume controls panel

// current global volume (0.0–1.0) used for sound effects.  We map the
// slider linearly for effects so they remain audible at default, while the
// BGM uses a squared curve for smoother perceived changes.
export let currentVolume = parseFloat(volumeSlider.value); // linear

export function playSound(sound) {
    if (soundMuted) return; // don't play anything when globally muted
    // ensure the sound respects the user's volume setting too
    sound.volume = currentVolume;
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
    soundMuted = bgm.muted;
    // also mute/unmute all known effects so they respect the toggle
    zoomInSound.muted = soundMuted;
    zoomOutSound.muted = soundMuted;
    muteButton.innerHTML = bgm.muted ? '🔇' : '🔊';
    // Hide slider when muted, show when unmuted (panel stays open)
    volumeSliderContainer.style.display = !bgm.muted ? 'block' : 'none';
    // Notify other modules (e.g. space tour audio) about the mute state change
    window.dispatchEvent(new CustomEvent('mutetoggle', { detail: { muted: soundMuted } }));
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
    // BGM uses squared mapping for perceptual loudness
    const volBgm = linear * linear;
    // effects follow the linear slider for more punch
    const volEffects = linear;
    // record global effect volume for playSound
    currentVolume = volEffects;
    // update known tracks accordingly
    zoomInSound.volume = volEffects;
    zoomOutSound.volume = volEffects;
    bgm.volume = volBgm;
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

// --- Flag to block 3D scene interaction while dragging volume ---
export let volumeDragging = false;

volumeSlider.addEventListener('mousedown', () => { volumeDragging = true; });
volumeSlider.addEventListener('touchstart', () => { volumeDragging = true; }, { passive: true });
window.addEventListener('mouseup', () => { setTimeout(() => { volumeDragging = false; }, 50); });
window.addEventListener('touchend', () => { setTimeout(() => { volumeDragging = false; }, 50); });

volumeSlider.addEventListener('input', updateVolume);
volumeSlider.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    e.preventDefault();
    updateVolume(e);
}, { passive: false });
