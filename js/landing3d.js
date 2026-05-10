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

  // Diş tacı profil — daha gerçekçi çene dişi (molar) profili
  const crownProfile = [
    new THREE.Vector2(0,    0),
    new THREE.Vector2(0.55, 0.04),
    new THREE.Vector2(1.30, 0.18),
    new THREE.Vector2(1.80, 0.50),
    new THREE.Vector2(2.05, 1.0),
    new THREE.Vector2(2.15, 1.55),
    new THREE.Vector2(2.10, 2.10),
    new THREE.Vector2(1.95, 2.55),
    new THREE.Vector2(1.70, 2.95),
    new THREE.Vector2(1.40, 3.28),
    new THREE.Vector2(1.10, 3.52),
    new THREE.Vector2(0.78, 3.68),
    new THREE.Vector2(0.42, 3.80),
    new THREE.Vector2(0.10, 3.90),
    new THREE.Vector2(0,    3.92),
  ];

  function buildOneCrown(wireColor, ringColorA, ringColorB, scale) {
    const group = new THREE.Group();

    const latheGeo = new THREE.LatheGeometry(crownProfile, 36);
    const meshMat = new THREE.MeshStandardMaterial({
      color: 0x04091f,
      emissive: 0x050d30,
      roughness: 0.4,
      metalness: 0.7,
      transparent: true,
      opacity: 0.22,
    });
    const crownMesh = new THREE.Mesh(latheGeo, meshMat);
    group.add(crownMesh);

    // Wireframe
    const edgeGeo = new THREE.EdgesGeometry(latheGeo, 12);
    const edgeMat = new THREE.LineBasicMaterial({ color: wireColor, transparent: true, opacity: 0.75 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // Yatay kontur halkalar
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const yPos = t * 3.92;
      const profIdx = Math.min(Math.floor(t * (crownProfile.length - 1)), crownProfile.length - 1);
      const r = Math.max(crownProfile[profIdx].x * 1.01, 0.04);
      const ringGeo = new THREE.RingGeometry(r - 0.018, r + 0.018, 56);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? ringColorA : ringColorB,
        transparent: true, opacity: 0.18 + t * 0.2, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yPos - 1.96;
      group.add(ring);
    }

    group.scale.setScalar(scale);
    group.position.y = -1.96 * scale;
    return group;
  }

  function buildGrid() {
    const group = new THREE.Group();
    const sz = 22, step = 1.6;
    const mat = new THREE.LineBasicMaterial({ color: 0x111a40, transparent: true, opacity: 0.4 });
    for (let i = -sz; i <= sz; i += step) {
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-sz, 0, i), new THREE.Vector3(sz, 0, i)
      ]), mat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0, -sz), new THREE.Vector3(i, 0, sz)
      ]), mat));
    }
    group.position.y = -3.2;
    group.rotation.x = THREE.MathUtils.degToRad(55);
    return group;
  }

  function buildParticles() {
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*18;
      pos[i*3+1] = (Math.random()-0.5)*14;
      pos[i*3+2] = (Math.random()-0.5)*8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x2a5fff, size: 0.055, transparent: true, opacity: 0.55,
    }));
  }

  let startTime = 0;
  let sideGroup1, sideGroup2;

  function landingTick(now) {
    landingFrameId = requestAnimationFrame(landingTick);
    const t = (now - startTime) / 1000;

    // Ana taç
    if (crownGroup) {
      crownGroup.rotation.y = t * 0.32;
      crownGroup.rotation.x = Math.sin(t * 0.17) * 0.06;
      crownGroup.position.y = -1.96 + Math.sin(t * 0.55) * 0.22;
    }
    // Yan taçlar farklı faz
    if (sideGroup1) {
      sideGroup1.rotation.y = -t * 0.22 + 1.2;
      sideGroup1.position.y = -1.6 + Math.sin(t * 0.42 + 1) * 0.16;
    }
    if (sideGroup2) {
      sideGroup2.rotation.y = t * 0.28 + 2.4;
      sideGroup2.position.y = -1.6 + Math.sin(t * 0.5 + 2) * 0.14;
    }
    if (gridLines) gridLines.rotation.z = t * 0.03;

    landingRenderer.render(landingScene, landingCamera);
  }

  window.initLanding3D = function(canvasId) {
    if (typeof THREE === 'undefined') return;
    landingContainer = document.getElementById(canvasId);
    if (!landingContainer) return;

    const parent = landingContainer.parentElement;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || Math.max(window.innerHeight, 520);

    landingScene = new THREE.Scene();

    // Işıklar
    landingScene.add(new THREE.AmbientLight(0x070714, 0.8));
    const blueL = new THREE.PointLight(0x2a6fff, 4.5, 20);
    blueL.position.set(-5, 4, 4);
    landingScene.add(blueL);
    const goldL = new THREE.PointLight(0xe8b840, 3, 16);
    goldL.position.set(5, 0, -3);
    landingScene.add(goldL);
    const purpleL = new THREE.PointLight(0x9b6dd0, 2, 14);
    purpleL.position.set(0, -2, 5);
    landingScene.add(purpleL);

    landingCamera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    landingCamera.position.set(0, 1.0, 10);
    landingCamera.lookAt(0, 0, 0);

    landingRenderer = new THREE.WebGLRenderer({ canvas: landingContainer, antialias: true, alpha: true });
    landingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    landingRenderer.setSize(w, h);
    landingRenderer.setClearColor(0x000000, 0);

    // Ana merkez taç (mavi)
    crownGroup = buildOneCrown(0x2a6fff, 0xe8b840, 0x4a7fff, 1.0);
    crownGroup.position.x = 0;
    landingScene.add(crownGroup);

    // Sol yan taç (altın, küçük, arkada)
    sideGroup1 = buildOneCrown(0xe8b840, 0xe8b840, 0xffd060, 0.62);
    sideGroup1.position.set(-3.8, -0.6, -2.5);
    sideGroup1.rotation.y = 1.2;
    landingScene.add(sideGroup1);

    // Sağ yan taç (mor, küçük, arkada)
    sideGroup2 = buildOneCrown(0x9b6dd0, 0x9b6dd0, 0xc89fff, 0.55);
    sideGroup2.position.set(3.6, -0.6, -2.0);
    sideGroup2.rotation.y = 2.4;
    landingScene.add(sideGroup2);

    gridLines = buildGrid();
    landingScene.add(gridLines);

    landingScene.add(buildParticles());

    const ro = new ResizeObserver(() => {
      if (!landingContainer || !landingContainer.parentElement) return;
      const pw = landingContainer.parentElement.clientWidth;
      const ph = landingContainer.parentElement.clientHeight || Math.max(window.innerHeight, 520);
      landingCamera.aspect = pw / ph;
      landingCamera.updateProjectionMatrix();
      landingRenderer.setSize(pw, ph);
    });
    ro.observe(parent);

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
    crownGroup = null; gridLines = null; sideGroup1 = null; sideGroup2 = null;
  };

})();
