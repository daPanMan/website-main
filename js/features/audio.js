export const sounds = {
    zoomIn: new Audio("audio/zoom-in.wav"),
    zoomOut: new Audio("audio/zoom-out.wav"),
    bgm: document.getElementById("bgm")
};

export function initAudio() {
    const volumeSlider = document.getElementById("volume-slider");
    const musicIcon = document.getElementById("music-icon");
    
    volumeSlider.addEventListener("input", (e) => {
        sounds.bgm.volume = e.target.value;
        updateMusicIcon(e.target.value);
    });
}

function updateMusicIcon(volume) {
    const musicIcon = document.getElementById("music-icon");
    musicIcon.innerHTML = volume === "0" ? "🔇" : "🔊";
}