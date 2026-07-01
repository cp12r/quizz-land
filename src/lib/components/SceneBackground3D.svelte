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
    const THREE = await loadThree();
    if (!THREE || !host) {
      fallback = true;
      return;
    }

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
    host.appendChild(renderer.domElement);

    const hot = getCssColor('--color-accent', '#e53935');
    const cyan = getCssColor('--color-cyan', '#39d5ff');
    const yellow = getCssColor('--color-yellow', '#ffd54a');
    const mint = getCssColor('--color-mint', '#36d27c');
    const palette = [hot, cyan, yellow, mint];

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.58));

    const key = new THREE.DirectionalLight(0xfff0bf, 0.86);
    key.position.set(-3, 4, 5);
    scene.add(key);

    function svgTexture(svg) {
      const texture = new THREE.TextureLoader().load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = lowPower ? 1 : 4;
      return texture;
    }

    function setTextureColor(texture) {
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = lowPower ? 1 : 4;
      return texture;
    }

    function wordmarkSvg() {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120">
          <defs>
            <linearGradient id="word" x1="35" y1="16" x2="480" y2="104" gradientUnits="userSpaceOnUse">
              <stop stop-color="#fff7d2"/>
              <stop offset=".45" stop-color="#ffd54a"/>
              <stop offset="1" stop-color="#ff4f79"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 .38  0 0 1 0 .16  0 0 0 .74 0"/>
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <rect width="520" height="120" rx="26" fill="#071127" opacity=".16"/>
          <text x="260" y="79" text-anchor="middle" filter="url(#glow)"
            font-family="Sora, Inter, Arial, sans-serif" font-size="64" font-weight="950"
            letter-spacing="0" fill="url(#word)">Quizz Land</text>
        </svg>
      `;
    }

    function iconSvg(type, color, glow) {
      const base = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <defs>
            <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.72 0"/>
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
      `;
      const end = '</svg>';
      const common = `fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"`;

      if (type === 'bolt') {
        return `${base}<path ${common} d="M72 10 28 70h31l-7 48 48-67H68l4-41Z"/><path fill="${glow}" opacity=".18" d="M72 10 28 70h31l-7 48 48-67H68l4-41Z"/>${end}`;
      }

      if (type === 'star') {
        return `${base}<path ${common} d="m64 12 13 33 36 3-28 23 9 35-30-19-30 19 9-35-28-23 36-3 13-33Z"/><circle cx="64" cy="64" r="8" fill="${glow}" opacity=".5"/>${end}`;
      }

      if (type === 'bubble') {
        return `${base}<path ${common} d="M24 31h80v52H73l-18 20V83H24V31Z"/><path ${common} d="M48 52h32M48 66h19"/><path fill="${glow}" opacity=".13" d="M24 31h80v52H73l-18 20V83H24V31Z"/>${end}`;
      }

      if (type === 'ring') {
        return `${base}<circle ${common} cx="64" cy="64" r="38"/><path ${common} d="M36 37 92 91M92 37 36 91"/><circle cx="64" cy="64" r="21" fill="${glow}" opacity=".12"/>${end}`;
      }

      return `${base}<path ${common} d="M30 20h68v88H30V20Z"/><path ${common} d="M45 43h38M45 61h30M45 79h22"/><path fill="${glow}" opacity=".13" d="M30 20h68v88H30V20Z"/>${end}`;
    }

    const iconTypes = ['bolt', 'star', 'bubble', 'ring', 'card'];
    const iconTextures = iconTypes.map((type, index) =>
      svgTexture(iconSvg(type, palette[index % palette.length], index % 2 === 0 ? yellow : cyan))
    );
    const iconGeometry = new THREE.PlaneGeometry(0.95, 0.95);
    const shapes = lowPower ? 5 : 9;

    for (let index = 0; index < shapes; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        map: iconTextures[index % iconTextures.length],
        transparent: true,
        opacity: lowPower ? 0.34 : 0.46,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(iconGeometry, material);
      const lane = index / Math.max(1, shapes - 1);
      const scale = 0.64 + (index % 4) * 0.13;
      mesh.position.set((lane - 0.5) * settings.spread, Math.sin(index * 1.7) * 2.2, -1.2 - (index % 4) * 0.75);
      mesh.rotation.set(index * 0.16, index * 0.32, index * 0.58);
      mesh.scale.set(scale * (index % 2 ? 1.16 : 0.94), scale, 1);
      mesh.userData = {
        speed: 0.16 + index * 0.018,
        sway: 0.22 + (index % 3) * 0.08,
        spin: index % 2 === 0 ? 1 : -1
      };
      group.add(mesh);
    }

    let brandGroup = null;
    const brandTextures = [];
    if (variant === 'creator') {
      brandGroup = new THREE.Group();
      brandGroup.position.set(2.08, 1.05, -0.34);
      brandGroup.rotation.set(-0.1, -0.36, 0.08);
      brandGroup.scale.setScalar(lowPower ? 0.6 : 0.72);

      const logoTexture = setTextureColor(new THREE.TextureLoader().load('/brand/quizzland-logo.svg'));
      const wordTexture = svgTexture(wordmarkSvg());
      brandTextures.push(logoTexture, wordTexture);

      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        opacity: lowPower ? 0.72 : 0.84,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const wordMaterial = new THREE.MeshBasicMaterial({
        map: wordTexture,
        transparent: true,
        opacity: lowPower ? 0.68 : 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.85), logoMaterial);
      const wordMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.58), wordMaterial);
      logoMesh.position.set(0, 0.2, 0);
      wordMesh.position.set(0, -0.98, 0.03);
      brandGroup.add(logoMesh, wordMesh);
      scene.add(brandGroup);
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

    let stopLoop = () => {};
    let stopResize = () => {};
    let pointerX = 0;
    let pointerY = 0;
    const target = { x: 0, y: 0 };

    function afterResize({ width, height }) {
      if (brandGroup) {
        const wide = width / height > 1.05;
        brandGroup.position.x = wide ? 2.08 : 0.92;
        brandGroup.position.y = wide ? 1.05 : 1.72;
        brandGroup.scale.setScalar(wide ? (lowPower ? 0.6 : 0.72) : 0.54);
      }
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

      if (brandGroup) {
        const baseY = camera.aspect > 1.05 ? 1.05 : 1.72;
        brandGroup.position.y = baseY + Math.sin(time * 0.001) * 0.12;
        brandGroup.rotation.y = -0.36 + Math.sin(time * 0.0007) * 0.18 + target.x * 0.25;
        brandGroup.rotation.x = -0.1 - target.y * 0.16;
        brandGroup.rotation.z = 0.08 + Math.sin(time * 0.0009) * 0.035;
      }

      group.children.forEach((mesh, index) => {
        mesh.rotation.x += mesh.userData.speed * 0.006;
        mesh.rotation.y += mesh.userData.speed * 0.008;
        mesh.rotation.z += mesh.userData.spin * mesh.userData.speed * 0.004;
        mesh.position.y += Math.sin(time * 0.001 + index) * 0.0018 * mesh.userData.sway;
      });

      renderer.render(scene, camera);
    }

    stopResize = watchRendererResize(host, renderer, camera, { maxPixelRatio: 1.35, afterResize });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    ready = true;
    stopLoop = createAnimationLoop(animate);

    cleanup = () => {
      stopLoop();
      stopResize();
      window.removeEventListener('pointermove', onPointerMove);
      disposeObject(scene);
      particleGeometry.dispose();
      particleMaterial.dispose();
      iconGeometry.dispose();
      iconTextures.forEach((texture) => texture.dispose());
      brandTextures.forEach((texture) => texture.dispose());
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

  .scene3d-creator {
    position: fixed;
    height: 100svh;
  }

  .scene3d.fallback::before,
  .scene3d.fallback::after {
    content: '';
    position: absolute;
    border: 1px solid rgba(230, 232, 239, 0.14);
    opacity: 0.8;
    transform: rotate(-9deg);
  }

  .scene3d.fallback::before {
    right: 8%;
    top: 16%;
    width: 32vmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 213, 74, 0.16), transparent 64%);
  }

  .scene3d.fallback::after {
    left: 6%;
    bottom: 10%;
    width: 40vmin;
    height: 12vmin;
    background: linear-gradient(90deg, transparent, rgba(229, 57, 53, 0.16), transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .scene3d {
      transition: none;
    }
  }
</style>
