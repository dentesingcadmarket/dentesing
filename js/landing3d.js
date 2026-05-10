// ══════════════════════════════════════════
// D·CONSOLE — 3D Landing Dental Crown
// Three.js ile dönen diş tacı wireframe
// ══════════════════════════════════════════

(function() {
  'use strict';

  let landingRenderer, landingScene, landingCamera;
  let crownGroup, gridLines;
  let landingFrameId = null;
  let landingContainer = null;

  // Diş tacı profil noktaları (LatheGeometry için)
  const crownProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.6, 0.05),
    new THREE.Vector2(1.4, 0.2),
    new THREE.Vector2(1.9, 0.5),
    new THREE.Vector2(2.1, 0.9),
    new THREE.Vector2(2.0, 1.5),
    new THREE.Vector2(1.8, 2.0),
    new THREE.Vector2(1.5, 2.5),
    new THREE.Vector2(1.2, 2.9),
    new THREE.Vector2(0.9, 3.2),
    new THREE.Vector2(0.7, 3.5),
    new THREE.Vector2(0.5, 3.7),
    new THREE.Vector2(0.25, 3.85),
    new THREE.Vector2(0.05, 3.95),
    new THREE.Vector2(0, 4.0),
  ];

  function buildCrown() {
    const group = new THREE.Group();

    // Ana taç geometrisi
    const latheGeo = new THREE.LatheGeometry(crownProfile, 32);
    const meshMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a40,
      emissive: 0x0a1540,
      transparent: true,
      opacity: 0.18,
      side: THREE.FrontSide,
    });
    const crownMesh = new THREE.Mesh(latheGeo, meshMat);
    group.add(crownMesh);

    // Wireframe kenarlar
    const edgeGeo = new THREE.EdgesGeometry(latheGeo, 15);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x2a6fff,
      transparent: true,
      opacity: 0.7,
    });
    const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(wireframe);

    // Altın yatay kontur halkalar
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const y = t * 4.0;
      const profilePoint = crownProfile.find(p => Math.abs(p.y - y) < 0.35) || crownProfile[Math.floor(t * (crownProfile.length - 1))];
      const radius = profilePoint ? profilePoint.x * 1.0 : 1.2;
      const ringGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xe8b840 : 0x4a7fff,
        transparent: true,
        opacity: 0.25 + t * 0.15,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y - 2.0;
      group.add(ring);
    }

    // Altın glow merkezi nokta
    const glowGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xe8b840, transparent: true, opacity: 0.9 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 2.0;
    group.add(glow);

    group.position.y = -2.0;
    return group;
  }

  function buildGrid() {
    const group = new THREE.Group();
    const gridSize = 20;
    const step = 1.4;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1a2d60, transparent: true, opacity: 0.35 });

    for (let i = -gridSize; i <= gridSize; i += step) {
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize, 0, i),
        new THREE.Vector3(gridSize, 0, i),
      ]);
      group.add(new THREE.Line(hGeo, lineMat));

      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0, -gridSize),
        new THREE.Vector3(i, 0, gridSize),
      ]);
      group.add(new THREE.Line(vGeo, lineMat));
    }

    group.position.y = -2.6;
    group.rotation.x = THREE.MathUtils.degToRad(60);
    return group;
  }

  function buildFloatingParticles() {
    const geo = new THREE.BufferGeometry();
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x3a7fff,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Points(geo, mat);
  }

  let startTime = 0;

  function landingTick(now) {
    landingFrameId = requestAnimationFrame(landingTick);
    const t = (now - startTime) / 1000;

    if (crownGroup) {
      crownGroup.rotation.y = t * 0.35;
      crownGroup.rotation.x = Math.sin(t * 0.18) * 0.08;
      crownGroup.position.y = -2.0 + Math.sin(t * 0.6) * 0.18;
    }
    if (gridLines) {
      gridLines.rotation.z = t * 0.04;
    }

    landingRenderer.render(landingScene, landingCamera);
  }

  window.initLanding3D = function(canvasId) {
    if (typeof THREE === 'undefined') return;
    landingContainer = document.getElementById(canvasId);
    if (!landingContainer) return;

    const w = landingContainer.parentElement.clientWidth || window.innerWidth;
    const h = landingContainer.parentElement.clientHeight || window.innerHeight;

    landingScene = new THREE.Scene();

    // Işıklar
    landingScene.add(new THREE.AmbientLight(0x0a0a1a, 0.5));
    const blueLight = new THREE.PointLight(0x2a6fff, 3, 18);
    blueLight.position.set(-4, 3, 3);
    landingScene.add(blueLight);
    const goldLight = new THREE.PointLight(0xe8b840, 2, 14);
    goldLight.position.set(4, 1, -2);
    landingScene.add(goldLight);
    const topLight = new THREE.PointLight(0xffffff, 0.6, 12);
    topLight.position.set(0, 6, 2);
    landingScene.add(topLight);

    landingCamera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    landingCamera.position.set(0, 1.2, 9);
    landingCamera.lookAt(0, 0, 0);

    landingRenderer = new THREE.WebGLRenderer({
      canvas: landingContainer,
      antialias: true,
      alpha: true,
    });
    landingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    landingRenderer.setSize(w, h);
    landingRenderer.setClearColor(0x000000, 0);

    crownGroup = buildCrown();
    landingScene.add(crownGroup);

    gridLines = buildGrid();
    landingScene.add(gridLines);

    const particles = buildFloatingParticles();
    landingScene.add(particles);

    const ro = new ResizeObserver(() => {
      if (!landingContainer) return;
      const pw = landingContainer.parentElement.clientWidth;
      const ph = landingContainer.parentElement.clientHeight;
      landingCamera.aspect = pw / ph;
      landingCamera.updateProjectionMatrix();
      landingRenderer.setSize(pw, ph);
    });
    ro.observe(landingContainer.parentElement);

    startTime = performance.now();
    landingFrameId = requestAnimationFrame(landingTick);
  };

  window.destroyLanding3D = function() {
    if (landingFrameId) cancelAnimationFrame(landingFrameId);
    if (landingScene) {
      landingScene.traverse(obj => {
        if (obj.isMesh || obj.isLine || obj.isPoints) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
    }
    if (landingRenderer) landingRenderer.dispose();
    landingRenderer = null; landingScene = null; landingCamera = null;
    crownGroup = null; gridLines = null;
  };

})();
