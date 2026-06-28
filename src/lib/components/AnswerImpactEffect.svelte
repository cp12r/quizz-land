<script>
  import { onDestroy, onMount } from 'svelte';
  import { disposeObject, getCssColor, isLowPowerDevice, loadThree, prefersReducedMotion, supportsWebGL } from '$lib/utils/webgl.js';

  export let feedback = null;
  export let selected = null;

  let host;
  let fallbackPulse = false;
  let lastKey = '';
  let cleanup = () => {};
  let api = null;

  $: triggerKey = feedback ? `${feedback.questionId}:${feedback.answerIndex}:${feedback.correct}:${feedback.points}` : '';
  $: if (triggerKey && triggerKey !== lastKey) {
    lastKey = triggerKey;
    runImpact(feedback.correct ? 'correct' : 'wrong');
  }

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      api = {
        burst: () => {
          fallbackPulse = true;
          setTimeout(() => {
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
        burst: () => {
          fallbackPulse = true;
          setTimeout(() => {
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.25));
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    let frame = 0;
    let life = 0;
    const maxLife = lowPower ? 36 : 48;
    const meshes = [];

    function resize() {
      if (!host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function clearMeshes() {
      meshes.splice(0).forEach((mesh) => {
        group.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    }

    function burst(mode) {
      clearMeshes();
      life = maxLife;
      const count = lowPower ? 10 : 18;
      const color = mode === 'correct' ? getCssColor('--color-mint', '#38d996') : getCssColor('--color-danger', '#d92d55');
      const accent = mode === 'correct' ? getCssColor('--color-yellow', '#ffd166') : getCssColor('--color-accent', '#ff4f79');

      for (let index = 0; index < count; index += 1) {
        const geometry = index % 2 ? new THREE.BoxGeometry(0.11, 0.11, 0.04) : new THREE.TetrahedronGeometry(0.11, 0);
        const material = new THREE.MeshBasicMaterial({
          color: index % 3 === 0 ? accent : color,
          transparent: true,
          opacity: 0.86,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (index / count) * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.12, 0);
        mesh.userData = {
          vx: Math.cos(angle) * (0.035 + (index % 4) * 0.006),
          vy: Math.sin(angle) * (0.026 + (index % 3) * 0.006),
          rz: index % 2 ? 0.08 : -0.06
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
          mesh.position.x += mesh.userData.vx;
          mesh.position.y += mesh.userData.vy;
          mesh.rotation.z += mesh.userData.rz;
          mesh.material.opacity = Math.max(0, progress);
        });
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    frame = requestAnimationFrame(animate);
    api = { burst };

    cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      clearMeshes();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  function runImpact(mode) {
    if (!api || selected === null) return;
    api.burst(mode);
  }

  onDestroy(() => cleanup());
</script>

<div bind:this={host} class:fallbackPulse class="answer-impact" aria-hidden="true"></div>

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
    border: 2px solid rgba(255, 209, 102, 0.36);
    opacity: 0;
    transform: scale(0.92);
    animation: impact-fallback 480ms ease-out;
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
