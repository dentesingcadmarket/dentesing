// ══════════════════════════════════════════
// D·CONSOLE — Terminal Wave Animation
// Three.js tabanlı interaktif dalga animasyonu
// ══════════════════════════════════════════

(function() {
  'use strict';

  let waveScene, waveCamera, waveRenderer, waveComposer;
  let instancedBars = null;
  let currentBarCount = 0;
  let barMaterial;
  let barCenters = null;
  let waveCameraInitialized = false;
  let animFrameId = null;

  const MAX_BARS = 200;
  const FIXED_BAR_WIDTH = 14;
  const FIXED_BAR_GAP = 10;
  const EXTEND_LEFT_PX = 200;

  const wave1 = { gain: 10, frequency: 0, waveLength: 0.5, currentAngle: 0 };
  const wave2 = { gain: 0, frequency: 0, waveLength: 0.5, currentAngle: 0 };

  const waveKeyframes1 = [
    { time: 0, gain: 10, frequency: 0, waveLength: 0.5 },
    { time: 4, gain: 280, frequency: 1, waveLength: 0.5 },
    { time: 6, gain: 280, frequency: 4, waveLength: Math.PI * 1.5 },
    { time: 10, gain: 420, frequency: 1, waveLength: Math.PI * 1.5 },
    { time: 14, gain: 200, frequency: 3, waveLength: Math.PI * 1.5 },
    { time: 22, gain: 90, frequency: 6, waveLength: Math.PI * 1.5 },
    { time: 28, gain: 0, frequency: 0.9, waveLength: 0.5 },
    { time: 32, gain: 180, frequency: 1.42, waveLength: 0.5 },
    { time: 40, gain: 420, frequency: 4.0, waveLength: Math.PI * 1.5 },
    { time: 48, gain: 160, frequency: 5.4, waveLength: 0.5 },
    { time: 55, gain: 10, frequency: 0, waveLength: 0.5 },
  ];

  const waveKeyframes2 = [
    { time: 0, gain: 0, frequency: 0, waveLength: 0.5 },
    { time: 10, gain: 320, frequency: 1, waveLength: 0.5 },
    { time: 13, gain: 260, frequency: 4, waveLength: Math.PI * 1.5 },
    { time: 24, gain: 80, frequency: 2, waveLength: 0.5 },
    { time: 36, gain: 340, frequency: 4.0, waveLength: Math.PI * 1.5 },
    { time: 44, gain: 220, frequency: 2.05, waveLength: Math.PI * 1.5 },
    { time: 52, gain: 20, frequency: 0.08, waveLength: 0.5 },
    { time: 55, gain: 0, frequency: 0, waveLength: 0.5 },
  ];

  const mouse = { x: 0, y: 0, active: false };
  let proxyMouseX = 0, proxyMouseY = 0;
  let smoothSpeed = 0;
  let cameraWidth = 0, cameraHeight = 0;

  let w1Phase = 0, w2Phase = 0;
  let mouseNDC = 0;

  let lastTime = 0;
  let kfTime = 0;
  let kfLoopDuration = 55;

  let waveContainer = null;
  let cleanupFns = [];

  function lerpKF(keyframes, t) {
    const loop = t % kfLoopDuration;
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i], b = keyframes[i + 1];
      if (loop >= a.time && loop < b.time) {
        const p = (loop - a.time) / (b.time - a.time);
        const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // ease in-out
        return {
          gain: a.gain + (b.gain - a.gain) * e,
          frequency: a.frequency + (b.frequency - a.frequency) * e,
          waveLength: a.waveLength + (b.waveLength - a.waveLength) * e
        };
      }
    }
    const last = keyframes[keyframes.length - 1];
    return { gain: last.gain, frequency: last.frequency, waveLength: last.waveLength };
  }

  function createBarMaterial() {
    const baseCol = new THREE.Color('#1a4fff');
    const emisCol = new THREE.Color('#0a2aaa');
    return new THREE.ShaderMaterial({
      uniforms: {
        uMouseClipX: { value: 0 },
        uHalfW: { value: 0 },
        uMaxGlowDist: { value: 500 },
        uGlowFalloff: { value: 0.6 },
        uGainMul: { value: 1 },
        uBaseY: { value: 0 },
        w1Gain: { value: 10 },
        w1Len: { value: 0.5 },
        w1Phase: { value: 0 },
        w2Gain: { value: 0 },
        w2Len: { value: 0.5 },
        w2Phase: { value: 0 },
        uFixedTipPx: { value: 10 },
        uMinBottomWidthPx: { value: 0 },
        uColor: { value: baseCol },
        uEmissive: { value: emisCol },
        uBaseEmissive: { value: 0.05 },
        uRotationAngle: { value: THREE.MathUtils.degToRad(22) },
      },
      vertexShader: `
        attribute float aXPos, aPosNorm, aGroup, aGlow;
        uniform float uMouseClipX, uHalfW, uMaxGlowDist, uGlowFalloff;
        uniform float uGainMul, uBaseY;
        uniform float w1Gain, w1Len, w1Phase;
        uniform float w2Gain, w2Len, w2Phase;
        uniform float uRotationAngle;
        varying float vGlow, vPulse, vHeight;
        varying vec2 vUv;

        float sineH(float g, float len, float ph, float t) {
          return max(16.0, (sin(ph + t * len) * 0.5 + 0.6) * g * uGainMul);
        }

        void main() {
          vUv = uv;
          float h1 = sineH(w1Gain, w1Len, w1Phase, aPosNorm);
          float h2 = sineH(w2Gain, w2Len, w2Phase, aPosNorm);
          vHeight = mix(h1, h2, aGroup);

          vec3 pos = position;
          pos.x += aXPos;
          pos.y = 0.0;

          float height = vHeight * uv.y;
          pos.x += height * tan(uRotationAngle);
          pos.y += height + uBaseY;

          vec4 clip = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          float dxPx = abs(uMouseClipX - clip.x / clip.w) * uHalfW;
          float prox = clamp(1.0 - pow(dxPx / uMaxGlowDist, uGlowFalloff), 0.0, 1.0);

          vGlow = aGlow;
          vPulse = prox;
          gl_Position = clip;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor, uEmissive;
        uniform float uBaseEmissive, uFixedTipPx, uMinBottomWidthPx;
        varying float vGlow, vPulse, vHeight;
        varying vec2 vUv;

        void main() {
          float tipProp = clamp(uFixedTipPx / vHeight, 0.0, 0.95);
          float transitionY = 1.0 - tipProp;
          float xFromCenter = abs(vUv.x - 0.5) * 2.0;
          float px = fwidth(vUv.x);
          float allowedWidth;

          if (vUv.y >= transitionY) {
            float topPos = (vUv.y - transitionY) / tipProp;
            allowedWidth = 1.0 - pow(topPos, 0.9);
          } else {
            float bottomPos = vUv.y / transitionY;
            allowedWidth = max(uMinBottomWidthPx * px * 10.0, pow(bottomPos, 0.5));
          }

          float alpha = smoothstep(-px, px, allowedWidth - xFromCenter);
          if (alpha < 0.01) discard;

          float emissiveStrength = uBaseEmissive + vGlow * 0.9 + vPulse * 0.18;
          vec3 finalColor = uColor + uEmissive * emissiveStrength;
          gl_FragColor = vec4(finalColor, 0.38 * alpha);
        }
      `,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  function createInstancedBars() {
    if (instancedBars) {
      waveScene.remove(instancedBars);
      instancedBars.geometry.dispose();
      instancedBars.material.dispose();
      instancedBars = null;
    }

    const span = cameraWidth + EXTEND_LEFT_PX;
    const barCount = Math.min(MAX_BARS, Math.max(1, Math.floor((span + FIXED_BAR_GAP) / (FIXED_BAR_WIDTH + FIXED_BAR_GAP))));
    const gap = barCount > 1 ? (span - barCount * FIXED_BAR_WIDTH) / (barCount - 1) : 0;
    currentBarCount = barCount;

    const instCnt = barCount * 2;
    barCenters = new Float32Array(barCount);

    const startX = -cameraWidth / 2 - EXTEND_LEFT_PX;
    const aXPos = new Float32Array(instCnt);
    const aPosNorm = new Float32Array(instCnt);
    const aGroup = new Float32Array(instCnt);
    const aGlow = new Float32Array(instCnt).fill(0);

    for (let i = 0; i < barCount; i++) {
      const x = startX + FIXED_BAR_WIDTH / 2 + i * (FIXED_BAR_WIDTH + gap);
      barCenters[i] = x;
      const t = barCount > 1 ? i / (barCount - 1) : 0;
      aXPos[i] = x; aXPos[i + barCount] = x;
      aPosNorm[i] = t; aPosNorm[i + barCount] = t;
      aGroup[i] = 0; aGroup[i + barCount] = 1;
    }

    const geo = new THREE.PlaneGeometry(FIXED_BAR_WIDTH, 1, 1, 1);
    geo.translate(0, 0.5, 0);
    geo.setAttribute('aXPos', new THREE.InstancedBufferAttribute(aXPos, 1));
    geo.setAttribute('aPosNorm', new THREE.InstancedBufferAttribute(aPosNorm, 1));
    geo.setAttribute('aGroup', new THREE.InstancedBufferAttribute(aGroup, 1));
    geo.setAttribute('aGlow', new THREE.InstancedBufferAttribute(aGlow, 1).setUsage(THREE.DynamicDrawUsage));

    barMaterial = createBarMaterial();
    instancedBars = new THREE.InstancedMesh(geo, barMaterial, instCnt);
    instancedBars.frustumCulled = false;
    waveScene.add(instancedBars);

    const u = barMaterial.uniforms;
    u.uHalfW.value = cameraWidth * 0.5;
    u.uMaxGlowDist.value = currentBarCount * (FIXED_BAR_WIDTH + FIXED_BAR_GAP) * 0.3;
    updateGainMultiplier();
  }

  function updateGainMultiplier() {
    if (!barMaterial) return;
    const MAX_KEYFRAME_GAIN = 420;
    const SCREEN_COVERAGE = 0.55;
    barMaterial.uniforms.uGainMul.value = (cameraHeight * SCREEN_COVERAGE) / MAX_KEYFRAME_GAIN;
  }

  function accumulateGlow(dt) {
    if (!instancedBars) return;
    const attr = instancedBars.geometry.getAttribute('aGlow');
    const arr = attr.array;
    const mouseWorldX = proxyMouseX - cameraWidth * 0.5;
    const mDist = barMaterial.uniforms.uMaxGlowDist.value;
    const fall = 0.6;
    const decayLerp = 1.0 - Math.exp(-3.3 * dt);
    const addEase = 1.0 - Math.exp(-1.5 * dt);
    const vmax = 40.0;

    for (let i = 0; i < currentBarCount; i++) {
      const dx = Math.abs(mouseWorldX - barCenters[i]);
      const hit = dx < mDist ? 1.0 - Math.pow(dx / mDist, fall) : 0.0;
      const targetAdd = hit * smoothSpeed;
      const add = targetAdd * addEase;
      let g = arr[i] + add - arr[i] * decayLerp;
      if (g > vmax) g = vmax;
      arr[i] = arr[i + currentBarCount] = g;
    }
    attr.needsUpdate = true;
  }

  function setupPointerTracking() {
    const el = waveRenderer.domElement;
    let rect = el.getBoundingClientRect();

    function updateRect() { rect = el.getBoundingClientRect(); }
    const updatePos = (clientX, clientY, active) => {
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.active = active;
    };

    const onMove = e => {
      if (e.touches) {
        const t = e.touches[0];
        if (t) updatePos(t.clientX, t.clientY, true);
      } else {
        updatePos(e.clientX, e.clientY, true);
      }
    };
    const onLeave = () => { mouse.active = false; };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onLeave, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });

    cleanupFns.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onLeave);
      window.removeEventListener('resize', updateRect);
    });
  }

  function onResize(w, h) {
    if (!waveCameraInitialized) return;
    cameraWidth = w; cameraHeight = h;
    waveCamera.left = -w / 2; waveCamera.right = w / 2;
    waveCamera.top = h / 2; waveCamera.bottom = -h / 2;
    waveCamera.updateProjectionMatrix();
    waveRenderer.setSize(w, h);
    createInstancedBars();
  }

  function tick(now) {
    animFrameId = requestAnimationFrame(tick);
    if (!waveCameraInitialized || !instancedBars) return;

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    kfTime += dt;

    const kf1 = lerpKF(waveKeyframes1, kfTime);
    const kf2 = lerpKF(waveKeyframes2, kfTime);

    wave1.frequency = kf1.frequency;
    wave1.gain = kf1.gain;
    wave1.waveLength = kf1.waveLength;
    wave2.frequency = kf2.frequency;
    wave2.gain = kf2.gain;
    wave2.waveLength = kf2.waveLength;

    wave1.currentAngle = (wave1.currentAngle + wave1.frequency * dt) % (Math.PI * 2);
    wave2.currentAngle = (wave2.currentAngle + wave2.frequency * dt) % (Math.PI * 2);
    w1Phase = wave1.currentAngle;
    w2Phase = wave2.currentAngle;

    const kMouse = 1.0 - Math.exp(-30 * dt);
    proxyMouseX += (mouse.x - proxyMouseX) * kMouse;
    proxyMouseY += (mouse.y - proxyMouseY) * kMouse;

    const dx = mouse.active ? mouse.x - proxyMouseX : 0;
    const dy = mouse.active ? mouse.y - proxyMouseY : 0;
    const rawSpeed = Math.hypot(dx, dy * 0.1) * 0.52;
    const kSpeed = 1.0 - Math.exp(-8.5 * dt);
    smoothSpeed += (rawSpeed - smoothSpeed) * kSpeed;

    const u = barMaterial.uniforms;
    u.w1Gain.value = wave1.gain;
    u.w1Len.value = wave1.waveLength;
    u.w1Phase.value = w1Phase;
    u.w2Gain.value = wave2.gain;
    u.w2Len.value = wave2.waveLength;
    u.w2Phase.value = w2Phase;

    mouseNDC = (proxyMouseX / cameraWidth) * 2 - 1;
    u.uMouseClipX.value = mouseNDC;

    let baseOffset = window.innerWidth < 768 ? 16 : 36;
    u.uBaseY.value = -cameraHeight * 0.5 + baseOffset;

    accumulateGlow(dt);
    waveRenderer.render(waveScene, waveCamera);
  }

  window.initTerminalWave = function(containerId) {
    if (typeof THREE === 'undefined') return;
    waveContainer = document.getElementById(containerId);
    if (!waveContainer) return;

    while (waveContainer.firstChild) waveContainer.removeChild(waveContainer.firstChild);

    cameraWidth = waveContainer.clientWidth || 800;
    cameraHeight = waveContainer.clientHeight || 600;

    waveScene = new THREE.Scene();
    waveScene.add(new THREE.AmbientLight(0xffffff, 0.15));

    waveCamera = new THREE.OrthographicCamera(
      -cameraWidth / 2, cameraWidth / 2,
      cameraHeight / 2, -cameraHeight / 2,
      -1000, 1000
    );
    waveCamera.position.z = 10;

    waveRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    waveRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    waveRenderer.setSize(cameraWidth, cameraHeight);
    waveRenderer.autoClear = true;
    waveContainer.appendChild(waveRenderer.domElement);

    proxyMouseX = cameraWidth / 2;
    proxyMouseY = cameraHeight / 2;

    createInstancedBars();
    setupPointerTracking();
    waveCameraInitialized = true;

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        if (e.target === waveContainer) onResize(e.contentRect.width, e.contentRect.height);
      }
    });
    ro.observe(waveContainer);
    cleanupFns.push(() => ro.disconnect());

    lastTime = performance.now();
    animFrameId = requestAnimationFrame(tick);
  };

  window.destroyTerminalWave = function() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
    waveCameraInitialized = false;
    if (waveScene) {
      waveScene.traverse(obj => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
    }
    if (waveRenderer) waveRenderer.dispose();
    instancedBars = null;
    waveRenderer = null; waveScene = null; waveCamera = null;
  };

})();
