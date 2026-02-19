import { ref } from 'vue';

// Module-level singleton so isMuted state is shared across all components
let audioCtx = null;

const isMuted = ref(
    JSON.parse(localStorage.getItem('soundMuted') ?? 'false')
);

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (isMuted.value) return;
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        // Silently ignore audio errors
    }
}

function playCorrect() {
    // G5 ding
    playTone(784, 0.3, 'sine', 0.4);
}

function playWrong() {
    // E3 buzz
    playTone(164.81, 0.4, 'sawtooth', 0.2);
}

function playTick() {
    // Short high click for last 5 seconds of timer
    playTone(750, 0.05, 'square', 0.15);
}

function playRoundStart() {
    // C5 → E5 → G5 arpeggio
    if (isMuted.value) return;
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);

            oscillator.start(ctx.currentTime + i * 0.12);
            oscillator.stop(ctx.currentTime + i * 0.12 + 0.25);
        });
    } catch (e) {
        // Silently ignore audio errors
    }
}

function toggleMute() {
    isMuted.value = !isMuted.value;
    localStorage.setItem('soundMuted', JSON.stringify(isMuted.value));
}

export function useSoundEffects() {
    return {
        isMuted,
        toggleMute,
        playCorrect,
        playWrong,
        playTick,
        playRoundStart,
    };
}
