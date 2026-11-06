import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Background3D
 * 
 * 1st Viewport (Opening Site / scroll = 0):
 * Strictly preserves the EXACT original cute robot head with smooth rounded corners,
 * mouse-tracking pupils, pink blush cheeks, mouth, 3D antenna with glowing cyan ball,
 * and floating starfield particles.
 * Prominently enlarged (1.42x) on initial load, smoothly scaling to 1.0x as user scrolls.
 * 
 * As User Scrolls (Slower, Majestic Assembly across heroHeight * 2.5):
 * Procedurally assembles the full 3D Mark armor suit around the cute robot:
 *  1. Hands & gauntlets fly in laterally with glowing cyan repulsors
 *  2. Center torso (chest with glowing Arc Reactor + stomach + back thrusters) locks in
 *  3. Legs articulate up from below
 *  4. Highly detailed sculpted boots snap into position with roaring Iron Man fire boosters!
 * 
 * Subsequent Viewports (About, Experience, Achievements, Projects, Contact):
 * Performs TRUE 3D turntable rotation with real mesh depth, bevels, PBR metallic reflections,
 * dynamic fire booster flame plumes under the feet, and zero 2D flipping.
 */
const Background3D = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId;
    let time = 0;

    // --- 1. Three.js Scene, Camera & Renderer ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 16);
    // Compute the view matrix now: the render loop projects the head to screen
    // space before the first renderer.render() would otherwise do it.
    camera.updateMatrixWorld();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Image-based lighting: a neutral studio environment gives the glossy
    // armor something to reflect. Background stays transparent.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = envTexture;

    // --- 2. Lighting System ---
    // Ambient is lower than before because the environment map now supplies
    // most of the fill light.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 10, 12);
    scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    cyanRimLight.position.set(-8, 4, -8);
    scene.add(cyanRimLight);

    const goldFillLight = new THREE.DirectionalLight(0xf59e0b, 1.0);
    goldFillLight.position.set(5, -6, 6);
    scene.add(goldFillLight);

    // --- 3. Floating Starfield / Particles (3D Points) ---
    const particleCount = 220;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 36;
      positions[i + 1] = (Math.random() - 0.5) * 30;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Additive blending disappears against the light page, so the starfield
    // uses normal blending in a deeper arc-reactor cyan.
    const PARTICLE_SIZE = 0.1;
    const PARTICLE_OPACITY = 0.4;
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x0e8db5,
      size: PARTICLE_SIZE,
      transparent: true,
      opacity: PARTICLE_OPACITY,
      depthWrite: false
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // --- 4. Materials ("Cryo" armor: pearl shell, red trim, gunmetal undersuit) ---
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xeef2f6,
      metalness: 0.05,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9412a,
      metalness: 1,
      roughness: 0.26
    });

    const underMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3140,
      metalness: 0.85,
      roughness: 0.45
    });

    const cyanEmissiveMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    const whiteHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.06
    });

    // Fire Booster Flame Materials (Additive Blending for Intense Rocket Glow)
    const flameOuterMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500, // Fiery Stark Rocket Orange
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const flameInnerMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Intense Electric Arc Cyan Core
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const flameCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Superheated White Hot Needle
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Helper to generate rounded rectangle 2D shape for authentic rounded corners
    const createRoundedBoxShape = (width, height, radius) => {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      return shape;
    };

    // --- 5. Dynamic Cute Robot Face Texture (Canvas 512x512) ---
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512;
    faceCanvas.height = 512;
    const fCtx = faceCanvas.getContext('2d');

    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    const faceFrontMaterial = new THREE.MeshBasicMaterial({
      map: faceTexture,
      transparent: false
    });

    // --- 6. Construct Robot & 3D Suit Hierarchy ---
    const suitGroup = new THREE.Group();
    scene.add(suitGroup);

    // [A] Head Group (Prominently enlarged on 1st viewport, with rounded corners)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0, 0);
    suitGroup.add(headGroup);

    // Head 3D Rounded Chassis (corners smoothly rounded with radius 0.7 and depth 1.8)
    const headShape = createRoundedBoxShape(3.2, 2.5, 0.7);
    const extrudeSettings = {
      depth: 1.8,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12
    };
    const headGeometry = new THREE.ExtrudeGeometry(headShape, extrudeSettings);
    headGeometry.center();
    const headChassis = new THREE.Mesh(headGeometry, whiteHeadMaterial);
    headGroup.add(headChassis);

    // Front Face Plate (ShapeGeometry with matching rounded corners)
    const facePlateGeometry = new THREE.ShapeGeometry(headShape, 24);
    const pos = facePlateGeometry.attributes.position;
    const uvs = [];
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + 1.6) / 3.2;
      const v = (pos.getY(i) + 1.25) / 2.5;
      uvs.push(u, v);
    }
    facePlateGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const faceMesh = new THREE.Mesh(facePlateGeometry, faceFrontMaterial);
    faceMesh.position.z = 1.03; // Placed right on the front face of the rounded chassis
    headGroup.add(faceMesh);

    // 3D Ear Caps (Gold mechanical discs on sides of head)
    const leftEar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.2, 24),
      trimMaterial
    );
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-1.72, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.2, 24),
      trimMaterial
    );
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(1.72, 0, 0);
    headGroup.add(rightEar);

    // 3D Titanium Antenna
    const antennaRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 })
    );
    antennaRod.position.set(0, 1.65, 0);
    headGroup.add(antennaRod);

    // Glowing Cyan Antenna Tip
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      cyanEmissiveMaterial
    );
    antennaTip.position.set(0, 2.1, 0);
    headGroup.add(antennaTip);

    const antennaLight = new THREE.PointLight(0x38bdf8, 1.2, 3);
    antennaLight.position.set(0, 2.1, 0.2);
    headGroup.add(antennaLight);

    // Armor part helpers. Every part keeps the original group and resting
    // position, so the scroll assembly, turntable and flight are unchanged.
    const roundedBox = (w, h, d, r, material) =>
      new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), material);
    const place = (mesh, parent, x, y, z) => {
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const facingDisc = (radius, depth, material) => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 32), material);
      disc.rotation.x = Math.PI / 2;
      return disc;
    };

    // [B] Torso & Chest Armor Group
    const torsoGroup = new THREE.Group();
    suitGroup.add(torsoGroup);

    place(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.5, 32), underMaterial), torsoGroup, 0, 1.05, 0); // neck ring
    place(roundedBox(3.0, 1.75, 1.85, 0.32, shellMaterial), torsoGroup, 0, 0.3, 0);                                  // chest shell
    for (const side of [-1, 1]) {
      const pectoral = place(roundedBox(1.18, 0.82, 0.3, 0.12, shellMaterial), torsoGroup, side * 0.68, 0.42, 0.9);
      pectoral.rotation.y = -side * 0.14;
    }
    place(roundedBox(2.6, 0.16, 0.3, 0.06, trimMaterial), torsoGroup, 0, 1.0, 0.82);                                 // collar trim

    // Arc reactor: red ring, recessed well, glowing core + light
    place(new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.09, 16, 48), trimMaterial), torsoGroup, 0, 0.05, 1.02);
    place(facingDisc(0.4, 0.12, underMaterial), torsoGroup, 0, 0.05, 0.98);
    place(facingDisc(0.32, 0.08, cyanEmissiveMaterial), torsoGroup, 0, 0.05, 1.05);
    const arcLight = new THREE.PointLight(0x38bdf8, 3.5, 6);
    arcLight.position.set(0, 0.05, 1.3);
    torsoGroup.add(arcLight);

    // Waist undersuit, segmented ab plates and belt
    place(roundedBox(2.1, 1.15, 1.45, 0.22, underMaterial), torsoGroup, 0, -0.95, 0);
    for (let row = 0; row < 3; row++) {
      for (const side of [-1, 1]) {
        place(roundedBox(0.82, 0.26, 0.24, 0.08, shellMaterial), torsoGroup, side * 0.45, -0.6 - row * 0.31, 0.7);
      }
    }
    place(roundedBox(2.45, 0.3, 1.7, 0.12, trimMaterial), torsoGroup, 0, -1.55, 0);

    // Rear spine, twin thrusters (seen when the turntable shows the back) and shoulder joints
    place(roundedBox(1.5, 1.9, 0.45, 0.15, underMaterial), torsoGroup, 0, 0.2, -0.95);
    for (const side of [-1, 1]) {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.5, 24), trimMaterial);
      thruster.rotation.x = Math.PI / 2;
      place(thruster, torsoGroup, side * 0.55, 0.4, -1.18);
      const thrusterCore = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.52, 24), cyanEmissiveMaterial);
      thrusterCore.rotation.x = Math.PI / 2;
      place(thrusterCore, torsoGroup, side * 0.55, 0.4, -1.2);
      place(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), underMaterial), torsoGroup, side * 1.62, 0.55, 0);
    }

    // [C]/[D] Arms: pauldron, upper arm, elbow, forearm, cuff, hand + repulsor
    const buildArm = () => {
      const arm = new THREE.Group();
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), shellMaterial);
      pauldron.scale.set(1.05, 0.95, 1.05);
      place(pauldron, arm, 0, 0.45, 0);
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 32), trimMaterial), arm, 0, 0.45, 0);
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 24), underMaterial), arm, 0, 0.05, 0);
      place(new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16), trimMaterial), arm, 0, -0.35, 0);
      place(roundedBox(0.82, 1.05, 0.86, 0.2, shellMaterial), arm, 0, -0.92, 0);
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.2, 32), trimMaterial), arm, 0, -1.48, 0);
      place(roundedBox(0.62, 0.46, 0.56, 0.14, underMaterial), arm, 0, -1.76, 0);
      place(facingDisc(0.18, 0.08, cyanEmissiveMaterial), arm, 0, -1.76, 0.29); // palm repulsor
      const repulsorLight = new THREE.PointLight(0x38bdf8, 1.8, 3);
      repulsorLight.position.set(0, -1.76, 0.55);
      arm.add(repulsorLight);
      return { arm, repulsorLight };
    };

    const { arm: leftArmGroup, repulsorLight: leftRepulsorLight } = buildArm();
    suitGroup.add(leftArmGroup);
    const { arm: rightArmGroup, repulsorLight: rightRepulsorLight } = buildArm();
    suitGroup.add(rightArmGroup);

    // [E] Legs: thigh, knee joint + guard, shin with inset
    const legsGroup = new THREE.Group();
    suitGroup.add(legsGroup);
    for (const side of [-1, 1]) {
      const x = side * 0.85;
      place(roundedBox(1.0, 1.35, 1.02, 0.22, shellMaterial), legsGroup, x, 0.68, 0);
      const kneeJoint = place(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.6, 24), underMaterial), legsGroup, x, -0.1, 0);
      kneeJoint.rotation.z = Math.PI / 2;
      place(roundedBox(0.72, 0.5, 0.45, 0.14, trimMaterial), legsGroup, x, -0.12, 0.42);
      place(roundedBox(0.9, 1.0, 0.94, 0.2, shellMaterial), legsGroup, x, -0.82, 0);
      place(roundedBox(0.5, 0.7, 0.1, 0.05, underMaterial), legsGroup, x, -0.8, 0.48);
    }

    // [F] Boots with fire booster plumes
    const bootsGroup = new THREE.Group();
    suitGroup.add(bootsGroup);

    // Downward-pointing cone with its base at y = 0
    const createDownwardConeGeo = (radius, height) => {
      const geo = new THREE.ConeGeometry(radius, height, 24, 1, true);
      geo.rotateX(Math.PI);
      geo.translate(0, -height / 2, 0);
      return geo;
    };

    const createArticulatedBoot = () => {
      const boot = new THREE.Group();

      place(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.46, 0.3, 32), trimMaterial), boot, 0, 0.42, 0); // ankle cuff
      place(roundedBox(0.95, 0.78, 0.7, 0.18, shellMaterial), boot, 0, 0.05, -0.33);  // heel
      place(roundedBox(0.9, 0.58, 0.82, 0.18, shellMaterial), boot, 0, 0.06, 0.2);    // vamp
      place(roundedBox(0.86, 0.42, 0.55, 0.16, trimMaterial), boot, 0, -0.08, 0.66);  // toe cap
      place(roundedBox(1.0, 0.2, 1.8, 0.08, underMaterial), boot, 0, -0.3, 0.15);     // sole

      // Booster plumes, strictly below the sole and pointing down
      const frontBoosterGroup = new THREE.Group();
      frontBoosterGroup.position.set(0, -0.42, 0.45);
      boot.add(frontBoosterGroup);
      const frontOuterGeo = createDownwardConeGeo(0.28, 1.6);
      const frontFlameOuter = new THREE.Mesh(frontOuterGeo, flameOuterMaterial);
      frontBoosterGroup.add(frontFlameOuter);
      const frontInnerGeo = createDownwardConeGeo(0.16, 1.25);
      const frontFlameInner = new THREE.Mesh(frontInnerGeo, flameInnerMaterial);
      frontBoosterGroup.add(frontFlameInner);
      const frontCoreGeo = createDownwardConeGeo(0.07, 0.85);
      const frontFlameCore = new THREE.Mesh(frontCoreGeo, flameCoreMaterial);
      frontBoosterGroup.add(frontFlameCore);

      const rearBoosterGroup = new THREE.Group();
      rearBoosterGroup.position.set(0, -0.42, -0.15);
      boot.add(rearBoosterGroup);
      const rearOuterGeo = createDownwardConeGeo(0.30, 1.75);
      const rearFlameOuter = new THREE.Mesh(rearOuterGeo, flameOuterMaterial);
      rearBoosterGroup.add(rearFlameOuter);
      const rearInnerGeo = createDownwardConeGeo(0.18, 1.35);
      const rearFlameInner = new THREE.Mesh(rearInnerGeo, flameInnerMaterial);
      rearBoosterGroup.add(rearFlameInner);
      const rearCoreGeo = createDownwardConeGeo(0.08, 0.95);
      const rearFlameCore = new THREE.Mesh(rearCoreGeo, flameCoreMaterial);
      rearBoosterGroup.add(rearFlameCore);

      const thrusterLight = new THREE.PointLight(0xff5500, 4.0, 7);
      thrusterLight.position.set(0, -0.85, 0.15);
      boot.add(thrusterLight);

      return {
        group: boot,
        frontFlameOuter,
        frontFlameInner,
        frontFlameCore,
        rearFlameOuter,
        rearFlameInner,
        rearFlameCore,
        thrusterLight
      };
    };

    const leftBootData = createArticulatedBoot();
    leftBootData.group.position.set(-0.85, 0, 0.2);
    bootsGroup.add(leftBootData.group);

    const rightBootData = createArticulatedBoot();
    rightBootData.group.position.set(0.85, 0, 0.2);
    bootsGroup.add(rightBootData.group);

    // Base resting positions for assembled armor relative to head (0, 0, 0)
    const TARGET_TORSO_Y = -1.95;
    const TARGET_LEFT_ARM = { x: -2.35, y: -1.75, z: 0 };
    const TARGET_RIGHT_ARM = { x: 2.35, y: -1.75, z: 0 };
    const TARGET_LEGS_Y = -4.3;
    const TARGET_BOOTS_Y = -6.1;

    // --- 7. Mouse, Scroll & Flight Tracking State ---
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      screenX: window.innerWidth / 2,
      screenY: window.innerHeight / 2,
      lastMoveAt: 0
    };

    // Head-follow: eyes track the cursor everywhere; once the cursor is far
    // enough from the head, the head itself turns toward it on a soft spring
    // (slight lag + overshoot), and eases most of the way back when the
    // cursor rests. Strongest in the hero, mostly faded once the suit is on.
    const headLook = { yaw: 0, pitch: 0, yawVel: 0, pitchVel: 0 };
    const HEAD_MAX_YAW = 0.45;   // ~26 degrees
    const HEAD_MAX_PITCH = 0.26; // ~15 degrees
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headScreen = new THREE.Vector3();
    const smoothstep = (a, b, x) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const scrollState = {
      y: 0,
      assemblyProgress: 0,
      assemblyEased: 0,
      totalProgress: 0,
      targetRotY: 0,
      currentRotY: 0,
      targetShiftX: 0,
      currentShiftX: 0
    };

    // Flight takeoff animation state (moving away into distance & smooth return)
    const flightState = {
      active: false,
      progress: 0,
      currentZ: 0,
      currentY: 0,
      targetZ: 0,
      targetY: 0,
      returning: false
    };

    const handleFlightTakeoff = () => {
      flightState.active = true;
      flightState.progress = 0;
      flightState.currentZ = 0;
      flightState.currentY = 0;
      flightState.targetZ = 0;
      flightState.targetY = 0;
      flightState.returning = false;
    };

    window.addEventListener('flight-takeoff', handleFlightTakeoff);

    const handleMouseMove = (e) => {
      // Normalized device coordinates [-1, 1]
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.screenX = e.clientX;
      mouse.screenY = e.clientY;
      mouse.lastMoveAt = performance.now();
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      scrollState.y = scrollY;

      // Slower assembly progress: extends over heroHeight * 2.5 for a gradual, majestic build
      scrollState.assemblyProgress = Math.min(1, Math.max(0, scrollY / (heroHeight * 2.5)));
      scrollState.totalProgress = docHeight > 0 ? scrollY / docHeight : 0;
    };

    let touchMagicUntil = 0;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
        mouse.screenX = touch.clientX;
        mouse.screenY = touch.clientY;
        mouse.lastMoveAt = performance.now();

        // Check if touch is on or near the Arc Reactor or robot body
        const arcWorld = new THREE.Vector3();
        arcLight.getWorldPosition(arcWorld);
        arcWorld.project(camera);
        const arcScreenX = (arcWorld.x * 0.5 + 0.5) * window.innerWidth;
        const arcScreenY = (-(arcWorld.y) * 0.5 + 0.5) * window.innerHeight;
        const distToArc = Math.hypot(touch.clientX - arcScreenX, touch.clientY - arcScreenY);

        const roboWorld = new THREE.Vector3();
        suitGroup.getWorldPosition(roboWorld);
        roboWorld.project(camera);
        const roboScreenX = (roboWorld.x * 0.5 + 0.5) * window.innerWidth;
        const roboScreenY = (-(roboWorld.y) * 0.5 + 0.5) * window.innerHeight;
        const distToRobo = Math.hypot(touch.clientX - roboScreenX, touch.clientY - roboScreenY);

        if (distToArc < 360 || distToRobo < 360) {
          // Trigger touch magic for 4.5 seconds
          touchMagicUntil = performance.now() + 4500;
          // Dispatch custom event so Contact component can bloom orbital icons
          window.dispatchEvent(new CustomEvent('robo-touch'));
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
        mouse.screenX = touch.clientX;
        mouse.screenY = touch.clientY;
        mouse.lastMoveAt = performance.now();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // --- 8. Render Loop ---
    const render = () => {
      time += 0.02;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Smooth assembly interpolation
      scrollState.assemblyEased += (scrollState.assemblyProgress - scrollState.assemblyEased) * 0.05;
      const assembly = scrollState.assemblyEased;

      // Dynamic scaling for cute robot head:
      // Enlarged on initial load/viewport (1.42x), smoothly transitioning to 1.0x baseline as user scrolls
      const currentHeadScale = 1.42 - Math.min(1, assembly * 1.5) * 0.42;
      headGroup.scale.set(currentHeadScale, currentHeadScale, currentHeadScale);

      // --- Cursor Proximity Magic Detection ---
      const roboWorld = new THREE.Vector3();
      suitGroup.getWorldPosition(roboWorld);
      roboWorld.project(camera);
      const roboScreenX = (roboWorld.x * 0.5 + 0.5) * window.innerWidth;
      const roboScreenY = (-(roboWorld.y) * 0.5 + 0.5) * window.innerHeight;

      const distToRobo = Math.hypot(mouse.screenX - roboScreenX, mouse.screenY - roboScreenY);
      // Magic triggers smoothly when cursor is within 280px of robot, or when touched on mobile/tablet devices
      const cursorMagic = Math.max(0, 1 - distToRobo / 280);
      const isTouchMagic = performance.now() < touchMagicUntil;
      const magicIntensity = isTouchMagic ? Math.max(cursorMagic, 1.0) : cursorMagic;

      // --- Draw Cute Robot Face on Dynamic 2D Canvas ---
      fCtx.fillStyle = '#ffffff';
      fCtx.fillRect(0, 0, 512, 512);

      // Eye look calculation from the head's real on-screen position, so the
      // eyes and the head turn aim at the same point wherever the head sits.
      headGroup.getWorldPosition(headScreen);
      headScreen.project(camera);
      const projectedOk = Number.isFinite(headScreen.x) && Number.isFinite(headScreen.y);
      const headScreenX = projectedOk ? (headScreen.x * 0.5 + 0.5) * window.innerWidth : window.innerWidth / 2;
      const headScreenY = projectedOk ? (-headScreen.y * 0.5 + 0.5) * window.innerHeight : window.innerHeight / 2;
      const dx = mouse.screenX - headScreenX;
      const dy = mouse.screenY - headScreenY;

      // --- Head follow (eyes lead, head follows past a distance) ---
      {
        const dist = Math.hypot(dx, dy);
        const nearR = Math.min(window.innerWidth, window.innerHeight) * 0.24;
        // 0 inside nearR (eyes only), ramps to 1 over the next ~35% of the screen
        const reach = smoothstep(nearR, nearR + Math.min(window.innerWidth, window.innerHeight) * 0.35, dist);
        // Hero = full turn; once the suit is assembled keep a small turn so it
        // never fights the turntable pose. No turning during flight.
        const sceneFactor = flightState.active || reducedMotion
          ? 0
          : 1 - smoothstep(0, 0.5, scrollState.assemblyEased) * 0.75;
        // Cursor at rest for a while: head drifts most of the way back,
        // eyes keep looking.
        const idleFor = (performance.now() - mouse.lastMoveAt) / 1000;
        const restFactor = 1 - smoothstep(1.2, 3.0, idleFor) * 0.6;
        const k = reach * sceneFactor * restFactor;

        const targetYaw = Math.max(-1, Math.min(1, dx / (window.innerWidth * 0.45))) * HEAD_MAX_YAW * k;
        const targetPitch = Math.max(-1, Math.min(1, dy / (window.innerHeight * 0.45))) * HEAD_MAX_PITCH * k;

        // Under-damped spring: trails the eyes, then settles with a small overshoot.
        headLook.yawVel = (headLook.yawVel + (targetYaw - headLook.yaw) * 0.018) * 0.86;
        headLook.pitchVel = (headLook.pitchVel + (targetPitch - headLook.pitch) * 0.018) * 0.86;
        headLook.yaw += headLook.yawVel;
        headLook.pitch += headLook.pitchVel;

        headGroup.rotation.y = headLook.yaw;
        headGroup.rotation.x = headLook.pitch;
      }
      const eyeAngle = Math.atan2(dy, dx);
      const eyeDist = Math.min(Math.sqrt(dx * dx + dy * dy), 700);

      const lookBackX = Math.cos(eyeAngle) * (eyeDist / 700) * 16;
      const lookBackY = Math.sin(eyeAngle) * (eyeDist / 700) * 16;
      const lookFrontX = Math.cos(eyeAngle) * (eyeDist / 700) * 26;
      const lookFrontY = Math.sin(eyeAngle) * (eyeDist / 700) * 26;

      const eyeCenterY = 240;
      const eyeOffsetX = 118;
      const eyeRadiusX = 50;
      const eyeRadiusY = 62;

      // Left Eye (Deep Dark Navy)
      fCtx.fillStyle = '#0a192f';
      fCtx.beginPath();
      fCtx.ellipse(256 - eyeOffsetX + lookBackX, eyeCenterY + lookBackY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      fCtx.fill();

      // Left Eye Main Sparkle
      fCtx.fillStyle = '#ffffff';
      fCtx.beginPath();
      fCtx.arc(256 - eyeOffsetX + lookFrontX + 10, eyeCenterY + lookFrontY - 12, 15 + magicIntensity * 3, 0, Math.PI * 2);
      fCtx.fill();

      // Left Eye Magic Secondary Twinkle
      if (magicIntensity > 0.05) {
        fCtx.fillStyle = '#64ffda';
        fCtx.beginPath();
        fCtx.arc(256 - eyeOffsetX + lookFrontX + 18, eyeCenterY + lookFrontY + 8, 6 * magicIntensity, 0, Math.PI * 2);
        fCtx.fill();
      }

      // Right Eye (Deep Dark Navy)
      fCtx.fillStyle = '#0a192f';
      fCtx.beginPath();
      fCtx.ellipse(256 + eyeOffsetX + lookBackX, eyeCenterY + lookBackY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      fCtx.fill();

      // Right Eye Main Sparkle
      fCtx.fillStyle = '#ffffff';
      fCtx.beginPath();
      fCtx.arc(256 + eyeOffsetX + lookFrontX + 10, eyeCenterY + lookFrontY - 12, 15 + magicIntensity * 3, 0, Math.PI * 2);
      fCtx.fill();

      // Right Eye Magic Secondary Twinkle
      if (magicIntensity > 0.05) {
        fCtx.fillStyle = '#64ffda';
        fCtx.beginPath();
        fCtx.arc(256 + eyeOffsetX + lookFrontX + 18, eyeCenterY + lookFrontY + 8, 6 * magicIntensity, 0, Math.PI * 2);
        fCtx.fill();
      }

      // Cute Blush Cheeks (Glows brighter & warmer when magic cursor is near)
      const blushAlpha = 0.45 + magicIntensity * 0.45;
      fCtx.fillStyle = `rgba(255, 95, 125, ${blushAlpha})`;
      fCtx.beginPath();
      fCtx.ellipse(256 - eyeOffsetX, eyeCenterY + 92, 36 + magicIntensity * 10, 18 + magicIntensity * 5, 0, 0, Math.PI * 2);
      fCtx.fill();

      fCtx.beginPath();
      fCtx.ellipse(256 + eyeOffsetX, eyeCenterY + 92, 36 + magicIntensity * 10, 18 + magicIntensity * 5, 0, 0, Math.PI * 2);
      fCtx.fill();

      // Cute Smile Mouth (Opens into a beaming joyful smile when cursor is near)
      fCtx.strokeStyle = '#0a192f';
      fCtx.lineWidth = 7 + magicIntensity * 2;
      fCtx.lineCap = 'round';
      fCtx.beginPath();
      const smileRadius = 18 + magicIntensity * 10;
      fCtx.arc(256, eyeCenterY + 44 - magicIntensity * 4, smileRadius, 0.15, Math.PI - 0.15);
      fCtx.stroke();

      // Signal Three.js to upload updated canvas texture
      faceTexture.needsUpdate = true;

      // Arc Reactor & Repulsor lights reactive magic
      arcLight.intensity = 3.5 + magicIntensity * 8.0 + (magicIntensity > 0.1 ? Math.sin(time * 24) * 2.0 : 0);
      leftRepulsorLight.intensity = 1.8 + magicIntensity * 5.0;
      rightRepulsorLight.intensity = 1.8 + magicIntensity * 5.0;
      antennaLight.intensity = 1.2 + magicIntensity * 3.0;

      // --- Suit Assembly Choreography Across Scroll ---
      const isMobile = window.innerWidth < 768;

      if (assembly <= 0.01 && !flightState.active) {
        // 1st Viewport (scroll = 0): strictly ONLY the cute robot head and particles
        torsoGroup.visible = false;
        leftArmGroup.visible = false;
        rightArmGroup.visible = false;
        legsGroup.visible = false;
        bootsGroup.visible = false;
      } else {
        torsoGroup.visible = true;
        leftArmGroup.visible = true;
        rightArmGroup.visible = true;
        legsGroup.visible = true;
        bootsGroup.visible = true;

        // 1. Hands & Gauntlets fly in laterally (0.00 -> 0.45)
        const armProg = Math.min(1, assembly / 0.45);
        const armSpread = (1 - armProg) * 12;
        leftArmGroup.position.set(TARGET_LEFT_ARM.x - armSpread, TARGET_LEFT_ARM.y, TARGET_LEFT_ARM.z);
        rightArmGroup.position.set(TARGET_RIGHT_ARM.x + armSpread, TARGET_RIGHT_ARM.y, TARGET_RIGHT_ARM.z);

        // 2. Torso locks in beneath head (0.20 -> 0.70)
        const torsoProg = Math.min(1, Math.max(0, (assembly - 0.20) / 0.50));
        const torsoDrop = (1 - torsoProg) * -7;
        torsoGroup.position.set(0, TARGET_TORSO_Y + torsoDrop, 0);

        // 3. Legs articulate up from below (0.45 -> 0.85)
        const legProg = Math.min(1, Math.max(0, (assembly - 0.45) / 0.40));
        const legDrop = (1 - legProg) * -9;
        legsGroup.position.set(0, TARGET_LEGS_Y + legDrop, 0);

        // 4. Boots snap into position (0.65 -> 1.00)
        const bootProg = Math.min(1, Math.max(0, (assembly - 0.65) / 0.35));
        const bootDrop = (1 - bootProg) * -12;
        bootsGroup.position.set(0, TARGET_BOOTS_Y + bootDrop, 0);
      }

      // --- Iron Man Fire Booster Plume Animation & Cinematic Flight ---
      const flameNoise = Math.sin(time * 36) * 0.14 + Math.cos(time * 52) * 0.09 + (Math.random() - 0.5) * 0.08;
      let thrusterScaleL = 1.0 + flameNoise;
      let thrusterScaleW = 1.0 + flameNoise * 0.35;
      let thrusterIntensity = 3.5 + flameNoise * 2.0;

      if (magicIntensity > 0.05) {
        thrusterScaleL += magicIntensity * 0.6;
        thrusterScaleW += magicIntensity * 0.3;
        thrusterIntensity += magicIntensity * 4.0;
      }

      if (flightState.active) {
        if (!flightState.returning) {
          // Smooth, majestic progression of robot flying away into the distance
          flightState.progress = Math.min(1, flightState.progress + 0.010);

          // Easing curve: recedes away along Z into deep space, while gently ascending in the sky
          const flyT = 1 - Math.pow(1 - flightState.progress, 2.5);
          flightState.targetZ = -22 * flyT; // Moves into deep background (-Z)
          flightState.targetY = 3.6 * flyT;  // Ascends into upper sky (+Y)

          // As user arrives near top of page, initiate smooth re-entry swoop
          if (window.scrollY <= 30 && flightState.progress > 0.35) {
            flightState.returning = true;
          }
        } else {
          // Graceful re-entry swoop back from deep space towards camera
          flightState.targetZ += (0 - flightState.targetZ) * 0.06;
          flightState.targetY += (0 - flightState.targetY) * 0.06;

          if (Math.abs(flightState.targetZ) < 0.3 && Math.abs(flightState.targetY) < 0.15 && window.scrollY <= 10) {
            flightState.active = false;
            flightState.returning = false;
            flightState.targetZ = 0;
            flightState.targetY = 0;
            flightState.currentZ = 0;
            flightState.currentY = 0;
            particleMaterial.size = PARTICLE_SIZE;
            particleMaterial.opacity = PARTICLE_OPACITY;
          }
        }

        // Smooth physics dampening for flight coordinates
        flightState.currentZ += (flightState.targetZ - flightState.currentZ) * 0.08;
        flightState.currentY += (flightState.targetY - flightState.currentY) * 0.08;

        // Cinematic Rocket Thrusters in flight
        thrusterScaleL = 2.5 + Math.sin(time * 36) * 0.3;
        thrusterScaleW = 1.35 + Math.sin(time * 24) * 0.15;
        thrusterIntensity = 14.0;

        // Robot pitches forward away from the camera into deep space
        const distanceT = Math.min(1, Math.abs(flightState.currentZ) / 14);
        suitGroup.rotation.x = -0.55 * distanceT;

        // Movie Hyperspace: Stars/particles stream DOWNWARDS at warp speed!
        const warpSpeed = 1.8 + Math.min(flightState.progress * 1.5, 1.5);
        for (let i = 1; i < particleCount * 3; i += 3) {
          positions[i] -= warpSpeed;
          if (positions[i] < -25) {
            positions[i] = 25 + (Math.random() - 0.5) * 4;
            positions[i - 1] = (Math.random() - 0.5) * 36;
            positions[i + 1] = (Math.random() - 0.5) * 20;
          }
        }
        particleGeometry.attributes.position.needsUpdate = true;
        particleMaterial.size = 0.2;
        particleMaterial.opacity = 0.7;
      } else {
        // Normal gentle star drift
        particleSystem.rotation.y = time * 0.02;
        particleSystem.position.x = mouse.x * 0.5;
        particleSystem.position.y = mouse.y * 0.5;
      }

      // Update both boots' flame plumes (front and rear nozzles)
      if (bootsGroup.visible || flightState.active) {
        bootsGroup.visible = true;
        const applyPlumes = (bootData) => {
          bootData.frontFlameOuter.scale.set(thrusterScaleW, thrusterScaleL, thrusterScaleW);
          bootData.frontFlameInner.scale.set(thrusterScaleW * 0.85, thrusterScaleL * 1.08, thrusterScaleW * 0.85);
          bootData.frontFlameCore.scale.set(thrusterScaleW * 0.65, thrusterScaleL * 1.02, thrusterScaleW * 0.65);

          bootData.rearFlameOuter.scale.set(thrusterScaleW * 1.05, thrusterScaleL * 1.1, thrusterScaleW * 1.05);
          bootData.rearFlameInner.scale.set(thrusterScaleW * 0.90, thrusterScaleL * 1.18, thrusterScaleW * 0.90);
          bootData.rearFlameCore.scale.set(thrusterScaleW * 0.70, thrusterScaleL * 1.1, thrusterScaleW * 0.70);

          bootData.thrusterLight.intensity = thrusterIntensity;
        };

        applyPlumes(leftBootData);
        applyPlumes(rightBootData);
      }

      // --- Section Based 3D Turntable Rotation (Zero 2D Flipping) ---
      const totalProg = scrollState.totalProgress;
      let targetRot = 0;
      let targetShiftX = 0;

      if (assembly >= 0.80 && !flightState.active) {
        if (totalProg < 0.18) {
          // Front assembled pose
          targetRot = 0;
          targetShiftX = 0;
        } else if (totalProg < 0.38) {
          // About Section: rotate 32 deg, shift to right side on desktop for clear view
          targetRot = 0.55;
          targetShiftX = isMobile ? 0 : 2.4;
        } else if (totalProg < 0.58) {
          // Experience Section: rotate -35 deg, shift to left side
          targetRot = -0.60;
          targetShiftX = isMobile ? 0 : -2.2;
        } else if (totalProg < 0.76) {
          // Achievements: rotate 180 deg, showcasing rear spine armor & glowing twin thruster ports
          targetRot = Math.PI;
          targetShiftX = isMobile ? 0 : 2.0;
        } else if (totalProg < 0.90) {
          // Projects: front battle stance
          targetRot = 0;
          targetShiftX = 0;
        } else {
          // Contact: slight hover angle
          targetRot = 0.15;
          targetShiftX = 0;
        }
      }

      scrollState.currentRotY += (targetRot - scrollState.currentRotY) * 0.04;
      scrollState.currentShiftX += (targetShiftX - scrollState.currentShiftX) * 0.04;

      // When in flight, smoothly center suit horizontally
      const flightCenterT = flightState.active ? Math.min(1, Math.abs(flightState.currentZ) / 8) : 0;
      suitGroup.rotation.y = scrollState.currentRotY * (1 - flightCenterT);
      suitGroup.position.x = scrollState.currentShiftX * (1 - flightCenterT);

      // Gentle floating hover bobbing
      const bobbing = Math.sin(time) * 0.12;
      suitGroup.position.y = (assembly > 0.4 ? 1.6 : 0) + bobbing + flightState.currentY;

      // 3D Depth Position: moves into distance (away from camera)
      suitGroup.position.z = flightState.currentZ;

      // Responsive model scale
      const modelScale = isMobile ? 0.72 : 0.95;
      suitGroup.scale.set(modelScale, modelScale, modelScale);

      // Mouse parallax tilt in true 3D space (when not in flight)
      if (!flightState.active) {
        suitGroup.rotation.x = -mouse.y * 0.08;
        suitGroup.rotation.z = -mouse.x * 0.04;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up Three.js resources on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('flight-takeoff', handleFlightTakeoff);
      cancelAnimationFrame(animationFrameId);

      particleGeometry.dispose();
      particleMaterial.dispose();
      // Every armor part builds its own geometry, so free them all in one pass.
      suitGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      shellMaterial.dispose();
      trimMaterial.dispose();
      underMaterial.dispose();
      envTexture.dispose();
      pmrem.dispose();
      cyanEmissiveMaterial.dispose();
      whiteHeadMaterial.dispose();
      faceFrontMaterial.dispose();
      faceTexture.dispose();

      flameOuterMaterial.dispose();
      flameInnerMaterial.dispose();
      flameCoreMaterial.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default Background3D;
