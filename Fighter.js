// Legends of Iron - Fighter class (Procedural 3D Rig & Combat State Machine)

class VerletChain {
  constructor(length = 4, spacing = 0.15, gravity = -4.0, friction = 0.95) {
    this.points = [];
    this.gravity = gravity;
    this.friction = friction;
    this.spacing = spacing;
    
    for (let i = 0; i < length; i++) {
      this.points.push({
        pos: new THREE.Vector3(0, 0, 0),
        oldPos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(0, 0, 0)
      });
    }
  }

  update(anchorPos, dt, externalForce) {
    if (dt > 0.05) dt = 0.05; // clamp dt to prevent physics explosions
    
    // First point is locked to anchor
    this.points[0].pos.copy(anchorPos);
    this.points[0].oldPos.copy(anchorPos);

    // Apply gravity, inertia, and external forces (wind/motion drag) to other points
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      
      // Calculate velocity
      p.vel.copy(p.pos).sub(p.oldPos).multiplyScalar(this.friction);
      
      // Update oldPos
      p.oldPos.copy(p.pos);
      
      // Apply gravity & velocity
      p.pos.add(p.vel);
      p.pos.y += this.gravity * dt * dt;

      if (externalForce) {
        p.pos.addScaledVector(externalForce, dt * dt);
      }
    }


    // Constraints: keep correct spacing
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i+1];
        
        const diff = new THREE.Vector3().copy(p2.pos).sub(p1.pos);
        const dist = diff.length();
        if (dist === 0) continue;
        
        const delta = dist - this.spacing;
        const correction = diff.normalize().multiplyScalar(delta * 0.5);
        
        if (i > 0) {
          p1.pos.add(correction);
        }
        p2.pos.sub(correction);
      }
    }
  }
}

class Fighter {
  constructor(scene, charData, isPlayer2 = false) {
    this.scene = scene;
    this.id = charData.id;
    this.name = charData.name;
    this.colors = charData.colors;
    this.isPlayer2 = isPlayer2;
    this.costume = charData.costume || "A";
    this.colorOption = charData.colorOption || 1;

    // Combat metrics tracking
    this.totalStrikes = 0;
    this.connectedStrikes = 0;
    this.totalDamageDealt = 0;
    this.maxComboCount = 0;

    // Combat attributes
    this.maxHealth = 100;
    this.health = 100;
    this.maxRage = 100;
    this.rage = 0;
    this.comboCounter = 0;
    this.comboTimer = 0;

    // Physics
    this.position = new THREE.Vector3(isPlayer2 ? 3.0 : -3.0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetRotationY = isPlayer2 ? -Math.PI / 2 : Math.PI / 2;
    this.rotationY = this.targetRotationY;
    
    this.width = 1.0;
    this.height = 2.0;
    this.gravity = -18.0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.facingDir = isPlayer2 ? -1 : 1; // -1 for left, 1 for right

    // State Machine
    // States: IDLE, WALK, DASH, CROUCH, JUMP, PUNCH_L, PUNCH_H, KICK_L, KICK_H, SPECIAL, ULTIMATE, GRAB, HIT, BLOCK, FALLEN, KO
    this.state = "IDLE";
    this.stateTime = 0;
    this.stateDuration = 0;
    this.hasHitActive = false; // prevents multiple hits per attack swing
    this.invulnerable = false;

    this.onParry = null;
    this.onLand = null;
    this.onGroundImpact = null;

    // Procedural Mesh Group
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Blinking timers
    this.blinkTimer = 0;
    this.blinkDuration = 0.15;
    this.nextBlinkTime = Math.random() * 3.0 + 2.0;

    // Dynamic chain physics
    this.chains = [];
    this.chainMeshes = [];

    // Bones references for procedural animation
    this.parts = {};
    this.buildProceduralModel();
    this.setupVisualChains();
  }

  buildProceduralModel() {
    // Costume variant parameters
    let primaryColorHex = this.colors.primary;
    let secondaryColorHex = this.colors.secondary || "#222222";
    let glowColorHex = this.colors.glow || this.colors.primary;

    if (this.colorOption === 2) {
      primaryColorHex = this.colors.secondary || "#333333";
      secondaryColorHex = this.colors.primary;
      glowColorHex = "#ffaa00"; // alternate glow variant
    } else if (this.colorOption === 3) {
      primaryColorHex = "#ff3300"; // high temperature fire crimson
      secondaryColorHex = "#200a05";
      glowColorHex = "#ffea00";
    }

    if (this.costume === "B") {
      primaryColorHex = "#444444"; // carbon metallic variant
      secondaryColorHex = "#0d0d11";
    }

    // 1. Establish Curated PBR Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.id === "jadesentinel" ? "#e0b088" : "#d0a080"),
      roughness: 0.65,
      metalness: 0.15
    });
    skinMat.name = "skin";

    const armorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryColorHex),
      roughness: this.costume === "B" ? 0.08 : 0.22,
      metalness: 0.88,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    });
    armorMat.name = "armor";

    const glowingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColorHex),
      emissive: new THREE.Color(glowColorHex),
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9
    });
    glowingMat.name = "glow";

    const fabricMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.id === "ironfist" ? "#1a2536" : (this.id === "nebula" ? "#110f1c" : "#2c3e50")),
      roughness: 0.85,
      metalness: 0.08
    });
    fabricMat.name = "fabric";


    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.68,
      metalness: 0.5
    });

    // 2. Torso Assembly (Chest + Abdomen)
    const torso = new THREE.Group();
    torso.position.y = 1.15;
    this.mesh.add(torso);
    this.parts.torso = torso;

    // Chest Plate
    const chestGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.5, 24);
    const chest = new THREE.Mesh(chestGeo, this.id === "jadesentinel" ? skinMat : armorMat);
    chest.position.y = 0.25;
    chest.castShadow = true;
    chest.receiveShadow = true;
    torso.add(chest);
    this.parts.chest = chest;

    // Core Reactor Glow
    const coreGeo = new THREE.SphereGeometry(0.12, 20, 20);
    const core = new THREE.Mesh(coreGeo, glowingMat);
    core.position.set(0, 0.12, 0.28);
    chest.add(core);

    // Abdomen Abs
    const absGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.4, 24);
    const abs = new THREE.Mesh(absGeo, this.id === "jadesentinel" ? skinMat : fabricMat);
    abs.position.y = -0.18;
    abs.castShadow = true;
    abs.receiveShadow = true;
    torso.add(abs);
    this.parts.abs = abs;

    // Procedural glowing abs for brawler/cybersamurai
    if (this.id === "ironfist") {
      const abPlateGeo = new THREE.BoxGeometry(0.18, 0.05, 0.04);
      for (let i = 0; i < 3; i++) {
        const plate = new THREE.Mesh(abPlateGeo, glowingMat);
        plate.position.set(0, 0.08 - i * 0.09, 0.22);
        abs.add(plate);
      }
    }

    // 3. Head Assembly (Blinking Eyes & Mouth)
    const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const head = new THREE.Mesh(headGeo, this.id === "jadesentinel" ? skinMat : armorMat);
    head.position.y = 0.62;
    head.castShadow = true;
    chest.add(head);
    this.parts.head = head;

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.03, 16, 16);

    const leftEye = new THREE.Mesh(eyeGeo, glowingMat);
    leftEye.position.set(-0.06, 0.03, 0.15);
    head.add(leftEye);
    this.parts.leftEye = leftEye;

    const rightEye = new THREE.Mesh(eyeGeo, glowingMat);
    rightEye.position.set(0.06, 0.03, 0.15);
    head.add(rightEye);
    this.parts.rightEye = rightEye;

    // Visor for Nebula & Cyber Samurai
    if (this.id === "nebula" || this.id === "cybersamurai" || this.id === "ironfist") {
      const visorGeo = new THREE.BoxGeometry(0.2, 0.05, 0.03);
      const visor = new THREE.Mesh(visorGeo, glowingMat);
      visor.position.set(0, 0.03, 0.16);
      head.add(visor);
    }

    // Mouth
    const mouthGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.07, 0.15);
    head.add(mouth);
    this.parts.mouth = mouth;

    // Accessories
    if (this.id === "jadesentinel") {
      // Jade Shoulder Shields
      const shieldGeo = new THREE.BoxGeometry(0.48, 0.48, 0.08);
      const shield = new THREE.Mesh(shieldGeo, glowingMat);
      shield.position.set(-0.4, 0.2, 0);
      chest.add(shield);
    } else if (this.id === "cybersamurai") {
      // Samurai Horn Crest
      const hornGeo = new THREE.ConeGeometry(0.05, 0.28, 4);
      const horn = new THREE.Mesh(hornGeo, glowingMat);
      horn.position.set(0, 0.2, 0.08);
      horn.rotation.x = 0.4;
      head.add(horn);
    } else if (this.id === "vulcan") {
      // Rocky volcanic crown bumps
      const rockGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      for (let i = 0; i < 4; i++) {
        const bump = new THREE.Mesh(rockGeo, armorMat);
        bump.position.set((i - 1.5) * 0.08, 0.16, 0.05);
        bump.rotation.set(Math.random(), Math.random(), Math.random());
        head.add(bump);
      }
    } else if (this.id === "tigris") {
      // Feline triangle ears
      const earGeo = new THREE.ConeGeometry(0.05, 0.14, 3);
      earGeo.scale(1, 1, 0.4);
      
      const earL = new THREE.Mesh(earGeo, armorMat);
      earL.position.set(-0.1, 0.15, 0);
      earL.rotation.set(0, 0, 0.45);
      head.add(earL);
      
      const earR = new THREE.Mesh(earGeo, armorMat);
      earR.position.set(0.1, 0.15, 0);
      earR.rotation.set(0, 0, -0.45);
      head.add(earR);

      // Feline snout/muzzle
      const snoutGeo = new THREE.BoxGeometry(0.12, 0.06, 0.08);
      const snout = new THREE.Mesh(snoutGeo, skinMat);
      snout.position.set(0, -0.05, 0.13);
      head.add(snout);
    }


    // 4. Limbs Assembly Helper
    const createLimb = (parent, isLeft, isLeg) => {
      const side = isLeft ? -1 : 1;
      const shoulderX = isLeg ? 0.16 * side : 0.42 * side;
      const shoulderY = isLeg ? -0.2 : 0.15;

      const group = new THREE.Group();
      group.position.set(shoulderX, shoulderY, 0);
      parent.add(group);

      // Shoulder Armor / Pauldron
      if (!isLeg) {
        const padGeo = new THREE.SphereGeometry(0.15, 20, 20);
        padGeo.scale(1.2, 1, 1.2);
        const pad = new THREE.Mesh(padGeo, armorMat);
        pad.position.set(0.02 * side, 0.08, 0);
        group.add(pad);
      }

      // Upper limb (Biceps / Thighs)
      const len = isLeg ? 0.55 : 0.42;
      const upperGeo = new THREE.CylinderGeometry(isLeg ? 0.13 : 0.09, isLeg ? 0.11 : 0.08, len, 16);
      upperGeo.translate(0, -len / 2, 0);
      const upper = new THREE.Mesh(upperGeo, this.id === "jadesentinel" ? skinMat : armorMat);
      upper.castShadow = true;
      group.add(upper);

      // Joint
      const jointGeo = new THREE.SphereGeometry(isLeg ? 0.09 : 0.07, 16, 16);
      const joint = new THREE.Mesh(jointGeo, jointMat);
      joint.position.set(0, -len, 0);
      group.add(joint);

      // Lower limb (Calf / Forearm)
      const lowerGroup = new THREE.Group();
      lowerGroup.position.set(0, -len, 0);
      group.add(lowerGroup);

      const lowerLen = isLeg ? 0.55 : 0.42;
      const lowerGeo = new THREE.CylinderGeometry(isLeg ? 0.1 : 0.08, isLeg ? 0.08 : 0.06, lowerLen, 16);
      lowerGeo.translate(0, -lowerLen / 2, 0);
      const lower = new THREE.Mesh(lowerGeo, isLeg ? fabricMat : (this.id === "jadesentinel" ? skinMat : armorMat));
      lower.castShadow = true;
      lowerGroup.add(lower);

      // Hand / Foot
      let endGeo;
      if (isLeg) {
        endGeo = new THREE.BoxGeometry(0.14, 0.09, 0.26);
      } else {
        const size = this.id === "ironfist" ? 0.14 : (this.id === "vulcan" ? 0.18 : 0.08);
        endGeo = this.id === "vulcan" ? new THREE.BoxGeometry(0.2, 0.2, 0.2) : new THREE.SphereGeometry(size, 16, 16);
      }
      const endNode = new THREE.Mesh(endGeo, this.id === "vulcan" ? glowingMat : (this.id === "tigris" ? armorMat : glowingMat));
      endNode.position.set(0, -lowerLen, isLeg ? 0.06 : 0);
      endNode.castShadow = true;
      lowerGroup.add(endNode);

      // If Tigris arms, add three glowing claw blades!
      if (this.id === "tigris" && !isLeg) {
        const clawGeo = new THREE.ConeGeometry(0.015, 0.12, 4);
        clawGeo.rotateX(Math.PI / 2); // point forward
        clawGeo.translate(0, 0, 0.06);
        for (let c = -1; c <= 1; c++) {
          const claw = new THREE.Mesh(clawGeo, glowingMat);
          claw.position.set(c * 0.04, -0.02, 0.02);
          claw.castShadow = true;
          endNode.add(claw);
        }
      }


      return { root: group, elbow: lowerGroup, hand: endNode };
    };

    // Build Limbs
    this.parts.leftArm = createLimb(chest, true, false);
    this.parts.rightArm = createLimb(chest, false, false);
    this.parts.leftLeg = createLimb(abs, true, true);
    this.parts.rightLeg = createLimb(abs, false, true);

    // Weapons
    if (this.id === "cybersamurai") {
      const bladeGeo = new THREE.BoxGeometry(0.015, 0.85, 0.05);
      const bladeMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0, -0.38, 0);
      blade.rotation.x = Math.PI / 2;
      this.parts.rightArm.hand.add(blade);
      this.parts.weapon = blade;
    } else if (this.id === "nebula") {
      const dagGeo = new THREE.ConeGeometry(0.025, 0.38, 4);
      dagGeo.translate(0, 0.19, 0);
      const dagMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
      
      const dagL = new THREE.Mesh(dagGeo, dagMat);
      dagL.rotation.x = -Math.PI / 2;
      this.parts.leftArm.hand.add(dagL);

      const dagR = new THREE.Mesh(dagGeo, dagMat);
      dagR.rotation.x = -Math.PI / 2;
      this.parts.rightArm.hand.add(dagR);
    }
  }

  setupVisualChains() {
    if (this.id === "nebula") {
      // Ponytail: 5 joints
      const chain = new VerletChain(5, 0.12, -7.0, 0.9);
      this.chains.push({
        type: "ponytail",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.head.getWorldPosition(worldPos);
          // offset slightly backward relative to head direction
          worldPos.x -= 0.12 * this.facingDir;
          worldPos.y += 0.08;
          return worldPos;
        }
      });
      const mat = new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.3, metalness: 0.2 });
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(0.08 - i * 0.01, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.mesh.add(mesh); // Add to local group to prevent leaks
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    } else if (this.id === "jadesentinel") {
      // Jade belt sash: 5 joints
      const chain = new VerletChain(5, 0.15, -4.5, 0.88);
      this.chains.push({
        type: "sash",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.abs.getWorldPosition(worldPos);
          worldPos.x -= 0.18 * this.facingDir;
          worldPos.y -= 0.1;
          return worldPos;
        }
      });
      const mat = new THREE.MeshStandardMaterial({ color: 0x39ff14, roughness: 0.4, emissive: 0x39ff14, emissiveIntensity: 0.3 });
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(0.065, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.mesh.add(mesh);
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    } else if (this.id === "cybersamurai") {
      // Kabuto ribbon: 4 joints
      const chain = new VerletChain(4, 0.13, -5.0, 0.9);
      this.chains.push({
        type: "ribbon",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.head.getWorldPosition(worldPos);
          worldPos.x -= 0.1 * this.facingDir;
          worldPos.y += 0.15;
          return worldPos;
        }
      });
      const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.6 });
      const meshes = [];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.SphereGeometry(0.05 - i * 0.006, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.mesh.add(mesh);
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    } else if (this.id === "ironfist") {
      // Cyber spine heavy glowing wire: 4 joints
      const chain = new VerletChain(4, 0.16, -3.5, 0.85);
      this.chains.push({
        type: "wire",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.torso.getWorldPosition(worldPos);
          worldPos.x -= 0.08 * this.facingDir;
          worldPos.y += 0.1;
          return worldPos;
        }
      });
      const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffcc, 
        emissive: 0x00ffcc, 
        emissiveIntensity: 0.5, 
        roughness: 0.15, 
        metalness: 0.95 
      });
      const meshes = [];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.SphereGeometry(0.075 - i * 0.008, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.mesh.add(mesh);
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    } else if (this.id === "vulcan") {
      // Magma spine: 4 joints
      const chain = new VerletChain(4, 0.16, -2.5, 0.8);
      this.chains.push({
        type: "spine",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.torso.getWorldPosition(worldPos);
          worldPos.x -= 0.15 * this.facingDir;
          worldPos.y += 0.15;
          return worldPos;
        }
      });
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff4500,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });
      mat.name = "glow";
      const meshes = [];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.BoxGeometry(0.12 - i * 0.015, 0.12 - i * 0.015, 0.12 - i * 0.015);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.mesh.add(mesh);
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    } else if (this.id === "tigris") {
      // Tiger tail: 5 joints
      const chain = new VerletChain(5, 0.15, -1.8, 0.92);
      this.chains.push({
        type: "tail",
        physics: chain,
        getAnchor: () => {
          const worldPos = new THREE.Vector3();
          this.parts.abs.getWorldPosition(worldPos);
          worldPos.x -= 0.18 * this.facingDir;
          worldPos.y -= 0.08;
          return worldPos;
        }
      });
      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.8 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.8 });
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(0.06 - i * 0.007, 8, 8);
        const mesh = new THREE.Mesh(geo, i % 2 === 0 ? orangeMat : blackMat);
        mesh.castShadow = true;
        this.mesh.add(mesh);
        meshes.push(mesh);
      }
      this.chainMeshes.push(meshes);
    }

  }

  updateChains(dt) {
    // 1. Calculate environmental wind based on active stage
    const windForce = new THREE.Vector3(0, 0, 0);
    if (window.GameApp && window.GameApp.selectedStageId === "cybercity") {
      windForce.x = -1.2; // rain wind blows left
    } else if (window.GameApp && window.GameApp.selectedStageId === "lavadojo") {
      windForce.y = 0.8;  // hot rising air drafts
    }
    
    // 2. Add movement drag force (opposite to velocity vector)
    const dragForce = new THREE.Vector3().copy(this.velocity).multiplyScalar(-0.45);
    const totalForce = new THREE.Vector3().copy(windForce).add(dragForce);

    this.chains.forEach((chainInfo, chainIndex) => {
      const anchorWorld = chainInfo.getAnchor();
      chainInfo.physics.update(anchorWorld, dt, totalForce);
      
      const meshes = this.chainMeshes[chainIndex];
      chainInfo.physics.points.forEach((point, ptIndex) => {
        // Convert world position of Verlet point back to local space of the fighter group
        const localPos = new THREE.Vector3().copy(point.pos).sub(this.position);
        meshes[ptIndex].position.copy(localPos);
      });
    });
  }


  updateBlinking(dt) {
    this.blinkTimer += dt;
    if (this.blinkTimer >= this.nextBlinkTime) {
      const progress = this.blinkTimer - this.nextBlinkTime;
      if (progress < this.blinkDuration) {
        const scaleY = Math.abs(Math.sin((progress / this.blinkDuration) * Math.PI));
        this.parts.leftEye.scale.y = 1.0 - scaleY * 0.95;
        this.parts.rightEye.scale.y = 1.0 - scaleY * 0.95;
      } else {
        this.parts.leftEye.scale.y = 1.0;
        this.parts.rightEye.scale.y = 1.0;
        this.blinkTimer = 0;
        this.nextBlinkTime = Math.random() * 3.0 + 2.0; // Blink again in 2 to 5 seconds
      }
    }
  }

  updateFaceExpressions() {
    if (!this.parts.mouth) return;

    if (["HIT", "KO", "PUNCH_H", "KICK_H", "SPECIAL", "ULTIMATE"].includes(this.state)) {
      // Open mouth wide in combat exertion or pain
      this.parts.mouth.scale.set(1.0, 3.8, 1.6);
    } else {
      // Natural closed mouth with subtle breathing animation
      const breatheOsc = 1.0 + Math.sin(Date.now() * 0.005) * 0.12;
      this.parts.mouth.scale.set(1.0, breatheOsc, 1.0);
    }
  }

  updateMaterials() {
    const healthPct = this.health / this.maxHealth;
    const damageRatio = 1.0 - healthPct;
    
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        if (mat.isMeshStandardMaterial) {
          if (!mat.userData.originalColor) {
            mat.userData.originalColor = mat.color.clone();
          }
          if (mat.userData.originalRoughness === undefined) {
            mat.userData.originalRoughness = mat.roughness;
          }
          if (mat.userData.originalMetalness === undefined) {
            mat.userData.originalMetalness = mat.metalness;
          }

          if (mat.name === "skin") {
            // Skin gets shinier from sweat buildup (roughness decreases!)
            mat.roughness = THREE.MathUtils.lerp(mat.userData.originalRoughness, 0.32, damageRatio);
            // Apply subtle blood/bruise redness coloring to skin
            mat.color.copy(mat.userData.originalColor).lerp(new THREE.Color(0xa86b5e), damageRatio * 0.28);
          } else if (mat.name === "armor") {
            // Armor gets dirty/scratched (roughness increases, metalness dims)
            mat.roughness = THREE.MathUtils.lerp(mat.userData.originalRoughness, 0.8, damageRatio * 0.4);
            mat.metalness = THREE.MathUtils.lerp(mat.userData.originalMetalness, 0.3, damageRatio * 0.35);
            // Battle carbon burn coloring
            mat.color.copy(mat.userData.originalColor).lerp(new THREE.Color(0x181818), damageRatio * 0.45);
          } else if (mat.name === "fabric") {
            // Fabric gets stained/soiled
            mat.roughness = THREE.MathUtils.lerp(mat.userData.originalRoughness, 0.95, damageRatio * 0.2);
            mat.color.copy(mat.userData.originalColor).lerp(new THREE.Color(0x101015), damageRatio * 0.35);
          } else if (mat.name === "glow") {
            // Glow dims slightly as power is depleted
            if (mat.emissive) {
              if (!mat.userData.originalEmissiveIntensity) {
                mat.userData.originalEmissiveIntensity = mat.emissiveIntensity || 0.7;
              }
              mat.emissiveIntensity = THREE.MathUtils.lerp(mat.userData.originalEmissiveIntensity, 0.28, damageRatio);
            }
          }
        }
      }
    });
  }


  // Handle combat triggers
  performMove(moveType) {
    if (["HIT", "FALLEN", "KO", "ULTIMATE", "SPECIAL", "SIDESTEP_L", "SIDESTEP_R"].includes(this.state)) return;

    this.hasHitActive = false;
    this.state = moveType;
    this.stateTime = 0;

    switch (moveType) {
      case "SIDESTEP_L":
        this.stateDuration = 0.25;
        this.velocity.z = -5.0;
        window.SoundSynth.playSFX("dash");
        break;
      case "SIDESTEP_R":
        this.stateDuration = 0.25;
        this.velocity.z = 5.0;
        window.SoundSynth.playSFX("dash");
        break;
      case "PUNCH_L":
        this.stateDuration = 0.22; // fast 13 frames
        window.SoundSynth.playSFX("light_hit"); // whoosh
        break;
      case "PUNCH_H":
        this.stateDuration = 0.40; // heavy punch
        break;
      case "KICK_L":
        this.stateDuration = 0.26;
        window.SoundSynth.playSFX("light_hit");
        break;
      case "KICK_H":
        this.stateDuration = 0.45;
        break;
      case "GRAB":
        this.stateDuration = 0.35;
        window.SoundSynth.playSFX("grab");
        break;
      case "SPECIAL":
        this.stateDuration = 0.6;
        window.SoundSynth.playSFX("special");
        break;
      case "ULTIMATE":
        if (this.rage < 100) {
          this.state = "IDLE"; // fail if insufficient rage
          return;
        }
        this.rage = 0;
        this.stateDuration = 1.5; // long cinematic ultimate
        window.SoundSynth.playSFX("ultimate_charge");
        break;
      case "DASH_FWD":
        this.stateDuration = 0.25;
        this.velocity.x = 9.0 * this.facingDir;
        window.SoundSynth.playSFX("dash");
        break;
      case "DASH_BWD":
        this.stateDuration = 0.25;
        this.velocity.x = -7.5 * this.facingDir;
        window.SoundSynth.playSFX("dash");
        break;
    }
  }

  takeDamage(amount, isBlock, isHeavy, attackerDir, attackerComboCount = 0, attackerId = "") {
    if (this.state === "KO" || this.state === "FALLEN" || (window.GameApp && window.GameApp.isKOState)) return 0;

    const isPerfectParry = isBlock && this.stateTime < 0.12 && !["KO", "FALLEN", "HIT"].includes(this.state);
    if (isPerfectParry) {
      this.state = "BLOCK";
      this.stateTime = 0;
      this.stateDuration = 0.25;
      this.velocity.x = 0.5 * attackerDir;
      this.rage = Math.min(100, this.rage + 20);
      window.SoundSynth.playSFX("special");
      if (this.onParry) {
        this.onParry();
      }
      return 0;
    }

    let damageDealt = 0;
    if (isBlock) {
      // Reduce damage heavily
      damageDealt = amount * 0.15;
      this.health = Math.max(0, this.health - damageDealt);
      this.state = "BLOCK";
      this.stateTime = 0;
      this.stateDuration = 0.2;
      this.velocity.x = 2.5 * attackerDir; // small pushback
      window.SoundSynth.playSFX("block");
    } else {
      // Full hit
      damageDealt = amount;
      const wasAirborne = !this.isGrounded;
      
      if (wasAirborne) {
        // Apply combo damage scaling for air juggles
        damageDealt = amount * Math.pow(0.85, attackerComboCount);
        this.state = "HIT";
        this.stateTime = 0;
        this.stateDuration = 0.4;
        this.velocity.x = 2.0 * attackerDir;
        this.velocity.y = 5.2; // pop them back up!
        this.isGrounded = false;
        
        if (attackerId === "vulcan") {
          window.SoundSynth.playSFX("fire_explode");
        } else if (attackerId === "tigris") {
          window.SoundSynth.playSFX("claw_hit");
        } else {
          window.SoundSynth.playSFX("light_hit");
        }
      } else {
        this.state = isHeavy ? "FALLEN" : "HIT";
        this.stateTime = 0;
        this.stateDuration = isHeavy ? 0.9 : 0.35; // knockdowns take longer to recover
        this.velocity.x = (isHeavy ? 6.5 : 4.0) * attackerDir; // pushback
        if (isHeavy) {
          this.velocity.y = 4.0; // small pop up into air
          this.isGrounded = false;
          
          if (attackerId === "vulcan") {
            window.SoundSynth.playSFX("fire_explode");
          } else {
            window.SoundSynth.playSFX("heavy_hit");
          }
        } else {
          if (attackerId === "vulcan") {
            window.SoundSynth.playSFX("fire_explode");
          } else if (attackerId === "tigris") {
            window.SoundSynth.playSFX("claw_hit");
          } else {
            window.SoundSynth.playSFX("light_hit");
          }
        }
      }
      
      this.health = Math.max(0, this.health - damageDealt);

      // Gain rage on hit taken
      this.rage = Math.min(100, this.rage + damageDealt * 0.5);

      if (this.health <= 0) {
        this.state = "KO";
        this.stateDuration = 999; // infinite until reset
        this.velocity.x = 8.0 * attackerDir;
        this.velocity.y = 6.0;
        this.isGrounded = false;
        window.SoundSynth.playSFX("ko_slow");
      }
    }
    
    return damageDealt;
  }

  // Physics constraints and update rotations
  update(dt, opponent) {
    this.stateTime += dt;
    if (this.comboTimer > 0) this.comboTimer -= dt;
    else this.comboCounter = 0;

    // 1. Friction & Gravity Physics
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * dt;
    }
    
    // horizontal and depth decay
    const drag = this.isGrounded ? 12.0 : 3.0;
    this.velocity.x -= this.velocity.x * drag * dt;
    this.velocity.z -= this.velocity.z * drag * dt;

    // Apply translation
    this.position.addScaledVector(this.velocity, dt);

    // Lerp back to Z = 0 if not in active sidestep
    if (this.state !== "SIDESTEP_L" && this.state !== "SIDESTEP_R") {
      this.position.z += (0.0 - this.position.z) * 10.0 * dt;
      if (Math.abs(this.position.z) < 0.01) this.position.z = 0;
    }

    // Clamping to floor
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        if (this.onLand) {
          this.onLand(this.position);
        }
        
        const isHeavyKnockdown = (this.state === "FALLEN" || this.state === "KO");
        if (this.onGroundImpact) {
          this.onGroundImpact(this.position, isHeavyKnockdown);
        }

        if (isHeavyKnockdown) {
          this.velocity.x = 0;
        }
      }

    }

    // Clamping within stage boundaries
    const stageWidth = 12.0; // boundary limit
    this.position.x = THREE.MathUtils.clamp(this.position.x, -stageWidth, stageWidth);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -1.2, 1.2);

    // 2. Rotate to face opponent (except during dashes/moves)
    if (opponent && this.state !== "KO" && this.state !== "FALLEN" && !this.state.startsWith("DASH")) {
      const dx = opponent.position.x - this.position.x;
      this.facingDir = dx >= 0 ? 1 : -1;
      this.targetRotationY = dx >= 0 ? Math.PI / 2 : -Math.PI / 2;
      
      // Interpolate rotation
      const angleDiff = this.targetRotationY - this.rotationY;
      this.rotationY += angleDiff * 0.15;
    }
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // 3. Resolve temporary combat state timings
    if (this.state !== "IDLE" && this.state !== "KO" && this.stateTime >= this.stateDuration) {
      this.state = "IDLE";
      this.stateTime = 0;
    }

    // 4. Procedural Bone Animations
    this.animateBones(dt);

    // 5. Update blinking, face expressions, materials, and chain physics
    this.updateBlinking(dt);
    this.updateFaceExpressions();
    this.updateMaterials();
    this.updateChains(dt);

    // 6. Dynamic Combat Particle triggers
    if (window.GameApp && window.GameApp.engine && window.GameApp.engine.graphicsPreset !== "Low") {
      const particles = window.GameApp.engine.particles;
      
      // Wind speed streaks during dashes
      if (this.state.startsWith("DASH") && Math.random() > 0.4) {
        const streakPos = new THREE.Vector3(this.position.x, this.position.y + 1.1, this.position.z);
        particles.spawnWindStreak(streakPos, this.facingDir);
      }
      
      // Rain floor ripples when walking/standing in Neon Shibuya
      if (this.isGrounded && (this.state.startsWith("WALK") || this.state === "IDLE" || this.state === "BLOCK") && Math.random() > 0.91) {
        if (window.GameApp.selectedStageId === "cybercity") {
          const ripplePos = new THREE.Vector3(
            this.position.x + (Math.random() - 0.5) * 0.9,
            0.01,
            this.position.z + (Math.random() - 0.5) * 0.4
          );
          particles.spawnRainRipple(ripplePos);
        }
      }
    }
  }


  animateBones(dt) {
    const t = this.stateTime;
    const speedScale = 14;
    const osc = Math.sin(Date.now() * 0.008);

    // Reset default transforms
    this.parts.torso.rotation.set(0, 0, 0);
    this.parts.head.rotation.set(0, 0, 0);
    this.parts.leftArm.root.rotation.set(0, 0, -0.4);
    this.parts.leftArm.elbow.rotation.set(0, 0, -0.5);
    this.parts.rightArm.root.rotation.set(0, 0, 0.4);
    this.parts.rightArm.elbow.rotation.set(0, 0, 0.5);
    
    this.parts.leftLeg.root.rotation.set(0, 0, -0.15);
    this.parts.leftLeg.elbow.rotation.set(0, 0, 0.15);
    this.parts.rightLeg.root.rotation.set(0, 0, 0.15);
    this.parts.rightLeg.elbow.rotation.set(0, 0, -0.15);

    // Apply state specific bones rotations
    switch (this.state) {
      case "SIDESTEP_L":
        this.parts.torso.rotation.z = -0.3 * this.facingDir;
        this.parts.leftLeg.root.rotation.x = -0.4;
        this.parts.rightLeg.root.rotation.x = 0.4;
        break;
      case "SIDESTEP_R":
        this.parts.torso.rotation.z = 0.3 * this.facingDir;
        this.parts.leftLeg.root.rotation.x = 0.4;
        this.parts.rightLeg.root.rotation.x = -0.4;
        break;
      case "IDLE":
        if (this.id === "vulcan") {
          // Heavy wide boxing stance
          this.parts.torso.position.y = 1.15 + osc * 0.015;
          this.parts.torso.rotation.x = 0.1;
          this.parts.leftArm.root.rotation.set(0.6 + osc * 0.05, 0, -0.2); // high boxing guard
          this.parts.leftArm.elbow.rotation.set(-0.8, 0, 0);
          this.parts.rightArm.root.rotation.set(0.6 + osc * 0.05, 0, 0.2);
          this.parts.rightArm.elbow.rotation.set(-0.8, 0, 0);
          
          this.parts.leftLeg.root.rotation.set(-0.25, 0, -0.2);
          this.parts.rightLeg.root.rotation.set(0.25, 0, 0.2);
        } else if (this.id === "tigris") {
          // Low feline crouch stance
          this.parts.torso.position.y = 0.88 + osc * 0.03;
          this.parts.torso.rotation.x = 0.45; // forward leaning
          this.parts.leftArm.root.rotation.set(0.1, 0, -0.4);
          this.parts.leftArm.elbow.rotation.set(-0.4, 0, 0.2);
          this.parts.rightArm.root.rotation.set(0.1, 0, 0.4);
          this.parts.rightArm.elbow.rotation.set(-0.4, 0, -0.2);
          
          this.parts.leftLeg.root.rotation.set(-0.45, 0, -0.1);
          this.parts.leftLeg.elbow.rotation.set(0.6, 0, 0);
          this.parts.rightLeg.root.rotation.set(0.2, 0, 0.15);
          this.parts.rightLeg.elbow.rotation.set(-0.2, 0, 0);
        } else {
          // Breathing idle wobble
          this.parts.torso.position.y = 1.1 + osc * 0.02;
          this.parts.torso.rotation.x = 0.05 + osc * 0.02;
          this.parts.leftArm.root.rotation.x = 0.2 + osc * 0.1;
          this.parts.leftArm.elbow.rotation.x = -0.6 - osc * 0.05;
          this.parts.rightArm.root.rotation.x = 0.2 + osc * 0.1;
          this.parts.rightArm.elbow.rotation.x = -0.6 - osc * 0.05;
          
          this.parts.leftLeg.root.rotation.x = -0.1;
          this.parts.rightLeg.root.rotation.x = 0.1;
        }
        break;


      case "WALK_FWD":
      case "WALK_BWD":
        if (this.id === "tigris") {
          // Feral stalk walk
          const cycle = Date.now() * 0.015;
          const swing = Math.sin(cycle);
          this.parts.torso.position.y = 0.85 + Math.abs(swing) * 0.04;
          this.parts.torso.rotation.x = 0.45;
          
          this.parts.leftLeg.root.rotation.x = swing * 0.7;
          this.parts.rightLeg.root.rotation.x = -swing * 0.7;
          
          this.parts.leftArm.root.rotation.x = -swing * 0.5;
          this.parts.rightArm.root.rotation.x = swing * 0.5;
        } else {
          // Walk cycle swings
          const cycle = Date.now() * 0.012;
          const swing = Math.sin(cycle);
          this.parts.leftLeg.root.rotation.x = swing * 0.6;
          this.parts.leftLeg.elbow.rotation.x = Math.max(0, -swing) * 0.6;
          this.parts.rightLeg.root.rotation.x = -swing * 0.6;
          this.parts.rightLeg.elbow.rotation.x = Math.max(0, swing) * 0.6;

          this.parts.leftArm.root.rotation.x = -swing * 0.4;
          this.parts.rightArm.root.rotation.x = swing * 0.4;
        }
        break;


      case "JUMP":
        // Draw knees in
        this.parts.leftLeg.root.rotation.x = -0.8;
        this.parts.leftLeg.elbow.rotation.x = 1.0;
        this.parts.rightLeg.root.rotation.x = -0.8;
        this.parts.rightLeg.elbow.rotation.x = 1.0;
        this.parts.leftArm.root.rotation.z = -1.2;
        this.parts.rightArm.root.rotation.z = 1.2;
        break;

      case "CROUCH":
        this.parts.torso.position.y = 0.75;
        this.parts.leftLeg.root.rotation.x = -1.1;
        this.parts.leftLeg.elbow.rotation.x = 1.4;
        this.parts.rightLeg.root.rotation.x = -1.1;
        this.parts.rightLeg.elbow.rotation.x = 1.4;
        break;

      case "PUNCH_L":
        // Quick right jab
        const punchProgress = Math.sin((t / this.stateDuration) * Math.PI);
        this.parts.torso.rotation.y = -0.3 * punchProgress * this.facingDir;
        this.parts.rightArm.root.rotation.x = -Math.PI / 2;
        this.parts.rightArm.root.rotation.z = -0.5 * punchProgress;
        this.parts.rightArm.elbow.rotation.x = -0.1;
        break;

      case "PUNCH_H":
        // Big heavy lunging windup hook
        const progressH = t / this.stateDuration;
        if (progressH < 0.4) {
          // Pull back
          const w = progressH / 0.4;
          this.parts.torso.rotation.y = 0.4 * w;
          this.parts.rightArm.root.rotation.x = -0.2;
          this.parts.rightArm.elbow.rotation.x = -1.3;
        } else {
          // Unleash swing
          const w = (progressH - 0.4) / 0.6;
          const punchSwipe = Math.sin(w * Math.PI / 2);
          this.parts.torso.rotation.y = -0.6 * punchSwipe;
          this.parts.rightArm.root.rotation.x = -1.5;
          this.parts.rightArm.root.rotation.y = 0.8 * punchSwipe;
          this.parts.rightArm.elbow.rotation.x = 0;
        }
        break;

      case "KICK_L":
        // Fast snap kick
        const kickProgress = Math.sin((t / this.stateDuration) * Math.PI);
        this.parts.leftLeg.root.rotation.x = -1.3 * kickProgress;
        this.parts.leftLeg.elbow.rotation.x = 0.2 * (1 - kickProgress);
        this.parts.rightLeg.root.rotation.x = 0.4 * kickProgress;
        break;

      case "KICK_H":
        // Slow launching spin kick
        const kickProgressH = t / this.stateDuration;
        this.parts.torso.rotation.y = kickProgressH * Math.PI * 1.5; // spin
        this.parts.rightLeg.root.rotation.x = -1.6 * Math.sin(kickProgressH * Math.PI);
        this.parts.rightLeg.elbow.rotation.x = 0.1;
        break;

      case "GRAB":
        // Reach out with both arms
        const grabProgress = Math.sin((t / this.stateDuration) * Math.PI);
        this.parts.leftArm.root.rotation.set(-1.0 * grabProgress, 0, -0.6 * (1 - grabProgress));
        this.parts.rightArm.root.rotation.set(-1.0 * grabProgress, 0, 0.6 * (1 - grabProgress));
        break;

      case "SPECIAL":
        if (this.id === "vulcan") {
          // Vulcan throws a magma stone boulder
          const specProg = t / this.stateDuration;
          if (specProg < 0.45) {
            // Windup: pull back arm
            this.parts.torso.rotation.y = 0.5 * this.facingDir;
            this.parts.rightArm.root.rotation.set(0.3, 0, 0.4);
            this.parts.rightArm.elbow.rotation.x = -1.2;
          } else {
            // Throw action
            const throwStrength = Math.sin((specProg - 0.45) / 0.55 * Math.PI);
            this.parts.torso.rotation.y = -0.5 * this.facingDir * throwStrength;
            this.parts.rightArm.root.rotation.set(-Math.PI / 2, 0, -0.3 * throwStrength);
            this.parts.rightArm.elbow.rotation.x = -0.15;
          }
        } else if (this.id === "tigris") {
          // Tigris quick plasma slash swipe
          const specProg = t / this.stateDuration;
          const swipe = Math.sin(specProg * Math.PI);
          this.parts.torso.rotation.y = -0.5 * this.facingDir * swipe;
          this.parts.rightArm.root.rotation.set(-1.0 * swipe, 0.8 * swipe, -0.6 * swipe);
        } else {
          // Standard: Raise arms to shoot energy projectile
          const specProgress = Math.sin((t / this.stateDuration) * Math.PI);
          this.parts.torso.rotation.x = -0.2 * specProgress;
          this.parts.leftArm.root.rotation.set(-1.4 * specProgress, 0, 0.2);
          this.parts.rightArm.root.rotation.set(-1.4 * specProgress, 0, -0.2);
        }
        break;

      case "ULTIMATE":
        if (this.id === "vulcan") {
          // METEOR SLAM ULTIMATE
          const progress = t / this.stateDuration;
          if (progress < 0.35) {
            // Crouch down gathering volcanic energy
            this.parts.torso.position.y = 0.65;
            this.parts.torso.rotation.x = 0.35;
            this.parts.leftArm.root.rotation.set(0.6, 0, -0.6);
            this.parts.rightArm.root.rotation.set(0.6, 0, 0.6);
          } else if (progress < 0.7) {
            // Volcano leap skyward
            const leapProg = (progress - 0.35) / 0.35;
            this.parts.torso.position.y = 1.15 + Math.sin(leapProg * Math.PI) * 2.6;
            this.parts.leftArm.root.rotation.set(-Math.PI, 0, -0.4);
            this.parts.rightArm.root.rotation.set(-Math.PI, 0, 0.4);
          } else {
            // Meteor slam down
            const slamProg = (progress - 0.7) / 0.3;
            this.parts.torso.position.y = 1.15 - 1.1 * slamProg;
            this.parts.leftArm.root.rotation.set(-0.2, 0, -0.2);
            this.parts.rightArm.root.rotation.set(-0.2, 0, 0.2);
            this.parts.rightArm.elbow.rotation.x = -1.3;
          }
        } else if (this.id === "tigris") {
          // HUNTER'S FRENZY multiple speed claw slashes
          const progress = t / this.stateDuration;
          const cycle = Math.sin(progress * Math.PI * 8.0);
          this.parts.torso.position.y = 0.9 + cycle * 0.06;
          this.parts.leftArm.root.rotation.set(-Math.PI / 2 + cycle * 0.5, 0, -0.5);
          this.parts.rightArm.root.rotation.set(-Math.PI / 2 - cycle * 0.5, 0, 0.5);
        } else {
          // Standard ultimate pose: charge energy pose
          const ultProgress = t / this.stateDuration;
          if (ultProgress < 0.6) {
            this.parts.torso.position.y = 0.9;
            this.parts.torso.rotation.x = 0.3;
            this.parts.leftArm.root.rotation.set(0.5, 0, -0.8);
            this.parts.rightArm.root.rotation.set(0.5, 0, 0.8);
          } else {
            this.parts.torso.position.y = 1.3;
            this.parts.torso.rotation.x = -0.3;
            this.parts.leftArm.root.rotation.set(-1.6, 0, -1.5);
            this.parts.rightArm.root.rotation.set(-1.6, 0, 1.5);
          }
        }
        break;


      case "BLOCK":
        this.parts.torso.rotation.y = 0.25 * this.facingDir;
        this.parts.leftArm.root.rotation.set(-1.2, 0.8, -0.1);
        this.parts.rightArm.root.rotation.set(-1.2, -0.8, 0.1);
        break;

      case "HIT":
        // Lean back in pain
        const hitProgress = Math.sin((t / this.stateDuration) * Math.PI);
        this.parts.torso.rotation.x = -0.4 * hitProgress;
        this.parts.torso.position.y = 1.1 - 0.1 * hitProgress;
        this.parts.head.rotation.x = 0.3 * hitProgress;
        this.parts.leftArm.root.rotation.z = -1.0 * hitProgress;
        this.parts.rightArm.root.rotation.z = 1.0 * hitProgress;
        break;

      case "FALLEN":
        // Rotate body flat
        const fallProgress = Math.min(1.0, t / this.stateDuration);
        const fallAngle = fallProgress * Math.PI / 2;
        this.parts.torso.rotation.z = fallAngle * this.facingDir;
        this.parts.torso.position.y = 1.1 - 1.05 * fallProgress;
        this.parts.leftLeg.root.rotation.x = 0;
        this.parts.rightLeg.root.rotation.x = 0;
        break;

      case "KO":
        // Keep lying flat on ground
        this.parts.torso.rotation.z = (Math.PI / 2) * this.facingDir;
        this.parts.torso.position.y = 0.05;
        this.parts.leftLeg.root.rotation.x = 0;
        this.parts.rightLeg.root.rotation.x = 0;
        this.parts.leftArm.root.rotation.set(0, 0, 0);
        this.parts.rightArm.root.rotation.set(0, 0, 0);
        break;

      case "INTRO":
        // Walk in and raise fist taunt
        const introProg = t / this.stateDuration;
        if (introProg < 0.5) {
          // Walk animation sway
          const walkOsc = Math.sin(t * 12);
          this.parts.leftLeg.root.rotation.x = 0.6 * walkOsc;
          this.parts.rightLeg.root.rotation.x = -0.6 * walkOsc;
          this.parts.torso.position.y = 1.15 + 0.05 * Math.abs(walkOsc);
        } else {
          // Stop and raise right arm to salute/taunt
          this.parts.leftLeg.root.rotation.x = 0;
          this.parts.rightLeg.root.rotation.x = 0;
          this.parts.torso.position.y = 1.15;
          this.parts.rightArm.root.rotation.set(-2.0, 0, 0.4); // raise fist
          this.parts.rightArm.elbow.rotation.x = -0.4;
          this.parts.leftArm.root.rotation.set(0.3, 0, -0.3);
        }
        break;

      case "WIN_POSE":
        // Wave arm and raise face cinematic victory pose
        const winOsc = Math.sin(t * 2.5);
        this.parts.leftLeg.root.rotation.x = 0.1;
        this.parts.rightLeg.root.rotation.x = -0.1;
        this.parts.torso.position.y = 1.2 + Math.abs(winOsc) * 0.04;
        this.parts.leftArm.root.rotation.set(-0.3, 0, -0.4);
        this.parts.rightArm.root.rotation.set(-2.2 + winOsc * 0.15, 0, 0.2); // wave fist
        this.parts.rightArm.elbow.rotation.x = -0.2;
        this.parts.head.rotation.x = -0.25; // look up triumphantly
        break;

      case "TAUNT":
        // Challenge opponent
        const tauntProg = Math.sin((t / this.stateDuration) * Math.PI);
        this.parts.torso.rotation.x = 0.2 * tauntProg;
        this.parts.leftArm.root.rotation.set(-0.8 * tauntProg, 0, -0.4);
        this.parts.rightArm.root.rotation.set(-1.4 * tauntProg, -0.5 * tauntProg, 0.2);
        this.parts.rightArm.elbow.rotation.x = -0.5 * tauntProg;
        break;
    }
  }

  // Get current active hurtbox AABB
  getHurtbox() {
    let w = this.width;
    let h = this.height;
    let y = this.position.y + h / 2;

    if (this.state === "CROUCH") {
      h *= 0.65;
      y = this.position.y + h / 2;
    } else if (this.state === "FALLEN" || this.state === "KO") {
      w = this.height;
      h = 0.3;
      y = this.position.y + h / 2;
    }

    return {
      minX: this.position.x - w / 2,
      maxX: this.position.x + w / 2,
      minY: y - h / 2,
      maxY: y + h / 2
    };
  }

  // Get active attack hitbox AABB (null if not in active damage frame window)
  getHitbox() {
    const t = this.stateTime;
    let isAttackFrame = false;
    let reach = 0.8;
    let hWidth = 0.4;
    let hHeight = 0.4;
    let hOffsetY = 1.2; // default high chest level punch
    let damage = 0;
    let isHeavy = false;

    switch (this.state) {
      case "PUNCH_L":
        // active on frame 0.08 to 0.15
        if (t >= 0.06 && t <= 0.15) {
          isAttackFrame = true;
          reach = 1.1;
          hOffsetY = 1.3;
          damage = 4.5;
        }
        break;
      case "PUNCH_H":
        // active on frame 0.22 to 0.34
        if (t >= 0.20 && t <= 0.34) {
          isAttackFrame = true;
          reach = 1.3;
          hOffsetY = 1.3;
          hHeight = 0.5;
          damage = 9.0;
          isHeavy = true;
        }
        break;
      case "KICK_L":
        if (t >= 0.08 && t <= 0.18) {
          isAttackFrame = true;
          reach = 1.2;
          hOffsetY = 0.6; // low-mid kick
          damage = 5.0;
        }
        break;
      case "KICK_H":
        if (t >= 0.22 && t <= 0.38) {
          isAttackFrame = true;
          reach = 1.45;
          hOffsetY = 1.0;
          hHeight = 0.6;
          damage = 11.0;
          isHeavy = true;
        }
        break;
      case "GRAB":
        if (t >= 0.1 && t <= 0.22) {
          isAttackFrame = true;
          reach = 0.85;
          hOffsetY = 1.1;
          damage = 12.0;
          isHeavy = true;
        }
        break;
      case "SPECIAL":
        // launches a projectile trigger
        if (t >= 0.25 && t <= 0.35 && !this.hasHitActive) {
          this.hasHitActive = true;
          this.launchProjectile();
        }
        break;
      case "ULTIMATE":
        // massive hits
        if (t >= 0.6 && t <= 1.2) {
          isAttackFrame = true;
          reach = 2.0;
          hOffsetY = 1.1;
          hHeight = 1.8;
          damage = 25.0;
          isHeavy = true;
        }
        break;
    }

    if (!isAttackFrame || this.hasHitActive) return null;

    const hitCenterX = this.position.x + (this.width / 2 + reach / 2) * this.facingDir;
    return {
      minX: hitCenterX - hWidth / 2,
      maxX: hitCenterX + hWidth / 2,
      minY: this.position.y + hOffsetY - hHeight / 2,
      maxY: this.position.y + hOffsetY + hHeight / 2,
      damage: damage,
      isHeavy: isHeavy,
      isGrab: this.state === "GRAB",
      type: this.state
    };
  }

  launchProjectile() {
    // Projectile object will be managed by main.js but we emit trigger coordinates
    const spawnX = this.position.x + 1.1 * this.facingDir;
    const spawnY = this.position.y + 1.2;
    if (this.onLaunchProjectile) {
      this.onLaunchProjectile(spawnX, spawnY, this.facingDir, this.colors.primary);
    }
  }

  reset(xPos) {
    this.health = 100;
    this.rage = 0;
    this.position.set(xPos, 0, 0);
    this.velocity.set(0, 0, 0);
    this.state = "IDLE";
    this.stateTime = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.hasHitActive = false;
    this.facingDir = this.isPlayer2 ? -1 : 1;
    this.targetRotationY = this.isPlayer2 ? -Math.PI / 2 : Math.PI / 2;
    this.rotationY = this.targetRotationY;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
    
    // reset bones
    this.animateBones(0);
  }
}

window.GameFighter = Fighter;
