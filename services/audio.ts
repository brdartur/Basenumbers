// Simple Web Audio API Synthesizer
// No external assets required. Pure code-generated sound.

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Helper to play a tone
const playTone = (freq: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth', duration: number, vol: number = 0.1) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playMoveSound = () => {
  // Soft pop sound
  playTone(300, 'sine', 0.1, 0.05);
};

export const playMergeSound = () => {
  // Higher pitched, more rewarding sound
  playTone(600, 'triangle', 0.15, 0.08);
  playTone(900, 'sine', 0.2, 0.05); // Overtone
};

export const playWinSound = () => {
  // Victory fanfare sequence
  const now = initAudio().currentTime;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'square', 0.3, 0.1), i * 150);
  });
};

export const playGameOverSound = () => {
  // Sad descending tones
  [300, 250, 200, 150].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sawtooth', 0.4, 0.05), i * 200);
  });
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
        case 'light': navigator.vibrate(5); break;
        case 'medium': navigator.vibrate(15); break;
        case 'heavy': navigator.vibrate(30); break;
        case 'success': navigator.vibrate([10, 30, 10]); break;
    }
  }
};
