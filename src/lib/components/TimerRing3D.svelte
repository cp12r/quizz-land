<script>
  import { onDestroy, onMount } from 'svelte';
  import {
    createAnimationLoop,
    disposeObject,
    getCssColor,
    isLowPowerDevice,
    loadThree,
    prefersReducedMotion,
    supportsWebGL,
    watchRendererResize
  } from '$lib/utils/webgl.js';

  export let remaining = 0;
  export let total = 30;
  export let active = true;
  export let complete = false;

  let host;
  let fallback = false;
  let ready = false;
  let api = null;
  let cleanup = () => {};

  $: progress = total ? Math.max(0, Math.min(1, remaining / total)) : 0;
  $: urgent = remaining <= 5 && remaining > 0;
  $: if (api) api.update({ progress, urgent, active, complete });

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      fallback = true;
      ready = true;
      return;
    }

    const lowPower = isLowPowerDevice();
    const THREE = await loadThree();
    if (!THREE || !host) {
      fallback = true;
      ready = true;
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 32);
    camera.position.set(0, 0, 6.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const cyan = getCssColor('--color-cyan', '#39d5ff');
    const yellow = getCssColor('--color-yellow', '#ffd54a');
    const hot = getCssColor('--color-accent', '#e53935');
    const mint = getCssColor('--color-mint', '#36d27c');

    const group = new THREE.Group();
    group.position.z = -0.55;
    scene.add(group);

    const trackMaterial = new THREE.MeshBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: lowPower ? 0.08 : 0.12,
      depthWrite: false
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: yellow,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const urgentMaterial = new THREE.MeshBasicMaterial({
      color: hot,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const dotMaterials = [yellow, cyan, mint, hot].map(
      (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.76, depthWrite: false })
    );

    const track = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.011, 8, lowPower ? 72 : 112), trackMaterial);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.044, 8, lowPower ? 72 : 112), glowMaterial);
    const urgentHalo = new THREE.Mesh(new THREE.TorusGeometry(2.04, 0.026, 8, lowPower ? 56 : 92), urgentMaterial);
    group.add(glow, track, urgentHalo);

    const dotGeometry = new THREE.SphereGeometry(0.028, lowPower ? 6 : 8, lowPower ? 4 : 6);
    const dots = [];
    const dotCount = lowPower ? 34 : 54;
    for (let index = 0; index < dotCount; index += 1) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterials[index % dotMaterials.length]);
      const angle = -Math.PI / 2 + (index / dotCount) * Math.PI * 2;
      dot.position.set(Math.cos(angle) * 1.92, Math.sin(angle) * 1.92, 0.02);
      dot.userData = { index, angle };
      dots.push(dot);
      group.add(dot);
    }

    let state = { progress, urgent, active, complete };
    let stopLoop = () => {};
    let stopResize = () => {};

    function update(next) {
      state = next;
    }

    function afterResize({ width, height, aspect }) {
      const mobile = width < 680;
      const landscapePhone = width < 940 && height < 520;
      const scale = mobile ? 0.78 : landscapePhone ? 0.72 : 1;
      group.scale.set(scale * (aspect < 0.86 ? 0.82 : 1), scale, 1);
      group.position.y = mobile ? 0.08 : 0;
    }

    function animate(time = 0) {
      const shake = state.urgent ? Math.sin(time * 0.034) * 0.018 : 0;
      const intensity = state.active ? 1 : 0.46;
      const completed = state.complete ? 1 : 0;
      group.rotation.z = time * (state.urgent ? -0.00046 : -0.00013) + shake;
      track.rotation.z = -time * 0.00008;
      glow.scale.setScalar(1 + Math.sin(time * 0.0015) * 0.012 + completed * 0.04);
      glow.material.opacity += (((state.urgent ? 0.22 : 0.1) + completed * 0.12) * intensity - glow.material.opacity) * 0.07;
      urgentHalo.material.opacity += ((state.urgent ? 0.22 : completed ? 0.18 : 0) - urgentHalo.material.opacity) * 0.08;

      dots.forEach((dot) => {
        const limit = Math.max(0.02, state.progress);
        const inArc = dot.userData.index / dotCount <= limit;
        const pulse = 0.78 + Math.sin(time * 0.004 + dot.userData.index) * 0.18;
        dot.visible = inArc || state.complete;
        dot.material.opacity = (inArc ? 0.7 : 0.12) * intensity * pulse;
        dot.scale.setScalar((state.urgent ? 1.28 : 1) + (dot.userData.index % 5) * 0.018);
        dot.position.z = Math.sin(time * 0.002 + dot.userData.index) * (state.urgent ? 0.08 : 0.035);
      });

      renderer.render(scene, camera);
    }

    stopResize = watchRendererResize(host, renderer, camera, { maxPixelRatio: 1.15, afterResize });
    api = { update };
    api.update({ progress, urgent, active, complete });
    ready = true;
    stopLoop = createAnimationLoop(animate);

    cleanup = () => {
      stopLoop();
      stopResize();
      api = null;
      disposeObject(scene);
      dotMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  onDestroy(() => cleanup());
</script>

<div
  bind:this={host}
  class:fallback
  class:ready
  class:urgent
  class:complete
  class="timer-ring3d"
  style={`--timer-progress:${progress * 360}deg;`}
  aria-hidden="true"
></div>

<style>
  .timer-ring3d {
    position: absolute;
    inset: -10% -4%;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    transition: opacity 320ms ease;
  }

  .timer-ring3d.ready {
    opacity: 0.8;
  }

  .timer-ring3d :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .timer-ring3d.fallback::before {
    content: '';
    position: absolute;
    inset: 10% 17%;
    border-radius: 50%;
    background:
      conic-gradient(var(--color-yellow) var(--timer-progress), rgba(230, 232, 239, 0.12) 0),
      radial-gradient(circle, transparent 61%, rgba(57, 213, 255, 0.11) 63%, transparent 70%);
    opacity: 0.32;
    mask-image: radial-gradient(circle, transparent 57%, black 59%, black 68%, transparent 70%);
  }

  .timer-ring3d.urgent.fallback::before {
    background:
      conic-gradient(var(--color-danger) var(--timer-progress), rgba(230, 232, 239, 0.12) 0),
      radial-gradient(circle, transparent 61%, rgba(229, 57, 53, 0.16) 63%, transparent 70%);
  }

  @media (max-width: 680px) {
    .timer-ring3d {
      inset: -5% -12%;
      opacity: 0.48;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .timer-ring3d {
      display: none;
    }
  }
</style>
