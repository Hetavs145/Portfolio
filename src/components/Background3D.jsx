import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

    // --- 2. Lighting System ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
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

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // --- 4. Materials (PBR Metallic Armor) ---
    const crimsonMaterial = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      metalness: 0.75,
      roughness: 0.28
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.22
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.4
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
      goldMaterial
    );
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-1.72, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.2, 24),
      goldMaterial
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

    // [B] Torso & Chest Armor Group
    const torsoGroup = new THREE.Group();
    suitGroup.add(torsoGroup);

    // 3D Chest Block (X: 3.0, Y: 2.3, Z: 1.8)
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.3, 1.8),
      crimsonMaterial
    );
    torsoGroup.add(chestPlate);

    // Gold Collar / Pectoral Insets
    const leftPectoral = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.7, 0.25),
      goldMaterial
    );
    leftPectoral.position.set(-0.75, 0.45, 0.95);
    torsoGroup.add(leftPectoral);

    const rightPectoral = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.7, 0.25),
      goldMaterial
    );
    rightPectoral.position.set(0.75, 0.45, 0.95);
    torsoGroup.add(rightPectoral);

    // Arc Reactor Core (Real 3D Extruded Cylinder + Light)
    const arcRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.2, 32),
      goldMaterial
    );
    arcRing.rotation.x = Math.PI / 2;
    arcRing.position.set(0, 0.1, 0.98);
    torsoGroup.add(arcRing);

    const arcInnerWell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.22, 32),
      darkMetalMaterial
    );
    arcInnerWell.rotation.x = Math.PI / 2;
    arcInnerWell.position.set(0, 0.1, 1.0);
    torsoGroup.add(arcInnerWell);

    const arcCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.30, 0.25, 32),
      cyanEmissiveMaterial
    );
    arcCore.rotation.x = Math.PI / 2;
    arcCore.position.set(0, 0.1, 1.02);
    torsoGroup.add(arcCore);

    const arcLight = new THREE.PointLight(0x38bdf8, 3.5, 6);
    arcLight.position.set(0, 0.1, 1.3);
    torsoGroup.add(arcLight);

    // 3 Articulated Abdominal Plates (Stomach)
    for (let s = 0; s < 3; s++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(2.3 - s * 0.2, 0.26, 1.5 - s * 0.1),
        s % 2 === 0 ? goldMaterial : crimsonMaterial
      );
      plate.position.set(0, -1.35 - s * 0.32, 0.05);
      torsoGroup.add(plate);
    }

    // Rear Armor Spine & Twin Thrusters (For full 3D 180° rotation view)
    const spinePlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.1, 0.4),
      darkMetalMaterial
    );
    spinePlate.position.set(0, 0.1, -0.95);
    torsoGroup.add(spinePlate);

    const leftThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.45, 24),
      darkMetalMaterial
    );
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.55, 0.35, -1.1);
    torsoGroup.add(leftThruster);

    const leftThrusterCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.47, 24),
      cyanEmissiveMaterial
    );
    leftThrusterCore.rotation.x = Math.PI / 2;
    leftThrusterCore.position.set(-0.55, 0.35, -1.12);
    torsoGroup.add(leftThrusterCore);

    const rightThruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.45, 24),
      darkMetalMaterial
    );
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.55, 0.35, -1.1);
    torsoGroup.add(rightThruster);

    const rightThrusterCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.47, 24),
      cyanEmissiveMaterial
    );
    rightThrusterCore.rotation.x = Math.PI / 2;
    rightThrusterCore.position.set(0.55, 0.35, -1.12);
    torsoGroup.add(rightThrusterCore);

    // [C] Left Arm & Gauntlet Group
    const leftArmGroup = new THREE.Group();
    suitGroup.add(leftArmGroup);

    const leftShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.65, 1.0),
      crimsonMaterial
    );
    leftShoulder.position.set(0, 0.6, 0);
    leftArmGroup.add(leftShoulder);

    const leftGauntlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 1.6, 0.8),
      crimsonMaterial
    );
    leftGauntlet.position.set(0, -0.4, 0);
    leftArmGroup.add(leftGauntlet);

    const leftWrist = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.35, 24),
      goldMaterial
    );
    leftWrist.position.set(0, -1.2, 0);
    leftArmGroup.add(leftWrist);

    const leftRepulsor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24),
      cyanEmissiveMaterial
    );
    leftRepulsor.rotation.x = Math.PI / 2;
    leftRepulsor.position.set(0, -1.45, 0.25);
    leftArmGroup.add(leftRepulsor);

    const leftRepulsorLight = new THREE.PointLight(0x38bdf8, 1.8, 3);
    leftRepulsorLight.position.set(0, -1.45, 0.5);
    leftArmGroup.add(leftRepulsorLight);

    // [D] Right Arm & Gauntlet Group
    const rightArmGroup = new THREE.Group();
    suitGroup.add(rightArmGroup);

    const rightShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.65, 1.0),
      crimsonMaterial
    );
    rightShoulder.position.set(0, 0.6, 0);
    rightArmGroup.add(rightShoulder);

    const rightGauntlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 1.6, 0.8),
      crimsonMaterial
    );
    rightGauntlet.position.set(0, -0.4, 0);
    rightArmGroup.add(rightGauntlet);

    const rightWrist = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.35, 24),
      goldMaterial
    );
    rightWrist.position.set(0, -1.2, 0);
    rightArmGroup.add(rightWrist);

    const rightRepulsor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24),
      cyanEmissiveMaterial
    );
    rightRepulsor.rotation.x = Math.PI / 2;
    rightRepulsor.position.set(0, -1.45, 0.25);
    rightArmGroup.add(rightRepulsor);

    const rightRepulsorLight = new THREE.PointLight(0x38bdf8, 1.8, 3);
    rightRepulsorLight.position.set(0, -1.45, 0.5);
    rightArmGroup.add(rightRepulsorLight);

    // [E] Legs Group (Thighs + Shins)
    const legsGroup = new THREE.Group();
    suitGroup.add(legsGroup);

    // Left Thigh
    const leftThigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.8, 0.95),
      crimsonMaterial
    );
    leftThigh.position.set(-0.85, 0.4, 0);
    legsGroup.add(leftThigh);

    const leftKnee = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.48, 0.42),
      goldMaterial
    );
    leftKnee.position.set(-0.85, -0.55, 0.45);
    legsGroup.add(leftKnee);

    // Right Thigh
    const rightThigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.8, 0.95),
      crimsonMaterial
    );
    rightThigh.position.set(0.85, 0.4, 0);
    legsGroup.add(rightThigh);

    const rightKnee = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.48, 0.42),
      goldMaterial
    );
    rightKnee.position.set(0.85, -0.55, 0.45);
    legsGroup.add(rightKnee);

    // [F] Sculpted 3D Boots Group with Articulated Segments & Iron Man Fire Boosters
    const bootsGroup = new THREE.Group();
    suitGroup.add(bootsGroup);

    // Reusable builder for an articulated Iron Man Mark boot
    const createArticulatedBoot = (isLeft) => {
      const boot = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // 1. Ankle Collar & Armor Cuff
      const ankleCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.44, 0.35, 24),
        goldMaterial
      );
      ankleCollar.position.set(0, 0.42, 0);
      boot.add(ankleCollar);

      // 2. Reinforced Heel Armor Block
      const heelArmor = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.75, 0.65),
        crimsonMaterial
      );
      heelArmor.position.set(0, 0.05, -0.35);
      boot.add(heelArmor);

      // 3. Midfoot Arch / Vamp Armor Plate
      const vampArmor = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.60, 0.8),
        crimsonMaterial
      );
      vampArmor.position.set(0, 0.08, 0.18);
      boot.add(vampArmor);

      // 4. Sculpted Gold Toe Cap
      const toeCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.45, 0.55),
        goldMaterial
      );
      toeCap.position.set(0, -0.06, 0.68);
      boot.add(toeCap);

      // 5. Heavy-Duty Treaded Sole Plate
      const solePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.20, 1.75),
        darkMetalMaterial
      );
      solePlate.position.set(0, -0.28, 0.15);
      boot.add(solePlate);

      // 6. Recessed Thruster Nozzles (Mounted beneath sole plate)
      const frontNozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.24, 0.16, 24),
        darkMetalMaterial
      );
      frontNozzle.position.set(0, -0.42, 0.45);
      boot.add(frontNozzle);

      const rearNozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, 0.16, 24),
        darkMetalMaterial
      );
      rearNozzle.position.set(0, -0.42, -0.15);
      boot.add(rearNozzle);

      // Helper to generate downward-pointing cone with base at y = 0 and apex extending strictly DOWNWARDS
      const createDownwardConeGeo = (radius, height) => {
        const geo = new THREE.ConeGeometry(radius, height, 24, 1, true);
        geo.rotateX(Math.PI);             // 1. Apex points down (-height/2), Base is at (+height/2)
        geo.translate(0, -height / 2, 0); // 2. Shift so base is at y = 0, Apex extends down to -height
        return geo;
      };

      // 7. Iron Man Fire Booster Plumes (STRICTLY BELOW SHOES, POINTING DOWNWARD)
      // Front thruster plume (Mounted below front nozzle)
      const frontBoosterGroup = new THREE.Group();
      frontBoosterGroup.position.set(0, -0.50, 0.45);
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

      // Rear thruster plume (Mounted below rear nozzle)
      const rearBoosterGroup = new THREE.Group();
      rearBoosterGroup.position.set(0, -0.50, -0.15);
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

      // Fiery Downward PointLight illuminating beneath the boot
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
        thrusterLight,
        flameGeos: [
          frontOuterGeo, frontInnerGeo, frontCoreGeo,
          rearOuterGeo, rearInnerGeo, rearCoreGeo
        ]
      };
    };

    const leftBootData = createArticulatedBoot(true);
    leftBootData.group.position.set(-0.85, 0, 0.2);
    bootsGroup.add(leftBootData.group);

    const rightBootData = createArticulatedBoot(false);
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
      screenY: window.innerHeight / 2
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

        // Check if touch is on or near the robot body
        const roboWorld = new THREE.Vector3();
        suitGroup.getWorldPosition(roboWorld);
        roboWorld.project(camera);
        const roboScreenX = (roboWorld.x * 0.5 + 0.5) * window.innerWidth;
        const roboScreenY = (-(roboWorld.y) * 0.5 + 0.5) * window.innerHeight;
        const distToRobo = Math.hypot(touch.clientX - roboScreenX, touch.clientY - roboScreenY);

        if (distToRobo < 320) {
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

      // Eye look calculation based on cursor position
      const headScreenX = window.innerWidth / 2;
      const headScreenY = window.innerHeight / 2;
      const dx = mouse.screenX - headScreenX;
      const dy = mouse.screenY - headScreenY;
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
            particleMaterial.size = 0.12;
            particleMaterial.opacity = 0.55;
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
        particleMaterial.size = 0.22;
        particleMaterial.opacity = 0.90;
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
      crimsonMaterial.dispose();
      goldMaterial.dispose();
      darkMetalMaterial.dispose();
      cyanEmissiveMaterial.dispose();
      whiteHeadMaterial.dispose();
      faceFrontMaterial.dispose();
      faceTexture.dispose();
      headGeometry.dispose();
      facePlateGeometry.dispose();

      flameOuterMaterial.dispose();
      flameInnerMaterial.dispose();
      flameCoreMaterial.dispose();
      leftBootData.flameGeos.forEach(g => g.dispose());
      rightBootData.flameGeos.forEach(g => g.dispose());

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 bg-navy-950 overflow-hidden pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default Background3D;
