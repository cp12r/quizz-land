import { browser } from '$app/environment';

const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';

export function prefersReducedMotion() {
  return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isLowPowerDevice() {
  if (!browser) return true;
  const memory = Number(navigator.deviceMemory || 8);
  return window.innerWidth < 700 || memory <= 4;
}

export function supportsWebGL() {
  if (!browser) return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function getCssColor(name, fallback) {
  if (!browser) return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export async function loadThree() {
  if (!browser) return null;

  try {
    return await import(/* @vite-ignore */ THREE_MODULE_URL);
  } catch (error) {
    console.warn('Three.js runtime load failed; using CSS fallback.', error);
    return null;
  }
}

export function disposeObject(object) {
  if (!object?.traverse) return;

  object.traverse((item) => {
    item.geometry?.dispose?.();

    if (Array.isArray(item.material)) {
      item.material.forEach((material) => material?.dispose?.());
    } else {
      item.material?.dispose?.();
    }
  });
}
