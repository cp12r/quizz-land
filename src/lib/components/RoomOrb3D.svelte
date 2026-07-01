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

  export let playerCount = 0;
  export let ready = false;
  export let countdown = false;

  let host;
  let fallback = false;
  let mounted = false;
  let lastPlayerCount = playerCount;
  let api = null;
  let cleanup = () => {};

  $: if (api) api.update({ playerCount, ready, countdown });

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      fallback = true;
      mounted = true;
      return;
    }

    const lowPower = isLowPowerDevice();
    const THREE = await loadThree();
    if (!THREE || !host) {
      fallback = true;
      mounted = true;
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 28);
    camera.position.set(0, 0.25, 5.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const hot = getCssColor('--color-accent', '#e53935');
    const cyan = getCssColor('--color-cyan', '#39d5ff');
    const yellow = getCssColor('--color-yellow', '#ffd54a');
    const mint = getCssColor('--color-mint', '#36d27c');

    scene.add(new THREE.HemisphereLight(0xffffff, 0x121832, 0.72));
    const key = new THREE.DirectionalLight(0xffefc4, 1.05);
    key.position.set(-3, 3.4, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x39d5ff, lowPower ? 0.5 : 0.85, 7);
    rim.position.set(2.2, 1.4, 2.2);
    scene.add(rim);

    const orb = new THREE.Group();
    scene.add(orb);

    const coreGeometry = new THREE.IcosahedronGeometry(0.92, lowPower ? 2 : 3);
    const shellGeometry = new THREE.IcosahedronGeometry(1.12, lowPower ? 1 : 2);
    const ringGeometry = new THREE.TorusGeometry(1.34, 0.018, 8, lowPower ? 52 : 76);
    const sparkGeometry = new THREE.SphereGeometry(0.026, lowPower ? 6 : 8, lowPower ? 4 : 6);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: cyan,
      emissive: cyan,
      emissiveIntensity: 0.32,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92
    });
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: yellow,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      wireframe: true
    });
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: mint,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    });
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: yellow,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    const ringA = new THREE.Mesh(ringGeometry, ringMaterial);
    const ringB = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    const pulse = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.026, 8, lowPower ? 54 : 86), pulseMaterial);
    ringA.rotation.x = Math.PI / 2.4;
    ringB.rotation.y = Math.PI / 2.25;
    pulse.rotation.x = Math.PI / 2;
    orb.add(core, shell, ringA, ringB, pulse);

    const sparks = [];
    const sparkMaterials = [hot, cyan, yellow, mint].map(
      (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: lowPower ? 0.42 : 0.62, depthWrite: false })
    );
    const sparkCount = lowPower ? 10 : 18;
    for (let index = 0; index < sparkCount; index += 1) {
      const mesh = new THREE.Mesh(sparkGeometry, sparkMaterials[index % sparkMaterials.length]);
      const angle = (index / sparkCount) * Math.PI * 2;
      const radius = 1.36 + (index % 4) * 0.13;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(index * 1.7) * 0.46, Math.sin(angle) * radius * 0.46);
      mesh.userData = { angle, radius, speed: 0.00035 + (index % 5) * 0.00008 };
      sparks.push(mesh);
      orb.add(mesh);
    }

    let stopLoop = () => {};
    let stopResize = () => {};
    let pulseLife = 0;
    let targetReady = ready;
    let targetCountdown = countdown;

    function update(next) {
      if (next.playerCount > lastPlayerCount) pulseLife = 1;
      lastPlayerCount = next.playerCount;
      targetReady = next.ready;
      targetCountdown = next.countdown;
    }

    function animate(time = 0) {
      const readyBoost = targetReady ? 1 : 0;
      const countdownBoost = targetCountdown ? 1 : 0;
      const tempo = countdownBoost ? 0.00125 : 0.00052;

      orb.rotation.y = time * tempo;
      orb.rotation.x = Math.sin(time * 0.00045) * 0.14;
      core.rotation.y -= 0.004 + readyBoost * 0.003;
      core.rotation.z = Math.sin(time * 0.0007) * 0.08;
      shell.rotation.y += 0.003;
      ringA.rotation.z += 0.006 + countdownBoost * 0.008;
      ringB.rotation.x += 0.004;

      const breathe = 1 + Math.sin(time * (targetReady ? 0.003 : 0.0016)) * (targetReady ? 0.055 : 0.026);
      core.scale.setScalar(breathe + pulseLife * 0.13);
      shell.scale.setScalar(1 + readyBoost * 0.05 + pulseLife * 0.22);
      coreMaterial.emissiveIntensity += ((targetReady ? 0.62 : 0.32) - coreMaterial.emissiveIntensity) * 0.045;
      shellMaterial.opacity += ((targetReady ? 0.21 : 0.13) - shellMaterial.opacity) * 0.05;
      ringMaterial.opacity += ((targetReady ? 0.5 : 0.28) - ringMaterial.opacity) * 0.05;
      ringB.material.opacity = ringMaterial.opacity * 0.72;

      pulse.scale.setScalar(1 + (1 - pulseLife) * 0.9);
      pulse.material.opacity = pulseLife * 0.34;
      pulseLife = Math.max(0, pulseLife - 0.026);

      sparks.forEach((spark, index) => {
        const angle = spark.userData.angle + time * spark.userData.speed;
        spark.position.x = Math.cos(angle) * spark.userData.radius;
        spark.position.z = Math.sin(angle) * spark.userData.radius * 0.48;
        spark.position.y = Math.sin(time * 0.0012 + index) * 0.48;
        spark.scale.setScalar(0.8 + readyBoost * 0.3 + Math.sin(time * 0.003 + index) * 0.12);
      });

      renderer.render(scene, camera);
    }

    stopResize = watchRendererResize(host, renderer, camera, { maxPixelRatio: 1.2 });
    update({ playerCount, ready, countdown });
    api = { update };
    mounted = true;
    stopLoop = createAnimationLoop(animate);

    cleanup = () => {
      stopLoop();
      stopResize();
      api = null;
      disposeObject(scene);
      pulse.geometry.dispose();
      sparkMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  onDestroy(() => cleanup());
</script>

<div
  bind:this={host}
  class:mounted
  class:fallback
  class:ready
  class:countdown
  class="room-orb3d"
  aria-hidden="true"
></div>

<style>
  .room-orb3d {
    position: absolute;
    inset: auto clamp(14px, 4vw, 34px) clamp(16px, 4vw, 34px) auto;
    width: clamp(136px, 22vw, 238px);
    aspect-ratio: 1;
    z-index: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 420ms ease, transform 420ms ease;
    transform: translateY(8px) scale(0.96);
    filter: drop-shadow(0 22px 40px rgba(0, 0, 0, 0.32));
  }

  .room-orb3d.mounted {
    opacity: 0.95;
    transform: translateY(0) scale(1);
  }

  .room-orb3d :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .room-orb3d.fallback::before,
  .room-orb3d.fallback::after {
    content: '';
    position: absolute;
    inset: 17%;
    border: 1px solid rgba(255, 213, 74, 0.32);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(57, 213, 255, 0.2), transparent 66%);
  }

  .room-orb3d.fallback::after {
    inset: 31%;
    border-color: rgba(54, 210, 124, 0.34);
    background: rgba(255, 213, 74, 0.18);
    box-shadow: 0 0 34px rgba(255, 213, 74, 0.22);
  }

  .room-orb3d.ready.fallback::before {
    box-shadow: 0 0 44px rgba(54, 210, 124, 0.22);
  }

  @media (max-width: 860px) {
    .room-orb3d {
      inset: auto 12px 12px auto;
      width: clamp(112px, 32vw, 158px);
      opacity: 0.62;
    }
  }

  @media (max-width: 560px) {
    .room-orb3d {
      inset: auto -18px -12px auto;
      width: 126px;
      opacity: 0.42;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .room-orb3d {
      transition: none;
    }
  }
</style>
