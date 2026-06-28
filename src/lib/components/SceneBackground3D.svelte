<script>
  import { onDestroy, onMount } from 'svelte';
  import { disposeObject, getCssColor, isLowPowerDevice, prefersReducedMotion, supportsWebGL } from '$lib/utils/webgl.js';

  export let variant = 'party';
  export let intensity = 0.55;
  export let interactive = true;

  let host;
  let fallback = false;
  let ready = false;
  let cleanup = () => {};

  const variantDepth = {
    creator: { cameraZ: 8.6, spread: 7.5, particleSize: 0.03 },
    lobby: { cameraZ: 8.2, spread: 6.4, particleSize: 0.028 },
    game: { cameraZ: 7.8, spread: 5.7, particleSize: 0.024 },
    results: { cameraZ: 9.2, spread: 7.2, particleSize: 0.032 },
    party: { cameraZ: 8.4, spread: 6.8, particleSize: 0.028 }
  };

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      fallback = true;
      return;
    }

    const lowPower = isLowPowerDevice();
    const THREE = await import('three');
    if (!host) return;

    const settings = variantDepth[variant] || variantDepth.party;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    camera.position.set(0, 0, settings.cameraZ);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.35));
    host.appendChild(renderer.domElement);

    const ink = getCssColor('--color-ink', '#17151b');
    const hot = getCssColor('--color-accent', '#ff4f79');
    const cyan = getCssColor('--color-cyan', '#02a6a6');
    const yellow = getCssColor('--color-yellow', '#ffd166');
    const mint = getCssColor('--color-mint', '#38d996');
    const palette = [hot, cyan, yellow, mint];

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.64));

    const key = new THREE.DirectionalLight(0xffffff, 0.78);
    key.position.set(-3, 4, 5);
    scene.add(key);

    const matOptions = {
      roughness: 0.74,
      metalness: 0.12,
      transparent: true,
      opacity: lowPower ? 0.2 : 0.28
    };

    const shapes = lowPower ? 5 : 9;
    const geometries = [
      new THREE.BoxGeometry(0.5, 0.5, 0.12),
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.TorusGeometry(0.28, 0.035, 8, 24)
    ];

    for (let index = 0; index < shapes; index += 1) {
      const material = new THREE.MeshStandardMaterial({
        ...matOptions,
        color: palette[index % palette.length],
        emissive: index % 3 === 0 ? palette[index % palette.length] : ink,
        emissiveIntensity: index % 3 === 0 ? 0.08 : 0.02
      });
      const mesh = new THREE.Mesh(geometries[index % geometries.length], material);
      const lane = index / Math.max(1, shapes - 1);
      mesh.position.set((lane - 0.5) * settings.spread, Math.sin(index * 1.7) * 2.2, -1.2 - (index % 4) * 0.75);
      mesh.rotation.set(index * 0.4, index * 0.72, index * 0.24);
      mesh.userData = { speed: 0.16 + index * 0.018, sway: 0.22 + (index % 3) * 0.08 };
      group.add(mesh);
    }

    const particleCount = lowPower ? 52 : 118;
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * settings.spread * 1.35;
      positions[offset + 1] = (Math.random() - 0.5) * 5.6;
      positions[offset + 2] = -Math.random() * 7 - 0.6;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: yellow,
      size: settings.particleSize,
      transparent: true,
      opacity: lowPower ? 0.16 : 0.24,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const target = { x: 0, y: 0 };

    function resize() {
      if (!host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function onPointerMove(event) {
      if (!interactive) return;
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.8;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.55;
    }

    function animate(time = 0) {
      target.x += (pointerX - target.x) * 0.035;
      target.y += (pointerY - target.y) * 0.035;
      group.rotation.y = target.x + Math.sin(time * 0.00018) * 0.08;
      group.rotation.x = -target.y * 0.35;
      particles.rotation.z = time * 0.000025;

      group.children.forEach((mesh, index) => {
        mesh.rotation.x += mesh.userData.speed * 0.006;
        mesh.rotation.y += mesh.userData.speed * 0.008;
        mesh.position.y += Math.sin(time * 0.001 + index) * 0.0018 * mesh.userData.sway;
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    resize();
    ready = true;
    frame = requestAnimationFrame(animate);

    cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      disposeObject(scene);
      particleGeometry.dispose();
      particleMaterial.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  onDestroy(() => cleanup());
</script>

<div
  bind:this={host}
  class={`scene3d scene3d-${variant}`}
  class:fallback
  class:ready
  style={`--scene-intensity:${intensity};`}
  aria-hidden="true"
></div>

<style>
  .scene3d {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    transition: opacity 500ms ease;
    contain: strict;
  }

  .scene3d.ready,
  .scene3d.fallback {
    opacity: var(--scene-intensity);
  }

  .scene3d :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .scene3d.fallback::before,
  .scene3d.fallback::after {
    content: '';
    position: absolute;
    border: 1px solid rgba(255, 250, 240, 0.14);
    opacity: 0.8;
    transform: rotate(-9deg);
  }

  .scene3d.fallback::before {
    right: 8%;
    top: 16%;
    width: 32vmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 209, 102, 0.16), transparent 64%);
  }

  .scene3d.fallback::after {
    left: 6%;
    bottom: 10%;
    width: 40vmin;
    height: 12vmin;
    background: linear-gradient(90deg, transparent, rgba(2, 166, 166, 0.16), transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .scene3d {
      transition: none;
    }
  }
</style>
