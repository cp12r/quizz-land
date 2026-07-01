import { browser } from '$app/environment';

export function prefersReducedMotion() {
  return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isLowPowerDevice() {
  if (!browser) return true;
  const memory = Number(navigator.deviceMemory || 8);
  const cores = Number(navigator.hardwareConcurrency || 8);
  return window.innerWidth < 760 || memory <= 4 || cores <= 4;
}

export function getRendererPixelRatio(max = 1.35) {
  if (!browser) return 1;
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const lowPower = isLowPowerDevice();
  const cap = mobile ? Math.min(max, 1.15) : lowPower ? Math.min(max, 1.05) : max;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function supportsWebGL() {
  if (!browser) return false;

  try {
    const canvas = document.createElement('canvas');
    const options = {
      alpha: true,
      antialias: false,
      depth: true,
      stencil: false,
      failIfMajorPerformanceCaveat: true
    };
    const context = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
    return Boolean(context && !context.isContextLost?.());
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
    return await import('three');
  } catch (error) {
    console.warn('Three.js runtime load failed; using CSS fallback.', error);
    return null;
  }
}

export function resizeRendererToHost(renderer, camera, host, maxPixelRatio = 1.35, afterResize = null) {
  if (!renderer || !camera || !host) return;

  const width = Math.max(1, Math.floor(host.clientWidth));
  const height = Math.max(1, Math.floor(host.clientHeight));
  renderer.setPixelRatio(getRendererPixelRatio(maxPixelRatio));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  afterResize?.({ width, height, aspect: width / height });
}

export function watchRendererResize(host, renderer, camera, options = {}) {
  if (!browser || !host || !renderer || !camera) return () => {};

  const maxPixelRatio = options.maxPixelRatio ?? 1.35;
  const onResize = () => resizeRendererToHost(renderer, camera, host, maxPixelRatio, options.afterResize);
  let observer = null;

  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(onResize);
    observer.observe(host);
  }

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  onResize();

  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  };
}

export function createAnimationLoop(tick) {
  if (!browser) return () => {};

  let frame = 0;
  let stopped = false;

  function start() {
    if (stopped || frame || document.visibilityState === 'hidden') return;
    frame = requestAnimationFrame(animate);
  }

  function animate(time = 0) {
    frame = 0;
    if (stopped || document.visibilityState === 'hidden') return;
    tick(time);
    start();
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    start();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  start();

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export function disposeObject(object) {
  if (!object?.traverse) return;

  object.traverse((item) => {
    item.geometry?.dispose?.();

    if (item.material?.map) item.material.map.dispose?.();

    if (Array.isArray(item.material)) {
      item.material.forEach((material) => {
        material?.map?.dispose?.();
        material?.dispose?.();
      });
    } else {
      item.material?.dispose?.();
    }
  });
}
