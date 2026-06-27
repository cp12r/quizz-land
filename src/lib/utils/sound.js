import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'quizz-sound-muted';
const DEFAULT_GAIN = 0.18;

let context;
let master;
let mutedValue = false;

export const soundMuted = writable(false);

function readMuted() {
  if (!browser) return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function ensureAudio() {
  if (!browser || mutedValue) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = DEFAULT_GAIN;
    master.connect(context.destination);
  }

  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }

  return context;
}

function tone({ frequency = 440, duration = 0.12, type = 'sine', gain = 0.6, delay = 0 }) {
  const audio = ensureAudio();
  if (!audio || !master) return;

  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function initSound() {
  mutedValue = readMuted();
  soundMuted.set(mutedValue);
}

export function setSoundMuted(value) {
  mutedValue = Boolean(value);
  soundMuted.set(mutedValue);
  if (browser) localStorage.setItem(STORAGE_KEY, mutedValue ? 'true' : 'false');
}

export function toggleSound() {
  setSoundMuted(!mutedValue);
  if (!mutedValue) playSound('ui');
}

export function playSound(name) {
  if (mutedValue) return;

  const patterns = {
    ui: [{ frequency: 520, duration: 0.07, type: 'triangle', gain: 0.35 }],
    join: [
      { frequency: 392, duration: 0.08, type: 'triangle', gain: 0.34 },
      { frequency: 587, duration: 0.10, type: 'triangle', gain: 0.30, delay: 0.07 }
    ],
    start: [
      { frequency: 330, duration: 0.10, type: 'triangle', gain: 0.32 },
      { frequency: 494, duration: 0.12, type: 'triangle', gain: 0.32, delay: 0.09 },
      { frequency: 659, duration: 0.16, type: 'triangle', gain: 0.28, delay: 0.18 }
    ],
    select: [{ frequency: 620, duration: 0.08, type: 'sine', gain: 0.30 }],
    correct: [
      { frequency: 523, duration: 0.09, type: 'triangle', gain: 0.34 },
      { frequency: 784, duration: 0.12, type: 'triangle', gain: 0.32, delay: 0.08 }
    ],
    wrong: [
      { frequency: 220, duration: 0.09, type: 'sine', gain: 0.28 },
      { frequency: 185, duration: 0.14, type: 'sine', gain: 0.22, delay: 0.08 }
    ],
    transition: [
      { frequency: 440, duration: 0.06, type: 'triangle', gain: 0.22 },
      { frequency: 554, duration: 0.06, type: 'triangle', gain: 0.22, delay: 0.05 },
      { frequency: 659, duration: 0.08, type: 'triangle', gain: 0.20, delay: 0.10 }
    ],
    reveal: [
      { frequency: 262, duration: 0.10, type: 'triangle', gain: 0.26 },
      { frequency: 392, duration: 0.10, type: 'triangle', gain: 0.26, delay: 0.08 },
      { frequency: 523, duration: 0.16, type: 'triangle', gain: 0.28, delay: 0.16 }
    ],
    victory: [
      { frequency: 523, duration: 0.10, type: 'triangle', gain: 0.28 },
      { frequency: 659, duration: 0.10, type: 'triangle', gain: 0.28, delay: 0.08 },
      { frequency: 784, duration: 0.10, type: 'triangle', gain: 0.26, delay: 0.16 },
      { frequency: 1046, duration: 0.18, type: 'triangle', gain: 0.22, delay: 0.24 }
    ]
  };

  for (const note of patterns[name] || patterns.ui) tone(note);
}
