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

  export let feedback = null;
  export let selected = null;
  export let questionKey = '';

  let host;
  let fallbackPulse = false;
  let fallbackMode = 'select';
  let lastKey = '';
  let lastSelectionKey = '';
  let fallbackTimer = null;
  let cleanup = () => {};
  let api = null;

  $: selectionKey = selected !== null ? `${questionKey}:${selected}` : '';
  $: if (selectionKey && selectionKey !== lastSelectionKey) {
    lastSelectionKey = selectionKey;
    runImpact('select');
  }

  $: triggerKey = feedback ? `${feedback.questionId}:${feedback.answerIndex}:${feedback.correct}:${feedback.points}` : '';
  $: if (triggerKey && triggerKey !== lastKey) {
    lastKey = triggerKey;
    runImpact(feedback.correct ? 'correct' : 'wrong');
  }

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      api = {
        burst: (mode) => {
          fallbackMode = mode;
          fallbackPulse = true;
          clearTimeout(fallbackTimer);
          fallbackTimer = setTimeout(() => {
            fallbackPulse = false;
          }, 500);
        }
      };
      return;
    }

    const lowPower = isLowPowerDevice();
    const THREE = await loadThree();
    if (!THREE || !host) {
      api = {
        burst: (mode) => {
          fallbackMode = mode;
          fallbackPulse = true;
          clearTimeout(fallbackTimer);
          fallbackTimer = setTimeout(() => {
            fallbackPulse = false;
          }, 500);
        }
      };
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !lowPower, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.76));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(-2, 2.2, 4);
    scene.add(key);

    const yellow = getCssColor('--color-yellow', '#ffd54a');
    const mint = getCssColor('--color-mint', '#36d27c');
    const cyan = getCssColor('--color-cyan', '#39d5ff');
    const hot = getCssColor('--color-accent', '#e53935');
    const danger = getCssColor('--color-danger', '#e53935');
    const shardGeometry = new THREE.TetrahedronGeometry(0.12, 0);
    const cubeGeometry = new THREE.BoxGeometry(0.105, 0.105, 0.05);
    const sparkGeometry = new THREE.IcosahedronGeometry(0.075, 0);
    const ringGeometry = new THREE.TorusGeometry(0.28, 0.012, 8, lowPower ? 28 : 42);
    const materials = {
      select: [
        new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.86, depthWrite: false }),
        new THREE.MeshBasicMaterial({ color: yellow, transparent: true, opacity: 0.82, depthWrite: false })
      ],
      correct: [
        new THREE.MeshBasicMaterial({ color: mint, transparent: true, opacity: 0.9, depthWrite: false }),
        new THREE.MeshBasicMaterial({ color: yellow, transparent: true, opacity: 0.86, depthWrite: false })
      ],
      wrong: [
        new THREE.MeshBasicMaterial({ color: danger || hot, transparent: true, opacity: 0.88, depthWrite: false }),
        new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0.76, depthWrite: false })
      ],
      ring: new THREE.MeshBasicMaterial({ color: yellow, transparent: true, opacity: 0, depthWrite: false })
    };
    let stopLoop = () => {};
    let stopResize = () => {};
    let life = 0;
    let maxLife = lowPower ? 30 : 42;
    const meshes = [];

    function clearMeshes() {
      meshes.splice(0).forEach((mesh) => {
        group.remove(mesh);
        mesh.material?.dispose?.();
      });
    }

    function burst(mode) {
      clearMeshes();
      const isSelect = mode === 'select';
      const isCorrect = mode === 'correct';
      maxLife = isSelect ? (lowPower ? 22 : 30) : (lowPower ? 34 : 46);
      life = maxLife;
      const count = isSelect ? (lowPower ? 8 : 12) : isCorrect ? (lowPower ? 14 : 24) : (lowPower ? 11 : 18);
      const pool = materials[mode] || materials.select;

      const ring = new THREE.Mesh(ringGeometry, materials.ring.clone());
      ring.userData = { ring: true, mode, rz: isCorrect ? 0.035 : -0.025 };
      ring.scale.setScalar(isSelect ? 0.72 : 0.94);
      ring.position.z = -0.04;
      meshes.push(ring);
      group.add(ring);

      for (let index = 0; index < count; index += 1) {
        const geometry = isCorrect && index % 5 === 0 ? sparkGeometry : index % 2 ? cubeGeometry : shardGeometry;
        const mesh = new THREE.Mesh(geometry, pool[index % pool.length].clone());
        const angle = (index / count) * Math.PI * 2;
        const oval = isSelect ? 0.17 : isCorrect ? 0.24 : 0.2;
        mesh.position.set(Math.cos(angle) * oval, Math.sin(angle) * oval * 0.58, (Math.random() - 0.5) * 0.25);
        mesh.userData = {
          vx: Math.cos(angle) * ((isSelect ? 0.018 : 0.032) + (index % 4) * 0.004),
          vy: Math.sin(angle) * ((isSelect ? 0.014 : 0.026) + (index % 3) * 0.005) + (isCorrect ? 0.006 : 0),
          vz: (Math.random() - 0.5) * (isSelect ? 0.012 : 0.026),
          rx: index % 2 ? 0.04 : -0.05,
          ry: index % 3 ? 0.045 : -0.04,
          rz: index % 2 ? 0.08 : -0.06,
          gravity: isCorrect ? -0.0002 : -0.00055
        };
        meshes.push(mesh);
        group.add(mesh);
      }
    }

    function animate() {
      if (life > 0) {
        life -= 1;
        const progress = life / maxLife;
        meshes.forEach((mesh) => {
          if (mesh.userData.ring) {
            mesh.rotation.z += mesh.userData.rz;
            mesh.scale.setScalar(mesh.scale.x + (mesh.userData.mode === 'select' ? 0.018 : 0.032));
            mesh.material.opacity = Math.max(0, progress * 0.5);
            return;
          }

          mesh.position.x += mesh.userData.vx;
          mesh.position.y += mesh.userData.vy;
          mesh.position.z += mesh.userData.vz;
          mesh.userData.vy += mesh.userData.gravity;
          mesh.rotation.x += mesh.userData.rx;
          mesh.rotation.y += mesh.userData.ry;
          mesh.rotation.z += mesh.userData.rz;
          mesh.scale.setScalar(0.7 + progress * 0.45);
          mesh.material.opacity = Math.max(0, progress * 0.92);
        });
      }

      renderer.render(scene, camera);
    }

    stopResize = watchRendererResize(host, renderer, camera, { maxPixelRatio: 1.2 });
    stopLoop = createAnimationLoop(animate);
    api = { burst };

    cleanup = () => {
      stopLoop();
      stopResize();
      clearMeshes();
      Object.values(materials).flat().forEach((material) => material?.dispose?.());
      shardGeometry.dispose();
      cubeGeometry.dispose();
      sparkGeometry.dispose();
      ringGeometry.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  function runImpact(mode) {
    if (!api || selected === null) return;
    api.burst(mode);
  }

  onDestroy(() => {
    clearTimeout(fallbackTimer);
    cleanup();
  });
</script>

<div bind:this={host} class:fallbackPulse class={`answer-impact impact-${fallbackMode}`} aria-hidden="true"></div>

<style>
  .answer-impact {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
  }

  .answer-impact :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .answer-impact.fallbackPulse::before {
    content: '';
    position: absolute;
    inset: 10%;
    border: 2px solid rgba(255, 213, 74, 0.36);
    opacity: 0;
    transform: scale(0.92);
    animation: impact-fallback 480ms ease-out;
  }

  .answer-impact.impact-correct::before {
    border-color: rgba(54, 210, 124, 0.5);
  }

  .answer-impact.impact-wrong::before {
    border-color: rgba(229, 57, 53, 0.5);
  }

  @keyframes impact-fallback {
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .answer-impact {
      display: none;
    }
  }
</style>
