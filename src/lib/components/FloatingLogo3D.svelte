<script>
  import { onDestroy, onMount } from 'svelte';
  import {
    createAnimationLoop,
    disposeObject,
    isLowPowerDevice,
    loadThree,
    prefersReducedMotion,
    supportsWebGL,
    watchRendererResize
  } from '$lib/utils/webgl.js';

  let host;
  let fallback = false;
  let ready = false;
  let cleanup = () => {};

  function createLogoTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 484, 82);
    const bg = ctx.createRadialGradient(256, 214, 20, 256, 256, 350);
    bg.addColorStop(0, '#121a38');
    bg.addColorStop(0.58, '#050918');
    bg.addColorStop(1, '#01030a');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.48)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 18;
    const red = ctx.createLinearGradient(130, 86, 398, 426);
    red.addColorStop(0, '#ff3b38');
    red.addColorStop(0.52, '#f80716');
    red.addColorStop(1, '#9f0009');
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.arc(251, 244, 153, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(344, 355);
    ctx.lineTo(426, 426);
    ctx.quadraticCurveTo(445, 443, 424, 457);
    ctx.lineTo(394, 457);
    ctx.quadraticCurveTo(383, 457, 374, 448);
    ctx.lineTo(318, 392);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(414, 414, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#f8f8fc';
    ctx.shadowColor = 'rgba(70,0,6,.32)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(251, 244, 109, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#3b0007';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(247, 235, 133, Math.PI * 1.05, Math.PI * 1.76);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(70,0,6,.42)';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 8;
    const bolt = ctx.createLinearGradient(215, 134, 328, 374);
    bolt.addColorStop(0, '#ffe65a');
    bolt.addColorStop(0.44, '#ffb400');
    bolt.addColorStop(1, '#f17300');
    ctx.fillStyle = bolt;
    ctx.strokeStyle = '#ed8700';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(292, 132);
    ctx.lineTo(179, 280);
    ctx.lineTo(247, 280);
    ctx.lineTo(229, 379);
    ctx.lineTo(346, 219);
    ctx.lineTo(276, 219);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const texture = createLogoTexture(THREE);
    texture.anisotropy = lowPower ? 1 : 4;

    const group = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(1.18, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffd54a,
        transparent: true,
        opacity: 0.08,
        depthWrite: false
      })
    );
    glow.position.z = -0.08;

    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.18, 2.18),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    );
    group.add(glow, logo);
    scene.add(group);

    let stopLoop = () => {};
    let stopResize = () => {};

    function animate(time = 0) {
      group.position.y = Math.sin(time * 0.0013) * 0.12;
      group.rotation.y = Math.sin(time * 0.0009) * 0.34;
      group.rotation.x = Math.cos(time * 0.0008) * 0.08;
      group.rotation.z = Math.sin(time * 0.0011) * 0.035;
      glow.scale.setScalar(1 + Math.sin(time * 0.002) * 0.045);
      renderer.render(scene, camera);
    }

    stopResize = watchRendererResize(host, renderer, camera, { maxPixelRatio: 1.35 });
    ready = true;
    stopLoop = createAnimationLoop(animate);

    cleanup = () => {
      stopLoop();
      stopResize();
      disposeObject(scene);
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  onDestroy(() => cleanup());
</script>

<div bind:this={host} class:ready class:fallback class="floating-logo3d" aria-label="Logo Quizz Land animé en 3D">
  {#if fallback}
    <img src="/brand/quizzland-logo.svg" alt="Quizz Land" />
  {/if}
</div>

<style>
  .floating-logo3d {
    width: clamp(112px, 12vw, 172px);
    aspect-ratio: 1;
    opacity: 0;
    transition:
      opacity 420ms ease,
      transform 420ms ease;
    transform: translateY(8px) rotate(-4deg);
    filter: drop-shadow(0 20px 28px rgba(0, 0, 0, 0.28));
    pointer-events: none;
  }

  .floating-logo3d.ready,
  .floating-logo3d.fallback {
    opacity: 1;
    transform: translateY(0) rotate(-4deg);
  }

  .floating-logo3d :global(canvas),
  .floating-logo3d img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .floating-logo3d img {
    object-fit: contain;
  }

  @media (max-width: 860px) {
    .floating-logo3d {
      width: 116px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .floating-logo3d {
      transition: none;
      transform: none;
    }
  }
</style>
