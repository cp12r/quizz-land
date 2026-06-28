<script>
  import { onDestroy, onMount } from 'svelte';
  import { disposeObject, getCssColor, isLowPowerDevice, prefersReducedMotion, supportsWebGL } from '$lib/utils/webgl.js';

  export let results = [];
  export let revealed = false;

  let host;
  let fallback = false;
  let cleanup = () => {};
  let api = null;

  $: topPlayers = results.slice(0, 5);
  $: if (api) api.update(topPlayers, revealed);

  onMount(async () => {
    if (prefersReducedMotion() || !supportsWebGL()) {
      fallback = true;
      return;
    }

    const lowPower = isLowPowerDevice();
    const THREE = await import('three');
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    camera.position.set(0, 2.1, 9.5);
    camera.lookAt(0, 0.35, 0);

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
    const palette = [yellow, cyan, hot, mint, '#fffaf0'];

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-3, 5, 5);
    scene.add(key);

    const stage = new THREE.Group();
    scene.add(stage);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 4.25, 0.18, 7),
      new THREE.MeshStandardMaterial({ color: ink, roughness: 0.72, metalness: 0.08, transparent: true, opacity: 0.86 })
    );
    floor.position.y = -1.08;
    floor.rotation.y = Math.PI / 7;
    stage.add(floor);

    const bars = [];
    const maxBars = lowPower ? 3 : 5;
    for (let index = 0; index < maxBars; index += 1) {
      const geometry = new THREE.BoxGeometry(0.78, 1, 0.78);
      const material = new THREE.MeshStandardMaterial({
        color: palette[index % palette.length],
        roughness: 0.54,
        metalness: index === 0 ? 0.22 : 0.1,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (index - (maxBars - 1) / 2) * 1.05;
      mesh.position.y = -0.58;
      mesh.scale.y = 0.04;
      mesh.userData = { target: 0.24, delay: index * 0.05 };
      bars.push(mesh);
      stage.add(mesh);
    }

    const confetti = new THREE.Group();
    scene.add(confetti);
    const confettiCount = lowPower ? 22 : 46;
    for (let index = 0; index < confettiCount; index += 1) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.018, 0.018),
        new THREE.MeshBasicMaterial({ color: palette[index % palette.length], transparent: true, opacity: 0 })
      );
      mesh.position.set((Math.random() - 0.5) * 6, 1.4 + Math.random() * 2.2, (Math.random() - 0.5) * 1.4);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = { speed: 0.006 + Math.random() * 0.012, drift: (Math.random() - 0.5) * 0.006 };
      confetti.add(mesh);
    }

    let frame = 0;
    let isRevealed = false;

    function resize() {
      if (!host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function update(players, nextRevealed) {
      const maxScore = Math.max(1, ...players.map((player) => player.score || 0));
      bars.forEach((bar, index) => {
        const score = players[index]?.score || 0;
        bar.userData.target = 0.24 + (score / maxScore) * (index === 0 ? 2.85 : 2.25);
        bar.material.opacity = players[index] ? 0.92 : 0.12;
      });
      isRevealed = nextRevealed;
    }

    function animate(time = 0) {
      stage.rotation.y = Math.sin(time * 0.00032) * 0.08;
      bars.forEach((bar, index) => {
        const target = isRevealed ? bar.userData.target : 0.16;
        bar.scale.y += (target - bar.scale.y) * (0.075 - index * 0.004);
        bar.position.y = -1.0 + bar.scale.y / 2;
        bar.rotation.y += index === 0 ? 0.002 : 0.001;
      });

      confetti.children.forEach((piece) => {
        piece.material.opacity += ((isRevealed ? 0.74 : 0) - piece.material.opacity) * 0.05;
        if (isRevealed) {
          piece.position.y -= piece.userData.speed;
          piece.position.x += piece.userData.drift;
          piece.rotation.z += 0.025;
          if (piece.position.y < -1.1) piece.position.y = 3;
        }
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    api = { update };
    api.update(topPlayers, revealed);
    frame = requestAnimationFrame(animate);

    cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  onDestroy(() => cleanup());
</script>

<div class="score-stage" class:fallback class:revealed aria-hidden="true">
  <div bind:this={host} class="score-canvas"></div>
  {#if fallback}
    <div class="fallback-bars">
      {#each topPlayers.slice(0, 3) as player, index}
        <span style={`--bar:${Math.max(18, Math.min(100, player.score || 18))}%; --index:${index};`}></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .score-stage {
    position: relative;
    min-height: clamp(260px, 38svw, 430px);
    overflow: hidden;
    border: 1px solid rgba(255, 250, 240, 0.16);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 250, 240, 0.075), rgba(255, 250, 240, 0.025)),
      radial-gradient(circle at 50% 88%, rgba(255, 209, 102, 0.17), transparent 42%),
      rgba(23, 21, 27, 0.5);
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.28);
  }

  .score-stage::before {
    content: '';
    position: absolute;
    inset: auto 8% 9% 8%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 250, 240, 0.34), transparent);
  }

  .score-canvas {
    position: absolute;
    inset: 0;
  }

  .score-canvas :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .fallback-bars {
    position: absolute;
    inset: 18% 16% 12%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: end;
  }

  .fallback-bars span {
    min-height: var(--bar);
    border-radius: 8px 8px 2px 2px;
    background: linear-gradient(180deg, var(--color-yellow), var(--color-accent));
    opacity: 0.74;
    transform: translateY(14px);
    transition: transform 500ms ease;
  }

  .revealed .fallback-bars span {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    .score-stage {
      min-height: 280px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fallback-bars span {
      transition: none;
    }
  }
</style>
