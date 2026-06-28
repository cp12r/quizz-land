<script>
  import { onDestroy, onMount } from 'svelte';
  import { disposeObject, getCssColor, isLowPowerDevice, loadThree, prefersReducedMotion, supportsWebGL } from '$lib/utils/webgl.js';

  export let results = [];
  export let revealed = false;

  let host;
  let fallback = false;
  let cleanup = () => {};
  let api = null;

  $: topPlayers = results.slice(0, 5);
  $: topThree = results.slice(0, 3);
  $: if (api) api.update(topPlayers, revealed);

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutBack(value) {
    const amount = 1.42;
    return 1 + (amount + 1) * Math.pow(value - 1, 3) + amount * Math.pow(value - 1, 2);
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
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
    camera.position.set(0, 2.25, lowPower ? 9.7 : 8.8);
    camera.lookAt(0, 0.42, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.28));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (!lowPower) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    host.appendChild(renderer.domElement);

    const ink = getCssColor('--color-ink', '#17151b');
    const hot = getCssColor('--color-accent', '#ff4f79');
    const cyan = getCssColor('--color-cyan', '#02a6a6');
    const yellow = getCssColor('--color-yellow', '#ffd166');
    const mint = getCssColor('--color-mint', '#38d996');
    const paper = '#fffaf0';
    const bronze = '#c97b47';
    const silver = '#dce7ea';
    const gold = yellow;
    const palette = [gold, cyan, hot, mint, paper, bronze];
    const textures = [];

    scene.add(new THREE.HemisphereLight(0xfff2cf, 0x1b1730, lowPower ? 0.62 : 0.48));

    const key = new THREE.DirectionalLight(0xffdfaa, lowPower ? 1.1 : 1.45);
    key.position.set(-2.8, 5.4, 4.9);
    key.castShadow = !lowPower;
    if (!lowPower) {
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 16;
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -5;
    }
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x8ee9ff, 0.38);
    rim.position.set(3.8, 2.6, -3.7);
    scene.add(rim);

    const trophyLight = new THREE.PointLight(0xffcf75, lowPower ? 0.45 : 0.85, 6.8);
    trophyLight.position.set(0, 1.85, 1.35);
    scene.add(trophyLight);

    const stage = new THREE.Group();
    stage.position.y = 0.04;
    scene.add(stage);

    function createMaterial(options) {
      return new THREE.MeshStandardMaterial({
        roughness: 0.58,
        metalness: 0.08,
        transparent: true,
        ...options
      });
    }

    function makeTexture(svg) {
      const texture = new THREE.TextureLoader().load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = lowPower ? 1 : 4;
      textures.push(texture);
      return texture;
    }

    function badgeSvg(rank, color, accent) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128">
          <defs>
            <linearGradient id="shine" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#fffaf0" stop-opacity=".86"/>
              <stop offset=".42" stop-color="${color}" stop-opacity=".96"/>
              <stop offset="1" stop-color="${accent}" stop-opacity=".86"/>
            </linearGradient>
          </defs>
          <path d="M23 18h171l39 31v55H62l-39-31V18Z" fill="url(#shine)"/>
          <path d="M23 18h171l39 31v55H62l-39-31V18Z" fill="none" stroke="#17151b" stroke-opacity=".52" stroke-width="7"/>
          <path d="M44 31h132" stroke="#17151b" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/>
          <text x="128" y="86" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="52" font-weight="900" fill="#17151b">#${rank}</text>
        </svg>
      `;
    }

    function starSvg(color) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
          <path d="m48 8 10 26 28 3-22 18 7 27-23-15-23 15 7-27-22-18 28-3L48 8Z" fill="${color}"/>
          <path d="m48 8 10 26 28 3-22 18 7 27-23-15-23 15 7-27-22-18 28-3L48 8Z" fill="none" stroke="#17151b" stroke-opacity=".35" stroke-width="5" stroke-linejoin="round"/>
        </svg>
      `;
    }

    function rankIconSvg(rank, color, accent) {
      const icons = {
        1: `
          <path d="M24 47 40 64l24-35 24 35 16-17 7 48H17l7-48Z" fill="${color}"/>
          <path d="M33 90h62" stroke="#17151b" stroke-opacity=".6" stroke-width="8" stroke-linecap="round"/>
          <circle cx="64" cy="29" r="8" fill="${accent}"/>
          <circle cx="24" cy="47" r="7" fill="${accent}"/>
          <circle cx="104" cy="47" r="7" fill="${accent}"/>
        `,
        2: `
          <path d="M72 18c18 6 31 24 34 45L82 87 58 63 72 18Z" fill="${color}"/>
          <path d="M58 63 35 69l17 17-6 24 24-7 12-16-24-24Z" fill="${accent}"/>
          <circle cx="78" cy="49" r="10" fill="#fffaf0"/>
          <circle cx="78" cy="49" r="10" fill="none" stroke="#17151b" stroke-opacity=".45" stroke-width="5"/>
          <path d="M40 88 24 104M52 98l-9 13" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
        `,
        3: `
          <path d="M73 13 28 73h30l-8 42 50-67H69l4-35Z" fill="${color}"/>
          <path d="M73 13 28 73h30l-8 42 50-67H69l4-35Z" fill="none" stroke="#17151b" stroke-opacity=".48" stroke-width="8" stroke-linejoin="round"/>
          <path d="M30 35 18 26M102 91l13 10M101 26l12-9" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
        `
      };

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <defs>
            <radialGradient id="iconGlow" cx="35%" cy="28%" r="68%">
              <stop offset="0" stop-color="#fffaf0" stop-opacity=".95"/>
              <stop offset=".42" stop-color="${color}" stop-opacity=".84"/>
              <stop offset="1" stop-color="${accent}" stop-opacity=".68"/>
            </radialGradient>
          </defs>
          <circle cx="64" cy="64" r="54" fill="url(#iconGlow)" opacity=".32"/>
          ${icons[rank] || icons[3]}
        </svg>
      `;
    }

    function podiumGlyphSvg(rank, color, accent) {
      const crown = rank === 1
        ? '<path d="M78 34 96 56l32-31 32 31 18-22 11 56H67l11-56Z" fill="#17151b" fill-opacity=".2"/><path d="M80 37 96 56l32-31 32 31 16-19 8 49H72l8-49Z" fill="#fffaf0" fill-opacity=".58"/>'
        : '';

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 112">
          <defs>
            <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#fffaf0" stop-opacity=".72"/>
              <stop offset=".46" stop-color="${color}" stop-opacity=".62"/>
              <stop offset="1" stop-color="${accent}" stop-opacity=".42"/>
            </linearGradient>
            <linearGradient id="stripe" x1="0" x2="1">
              <stop offset="0" stop-color="${accent}" stop-opacity=".0"/>
              <stop offset=".5" stop-color="${accent}" stop-opacity=".78"/>
              <stop offset="1" stop-color="${accent}" stop-opacity=".0"/>
            </linearGradient>
          </defs>
          <path d="M20 17h216v78H20z" rx="18" fill="url(#panel)"/>
          <path d="M20 17h216v78H20z" rx="18" fill="none" stroke="#17151b" stroke-opacity=".28" stroke-width="5"/>
          <path d="M40 76h176" stroke="url(#stripe)" stroke-width="9" stroke-linecap="round"/>
          <path d="M54 40h42l18 16-18 16H54l18-16-18-16Zm106 0h42l-18 16 18 16h-42l-18-16 18-16Z" fill="#17151b" fill-opacity=".18"/>
          ${crown}
          <circle cx="128" cy="56" r="23" fill="#17151b" fill-opacity=".22"/>
          <circle cx="128" cy="56" r="18" fill="#fffaf0" fill-opacity=".68"/>
          <text x="128" y="66" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="28" font-weight="900" fill="#17151b">${rank}</text>
        </svg>
      `;
    }

    function sideMedalSvg(rank, color, accent) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160">
          <defs>
            <linearGradient id="medal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#fffaf0" stop-opacity=".82"/>
              <stop offset=".55" stop-color="${color}" stop-opacity=".72"/>
              <stop offset="1" stop-color="${accent}" stop-opacity=".48"/>
            </linearGradient>
          </defs>
          <path d="M24 12h80l-18 52H42L24 12Z" fill="${accent}" fill-opacity=".62"/>
          <circle cx="64" cy="94" r="39" fill="url(#medal)"/>
          <circle cx="64" cy="94" r="39" fill="none" stroke="#17151b" stroke-opacity=".32" stroke-width="6"/>
          <path d="M43 94h42M64 73v42" stroke="#17151b" stroke-opacity=".22" stroke-width="8" stroke-linecap="round"/>
          <text x="64" y="105" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#17151b">#${rank}</text>
        </svg>
      `;
    }

    function createRoundedBlockGeometry(width, height, depth, radius = 0.16) {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -depth / 2;
      const right = width / 2;
      const bottom = depth / 2;
      const r = Math.min(radius, width / 2 - 0.01, depth / 2 - 0.01);

      shape.moveTo(x + r, y);
      shape.lineTo(right - r, y);
      shape.quadraticCurveTo(right, y, right, y + r);
      shape.lineTo(right, bottom - r);
      shape.quadraticCurveTo(right, bottom, right - r, bottom);
      shape.lineTo(x + r, bottom);
      shape.quadraticCurveTo(x, bottom, x, bottom - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: lowPower ? 2 : 4,
        curveSegments: lowPower ? 6 : 10
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.computeVertexNormals();
      return geometry;
    }

    const islandTopMaterial = createMaterial({ color: ink, roughness: 0.68, metalness: 0.05, opacity: 0.94 });
    const islandSideMaterial = createMaterial({ color: '#231a2c', roughness: 0.78, metalness: 0.04, opacity: 0.9 });
    const islandGlowMaterial = new THREE.MeshBasicMaterial({
      color: yellow,
      transparent: true,
      opacity: lowPower ? 0.08 : 0.13,
      depthWrite: false
    });

    const island = new THREE.Group();
    island.position.y = -1.24;
    stage.add(island);

    const islandBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.95, 4.55, 0.42, lowPower ? 9 : 12),
      [islandSideMaterial, islandTopMaterial, islandSideMaterial]
    );
    islandBase.rotation.y = Math.PI / 12;
    islandBase.receiveShadow = !lowPower;
    island.add(islandBase);

    const islandUnder = new THREE.Mesh(
      new THREE.CylinderGeometry(3.25, 4.2, 0.48, lowPower ? 9 : 12),
      islandSideMaterial
    );
    islandUnder.position.y = -0.38;
    islandUnder.rotation.y = -Math.PI / 12;
    island.add(islandUnder);

    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(3.38, 0.035, 8, lowPower ? 44 : 72), islandGlowMaterial);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.25;
    island.add(glowRing);

    const podiumLayouts = [
      { resultIndex: 1, rank: 2, x: -1.55, z: 0.2, width: 1.22, height: 1.04, depth: 1.05, color: silver, accent: cyan, delay: 170 },
      { resultIndex: 0, rank: 1, x: 0, z: -0.06, width: 1.42, height: 1.52, depth: 1.16, color: gold, accent: hot, delay: 0 },
      { resultIndex: 2, rank: 3, x: 1.55, z: 0.26, width: 1.14, height: 0.82, depth: 1.0, color: bronze, accent: yellow, delay: 260 }
    ];

    const plaqueGeometry = new THREE.PlaneGeometry(0.86, 0.43);
    const podiumGlyphGeometry = new THREE.PlaneGeometry(1.05, 0.46);
    const sideMedalGeometry = new THREE.PlaneGeometry(0.34, 0.42);
    const starGeometry = new THREE.PlaneGeometry(0.18, 0.18);
    const rankIconGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const rankIconDiscGeometry = new THREE.CircleGeometry(0.34, lowPower ? 30 : 48);
    const rankIconRingGeometry = new THREE.TorusGeometry(0.37, 0.018, 8, lowPower ? 32 : 52);
    const winnerHaloGeometry = new THREE.TorusGeometry(0.42, 0.018, 8, lowPower ? 36 : 56);
    const podiums = podiumLayouts.map((layout) => {
      const group = new THREE.Group();
      group.position.set(layout.x, -2.1, layout.z);
      group.scale.setScalar(0.92);
      group.userData = {
        baseY: -1.02,
        delay: layout.delay,
        height: layout.height,
        rank: layout.rank,
        hasPlayer: false
      };

      const blockMaterial = createMaterial({
        color: layout.color,
        roughness: layout.rank === 1 ? 0.42 : 0.56,
        metalness: layout.rank === 1 ? 0.16 : 0.08,
        opacity: 0.96
      });
      const block = new THREE.Mesh(
        createRoundedBlockGeometry(layout.width, layout.height, layout.depth, layout.rank === 1 ? 0.2 : 0.16),
        blockMaterial
      );
      block.castShadow = !lowPower;
      block.receiveShadow = !lowPower;
      group.add(block);

      const rimMaterial = new THREE.MeshBasicMaterial({
        color: layout.accent,
        transparent: true,
        opacity: layout.rank === 1 ? 0.34 : 0.18,
        depthWrite: false
      });
      const rim = new THREE.Mesh(new THREE.BoxGeometry(layout.width * 0.72, 0.035, 0.035), rimMaterial);
      rim.position.set(0, layout.height - 0.08, layout.depth / 2 + 0.024);
      group.add(rim);

      const glyphTexture = makeTexture(podiumGlyphSvg(layout.rank, layout.color, layout.accent));
      const glyph = new THREE.Mesh(
        podiumGlyphGeometry,
        new THREE.MeshBasicMaterial({
          map: glyphTexture,
          transparent: true,
          opacity: layout.rank === 1 ? 0.66 : 0.52,
          depthWrite: false,
          toneMapped: false
        })
      );
      glyph.position.set(0, layout.height * 0.34, layout.depth / 2 + 0.045);
      glyph.scale.set(layout.width / 1.32, layout.rank === 1 ? 1.08 : 0.96, 1);
      group.add(glyph);

      const sideMedalTexture = makeTexture(sideMedalSvg(layout.rank, layout.color, layout.accent));
      [-1, 1].forEach((side) => {
        const medal = new THREE.Mesh(
          sideMedalGeometry,
          new THREE.MeshBasicMaterial({
            map: sideMedalTexture,
            transparent: true,
            opacity: layout.rank === 1 ? 0.58 : 0.44,
            depthWrite: false,
            toneMapped: false
          })
        );
        medal.position.set(side * (layout.width / 2 + 0.035), layout.height * 0.58, 0.06);
        medal.rotation.y = side * Math.PI / 2;
        medal.scale.setScalar(layout.rank === 1 ? 1.1 : 0.96);
        group.add(medal);
      });

      const plaqueTexture = makeTexture(badgeSvg(layout.rank, layout.color, layout.accent));
      const plaque = new THREE.Mesh(
        plaqueGeometry,
        new THREE.MeshBasicMaterial({
          map: plaqueTexture,
          transparent: true,
          opacity: 0.96,
          depthWrite: false,
          toneMapped: false
        })
      );
      plaque.position.set(0, layout.height * 0.55, layout.depth / 2 + 0.04);
      plaque.scale.setScalar(layout.rank === 1 ? 1.1 : 0.96);
      group.add(plaque);

      const rankIcon = new THREE.Group();
      rankIcon.position.set(0, layout.height + 0.36, layout.depth / 2 + 0.08);

      const iconShadow = new THREE.Mesh(
        rankIconDiscGeometry,
        new THREE.MeshBasicMaterial({
          color: ink,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      iconShadow.position.set(0.035, -0.04, -0.025);
      iconShadow.scale.set(1.16, 1.06, 1);
      rankIcon.add(iconShadow);

      const iconDisc = new THREE.Mesh(
        rankIconDiscGeometry,
        createMaterial({
          color: layout.rank === 1 ? yellow : layout.color,
          roughness: 0.34,
          metalness: layout.rank === 1 ? 0.16 : 0.08,
          opacity: 0.92,
          side: THREE.DoubleSide
        })
      );
      iconDisc.castShadow = !lowPower;
      rankIcon.add(iconDisc);

      const iconRing = new THREE.Mesh(
        rankIconRingGeometry,
        new THREE.MeshBasicMaterial({
          color: layout.accent,
          transparent: true,
          opacity: layout.rank === 1 ? 0.86 : 0.66,
          depthWrite: false
        })
      );
      iconRing.position.z = 0.026;
      rankIcon.add(iconRing);

      const iconTexture = makeTexture(rankIconSvg(layout.rank, layout.rank === 1 ? yellow : layout.accent, layout.rank === 1 ? hot : paper));
      const iconGlyph = new THREE.Mesh(
        rankIconGeometry,
        new THREE.MeshBasicMaterial({
          map: iconTexture,
          transparent: true,
          opacity: 0.96,
          depthWrite: false,
          toneMapped: false
        })
      );
      iconGlyph.position.z = 0.045;
      rankIcon.add(iconGlyph);
      group.add(rankIcon);

      if (layout.rank === 1) {
        const halo = new THREE.Mesh(
          winnerHaloGeometry,
          new THREE.MeshBasicMaterial({ color: yellow, transparent: true, opacity: 0.42, depthWrite: false })
        );
        halo.position.set(0, layout.height + 0.58, -0.02);
        halo.rotation.x = Math.PI / 2;
        group.add(halo);
      }

      const starTexture = makeTexture(starSvg(layout.rank === 1 ? yellow : layout.accent));
      for (let starIndex = 0; starIndex < (layout.rank === 1 && !lowPower ? 4 : 2); starIndex += 1) {
        const star = new THREE.Mesh(
          starGeometry,
          new THREE.MeshBasicMaterial({
            map: starTexture,
            transparent: true,
            opacity: layout.rank === 1 ? 0.68 : 0.42,
            depthWrite: false,
            toneMapped: false
          })
        );
        const side = starIndex % 2 === 0 ? -1 : 1;
        star.position.set(side * (layout.width * 0.34 + starIndex * 0.03), layout.height + 0.5 + (starIndex % 3) * 0.13, 0.15);
        star.rotation.z = side * 0.28;
        group.add(star);
      }

      stage.add(group);
      return { ...layout, group, rankIcon, block };
    });

    const trophy = new THREE.Group();
    trophy.position.set(0, -0.05, -0.62);
    stage.add(trophy);

    const trophyMaterial = createMaterial({ color: yellow, roughness: 0.36, metalness: 0.24, opacity: 0.98 });
    const trophyPoints = [
      new THREE.Vector2(0.14, 0),
      new THREE.Vector2(0.3, 0.06),
      new THREE.Vector2(0.38, 0.42),
      new THREE.Vector2(0.3, 0.66),
      new THREE.Vector2(0.18, 0.74)
    ];
    const cup = new THREE.Mesh(new THREE.LatheGeometry(trophyPoints, lowPower ? 18 : 28), trophyMaterial);
    cup.position.y = 1.65;
    cup.castShadow = !lowPower;
    trophy.add(cup);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.38, lowPower ? 16 : 24), trophyMaterial);
    trophyStem.position.y = 1.4;
    trophyStem.castShadow = !lowPower;
    trophy.add(trophyStem);

    const trophyBase = new THREE.Mesh(createRoundedBlockGeometry(0.62, 0.18, 0.42, 0.07), trophyMaterial);
    trophyBase.position.y = 1.18;
    trophyBase.castShadow = !lowPower;
    trophy.add(trophyBase);

    const trophyHandles = [-1, 1].map((side) => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.026, 8, lowPower ? 20 : 32), trophyMaterial);
      handle.position.set(side * 0.35, 1.98, 0);
      handle.rotation.y = Math.PI / 2;
      handle.scale.set(0.82, 1.18, 1);
      handle.castShadow = !lowPower;
      trophy.add(handle);
      return handle;
    });

    const challengerCards = [];
    if (!lowPower) {
      [3, 4].forEach((resultIndex, sideIndex) => {
        const side = sideIndex === 0 ? -1 : 1;
        const card = new THREE.Group();
        card.position.set(side * 2.88, -1.02, 0.62);
        card.rotation.y = side * -0.18;

        const cardBlock = new THREE.Mesh(
          createRoundedBlockGeometry(0.88, 0.26, 0.56, 0.1),
          createMaterial({ color: sideIndex === 0 ? cyan : mint, roughness: 0.64, metalness: 0.05, opacity: 0.78 })
        );
        card.add(cardBlock);

        const cardPlaque = new THREE.Mesh(
          new THREE.PlaneGeometry(0.58, 0.28),
          new THREE.MeshBasicMaterial({
            map: makeTexture(badgeSvg(resultIndex + 1, sideIndex === 0 ? cyan : mint, paper)),
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            toneMapped: false
          })
        );
        cardPlaque.position.set(0, 0.15, 0.3);
        card.add(cardPlaque);
        stage.add(card);
        challengerCards.push({ resultIndex, group: card });
      });
    }

    const confetti = new THREE.Group();
    scene.add(confetti);
    const confettiGeometry = new THREE.PlaneGeometry(0.07, 0.032);
    const confettiMaterials = palette.slice(0, 5).map(
      (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
    );
    const confettiPieces = [];
    const confettiCount = lowPower ? 20 : 42;
    for (let index = 0; index < confettiCount; index += 1) {
      const mesh = new THREE.Mesh(confettiGeometry, confettiMaterials[index % confettiMaterials.length]);
      const origin = {
        x: (Math.random() - 0.5) * 5.8,
        y: 1.45 + Math.random() * 1.9,
        z: -0.35 + Math.random() * 1.2
      };
      mesh.position.set(origin.x, origin.y, origin.z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        origin,
        speed: 0.007 + Math.random() * 0.012,
        drift: (Math.random() - 0.5) * 0.008,
        spin: 0.02 + Math.random() * 0.035
      };
      confettiPieces.push(mesh);
      confetti.add(mesh);
    }

    const moteCount = lowPower ? 28 : 62;
    const motePositions = new Float32Array(moteCount * 3);
    for (let index = 0; index < moteCount; index += 1) {
      const offset = index * 3;
      motePositions[offset] = (Math.random() - 0.5) * 5.4;
      motePositions[offset + 1] = -0.55 + Math.random() * 2.8;
      motePositions[offset + 2] = (Math.random() - 0.5) * 1.9;
    }
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMaterial = new THREE.PointsMaterial({
      color: yellow,
      size: lowPower ? 0.025 : 0.034,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const motes = new THREE.Points(moteGeometry, moteMaterial);
    scene.add(motes);

    let frame = 0;
    let isRevealed = false;
    let revealStartedAt = 0;
    let confettiResetKey = 0;

    function resize() {
      if (!host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function resetConfetti() {
      confettiPieces.forEach((piece) => {
        const { origin } = piece.userData;
        piece.position.set(origin.x, origin.y, origin.z);
        piece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      });
    }

    function update(players, nextRevealed) {
      podiums.forEach((podium) => {
        podium.group.userData.hasPlayer = Boolean(players[podium.resultIndex]);
      });
      challengerCards.forEach((card) => {
        card.group.visible = Boolean(players[card.resultIndex]);
      });

      if (nextRevealed && !isRevealed) {
        revealStartedAt = performance.now();
        confettiResetKey += 1;
        resetConfetti();
      }

      if (!nextRevealed) {
        revealStartedAt = 0;
      }

      isRevealed = nextRevealed;
    }

    function revealProgress(time, delay) {
      if (!isRevealed || !revealStartedAt) return 0;
      return clamp((time - revealStartedAt - delay) / 720);
    }

    function animate(time = 0) {
      const idle = lowPower ? 0 : Math.sin(time * 0.0006) * 0.018;
      stage.rotation.y = Math.sin(time * 0.00022) * (lowPower ? 0.025 : 0.055);
      stage.position.y = idle;

      camera.position.x = Math.sin(time * 0.00018) * (lowPower ? 0.05 : 0.11);
      camera.position.y = 2.24 + Math.sin(time * 0.00024) * (lowPower ? 0.015 : 0.035);
      camera.lookAt(0, 0.42, 0);

      podiums.forEach((podium, index) => {
        const progress = revealProgress(time, podium.delay);
        const eased = easeOutBack(progress);
        const visibleTarget = podium.group.userData.hasPlayer ? 1 : 0.05;
        const rise = (podium.rank === 1 ? 0.2 : 0) * progress;
        podium.group.position.y = -2.08 + (-1.02 + rise + 2.08) * eased;
        const scale = (0.82 + 0.18 * eased) * visibleTarget;
        podium.group.scale.set(scale, scale, scale);
        podium.group.rotation.y = Math.sin(time * 0.001 + index) * 0.025;
        podium.rankIcon.position.y = podium.height + 0.36 + Math.sin(time * 0.002 + index) * (podium.rank === 1 ? 0.055 : 0.035);
        podium.rankIcon.rotation.z = Math.sin(time * 0.0014 + index) * (podium.rank === 1 ? 0.055 : 0.035);
      });

      const trophyProgress = revealProgress(time, 360);
      trophy.position.y = -0.54 + easeOutBack(trophyProgress) * 0.49 + Math.sin(time * 0.0014) * 0.012;
      trophy.rotation.y = Math.sin(time * 0.00072) * 0.08;
      trophyHandles.forEach((handle, index) => {
        handle.rotation.z = Math.sin(time * 0.0013 + index) * 0.06;
      });

      challengerCards.forEach((card, index) => {
        const progress = revealProgress(time, 520 + index * 90);
        card.group.scale.setScalar(0.82 + easeOutBack(progress) * 0.18);
        card.group.position.y = -1.35 + easeOutBack(progress) * 0.33;
      });

      const confettiActive = isRevealed && revealStartedAt && time - revealStartedAt < 3600;
      confettiPieces.forEach((piece, index) => {
        const burstOffset = confettiResetKey * 0.001 + index;
        const targetOpacity = confettiActive ? 0.58 : 0;
        piece.material.opacity += (targetOpacity - piece.material.opacity) * 0.08;
        if (confettiActive) {
          piece.position.y -= piece.userData.speed;
          piece.position.x += piece.userData.drift;
          piece.position.z += Math.sin(time * 0.002 + burstOffset) * 0.0015;
          piece.rotation.z += piece.userData.spin;
          piece.rotation.x += 0.008;
          if (piece.position.y < -1.2) piece.position.y = 2.7;
        }
      });

      moteMaterial.opacity += ((isRevealed ? 0.28 : 0.03) - moteMaterial.opacity) * 0.045;
      motes.rotation.y = time * 0.00004;
      glowRing.material.opacity = lowPower ? 0.08 : 0.12 + Math.sin(time * 0.0015) * 0.025;

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
      plaqueGeometry.dispose();
      podiumGlyphGeometry.dispose();
      sideMedalGeometry.dispose();
      starGeometry.dispose();
      rankIconGeometry.dispose();
      rankIconDiscGeometry.dispose();
      rankIconRingGeometry.dispose();
      winnerHaloGeometry.dispose();
      confettiGeometry.dispose();
      moteGeometry.dispose();
      moteMaterial.dispose();
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      api = null;
    };
  });

  onDestroy(() => {
    cleanup();
  });
</script>

<div class="score-stage" class:fallback class:revealed aria-label="Scène de victoire finale">
  <div bind:this={host} class="score-canvas" aria-hidden="true"></div>

  {#if fallback}
    <div class="fallback-podium" aria-hidden="true">
      {#each topThree as player, index}
        <span class={`fallback-step fallback-step-${index + 1}`}>
          <b>#{index + 1}</b>
          <i style={`--fallback-score:${Math.max(24, Math.min(100, player.score || 24))}%;`}></i>
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .score-stage {
    --stage-ink: #17151b;
    --stage-paper: #fffaf0;
    --stage-muted: rgba(255, 250, 240, 0.72);
    --stage-line: rgba(255, 250, 240, 0.16);
    position: relative;
    min-height: clamp(340px, 46svw, 540px);
    overflow: hidden;
    border: 1px solid var(--stage-line);
    border-radius: 8px;
    background:
      radial-gradient(circle at 50% 79%, rgba(255, 209, 102, 0.2), transparent 37%),
      radial-gradient(circle at 50% 18%, rgba(255, 250, 240, 0.12), transparent 34%),
      linear-gradient(180deg, rgba(255, 250, 240, 0.08), rgba(255, 250, 240, 0.026)),
      rgba(23, 21, 27, 0.55);
    box-shadow: 0 30px 78px rgba(0, 0, 0, 0.3);
  }

  .score-stage::before {
    content: '';
    position: absolute;
    inset: auto 9% 11% 9%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 250, 240, 0.32), transparent);
  }

  .score-stage::after {
    content: '';
    position: absolute;
    inset: 10% 18% auto;
    height: 28%;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 50%, rgba(255, 209, 102, 0.14), transparent 68%);
    opacity: 0;
    transition: opacity 500ms ease;
  }

  .score-stage.revealed::after {
    opacity: 1;
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

  .fallback-podium {
    position: absolute;
    inset: 18% 14% 24%;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.9fr);
    grid-template-areas: 'second first third';
    gap: 12px;
    align-items: end;
  }

  .fallback-step {
    position: relative;
    display: grid;
    min-height: var(--fallback-score);
    place-items: center;
    overflow: hidden;
    border: 1px solid rgba(255, 250, 240, 0.18);
    border-radius: 8px 8px 3px 3px;
    background:
      linear-gradient(180deg, rgba(255, 250, 240, 0.22), rgba(255, 250, 240, 0.05)),
      rgba(23, 21, 27, 0.78);
    transform: translateY(18px);
    transition: transform 520ms cubic-bezier(0.16, 1.25, 0.3, 1);
  }

  .fallback-step i {
    position: absolute;
    inset: auto 0 0;
    height: var(--fallback-score);
    background: linear-gradient(180deg, var(--color-yellow), var(--color-accent));
    opacity: 0.62;
  }

  .fallback-step b {
    position: relative;
    z-index: 1;
    color: var(--stage-paper);
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.2rem;
    font-style: normal;
    font-weight: 950;
  }

  .fallback-step-1 {
    grid-area: first;
  }

  .fallback-step-2 {
    grid-area: second;
  }

  .fallback-step-3 {
    grid-area: third;
  }

  .revealed .fallback-step {
    transform: translateY(0);
  }

  @media (max-width: 720px) {
    .score-stage {
      min-height: clamp(560px, 150svw, 640px);
    }

    .fallback-podium {
      inset: 16% 12% 34%;
    }
  }

  @media (max-width: 480px) {
    .score-stage {
      min-height: 600px;
    }

  }

  @media (prefers-reduced-motion: reduce) {
    .score-stage::after,
    .fallback-step {
      transition: none;
    }
  }
</style>
