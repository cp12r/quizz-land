import { browser } from '$app/environment';

const SOUND_HOOKS = ['correct', 'wrong', 'timer-low', 'reveal', 'victory', 'join', 'start'];
const STORAGE_KEY = 'quizz-sound-manager-disabled';

let disabled = false;

export function initSoundManager() {
  if (!browser) return;
  disabled = localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setSoundManagerDisabled(value) {
  disabled = Boolean(value);
  if (browser) localStorage.setItem(STORAGE_KEY, disabled ? 'true' : 'false');
}

export function isSoundManagerDisabled() {
  return disabled;
}

export function getSoundHooks() {
  return SOUND_HOOKS;
}

export function playSoundHook(name) {
  if (!browser || disabled || !SOUND_HOOKS.includes(name)) return false;
  window.dispatchEvent(new CustomEvent('quizzland:sound', { detail: { name } }));
  return true;
}
