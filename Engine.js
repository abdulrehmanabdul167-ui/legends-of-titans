// Legends of Iron - Three.js Engine & Stage Builder
class GameEngine {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth;
    this.height = canvasContainer.clientHeight;
    
    // Core Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable HDR ACES Filmic Tone Mapping and physically correct PBR lighting
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap; // Ultra-smooth soft shadow maps
    this.container.appendChild(this.renderer.domElement);

    // Particles system connection
    this.particles = new window.VisualParticleSystem(this.scene);

    // Lights
    this.ambientLight = null;
    this.dirLight = null;
    this.spotLight = null;
    this.pointLights = [];
    this.setupLighting();

    // Stage objects
    this.stageFloors = [];
    this.bgObjects = [];
    this.stageRainParticles = null;
    this.activeStageId = "";

    // Camera targets & shake
    this.cameraTargetX = 0;
    this.cameraTargetY = 2;
    this.cameraTargetZ = 8;
    this.cameraShake = 0;
    this.cameraZoomFactor = 1.0;

    // Cinematic camera controls
    this.cinematicCameraMode = false;
    this.cameraLookTarget = new THREE.Vector3(0, 1.5, 0);
    this.customLookTarget = new THREE.Vector3(0, 1.5, 0);
    
    // AAA Enhancements variables
    this.graphicsPreset = "Medium";
    this.propsShakeStrength = 0;
    
    this.reflectionRenderTarget = null;
    this.reflectionCamera = null;
    this.reflectOverlayPlane = null;
    this.reflectionActive = false;
    
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.bloomActive = false;
    
    this.lightningFlashTime = 0;
    this.lightningNextStrike = 8.0;
    
    this.animatedProps = [];
    this.elevatedMonorail = null;

    // Resize listener
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  // Set preset updates dynamically (Low, Medium, High, Ultra)
  updateGraphicsPreset(preset) {
    this.graphicsPreset = preset;
    
    // Pixel ratios
    let pixelRatio = window.devicePixelRatio || 1.0;
    if (preset === "Low") pixelRatio = 0.75;
    else if (preset === "Medium") pixelRatio = 1.0;
    else pixelRatio = Math.min(window.devicePixelRatio, 2.0);
    this.renderer.setPixelRatio(pixelRatio);
    
    // Shadows
    if (preset === "Low") {
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      this.spotLight.castShadow = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.spotLight.castShadow = (preset !== "Medium"); // disable spotlight shadows on Medium
      
      const shadowSize = preset === "Medium" ? 512 : (preset === "High" ? 1024 : 2048);
      this.dirLight.shadow.mapSize.set(shadowSize, shadowSize);
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
      this.spotLight.shadow.mapSize.set(shadowSize / 2, shadowSize / 2);
      if (this.spotLight.shadow.map) {
        this.spotLight.shadow.map.dispose();
        this.spotLight.shadow.map = null;
      }
    }

    // Bloom Postprocessing (High/Ultra)
    if (preset === "High" || preset === "Ultra") {
      if (!this.composer && window.THREE.EffectComposer) {
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        const bloomStrength = preset === "Ultra" ? 0.75 : 0.45;
        this.bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(this.width, this.height),
          bloomStrength, 
          0.4, 
          0.3
        );
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bloomPass);
      }
      if (this.bloomPass) {
        this.bloomPass.strength = preset === "Ultra" ? 0.75 : 0.45;
      }
      this.bloomActive = true;
    } else {
      this.bloomActive = false;
    }

    // Planar Reflections (High/Ultra on Cyber City)
    this.rebuildReflections();
  }

  rebuildReflections() {
    const preset = this.graphicsPreset;
    const stageId = this.activeStageId;

    if (this.reflectOverlayPlane) {
      this.scene.remove(this.reflectOverlayPlane);
      this.reflectOverlayPlane.geometry.dispose();
      this.reflectOverlayPlane.material.dispose();
      this.reflectOverlayPlane = null;
    }
    if (this.reflectionRenderTarget) {
      this.reflectionRenderTarget.dispose();
      this.reflectionRenderTarget = null;
    }

    if ((preset === "High" || preset === "Ultra") && stageId === "cybercity") {
      const refSize = preset === "Ultra" ? 512 : 256;
      this.reflectionRenderTarget = new THREE.WebGLRenderTarget(refSize, refSize, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      });
      this.reflectionCamera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
      
      const refGeo = new THREE.PlaneGeometry(40, 15);
      const refMat = new THREE.MeshBasicMaterial({
        map: this.reflectionRenderTarget.texture,
        transparent: true,
        opacity: preset === "Ultra" ? 0.45 : 0.3,
        blending: THREE.AdditiveBlending
      });
      this.reflectOverlayPlane = new THREE.Mesh(refGeo, refMat);
      this.reflectOverlayPlane.rotation.x = -Math.PI / 2;
      this.reflectOverlayPlane.position.y = 0.02; // prevent z-fighting
      this.scene.add(this.reflectOverlayPlane);
      this.reflectionActive = true;
    } else {
      this.reflectionActive = false;
    }
  }

  // Triggers prop wobbles upon combat impacts
  triggerPropsShake(amount) {
    this.propsShakeStrength = Math.min(this.propsShakeStrength + amount, 0.8);
  }


  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambientLight);

    // Directional sunlight/moonlight with soft shadows
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(0, 15, 6);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048; // High resolution shadow maps
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 28;
    const d = 12;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Dynamic glowing Spotlight with shadow mapping
    this.spotLight = new THREE.SpotLight(0xff00ff, 2.5, 25, Math.PI / 4, 0.6, 1);
    this.spotLight.position.set(0, 10, 4);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.bias = -0.001;
    this.scene.add(this.spotLight);
  }

  setLightingPreset(timeOfDay) {
    if (!this.dirLight) return;
    
    switch (timeOfDay) {
      case "Morning":
        this.dirLight.color.setHex(0xfffaee);
        this.dirLight.intensity = 0.95;
        this.ambientLight.color.setHex(0x90a0c0);
        this.ambientLight.intensity = 0.35;
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0xfffaee);
          this.scene.fog.density = 0.015;
        }
        this.scene.background = new THREE.Color(0xfffaee);
        break;
      case "Sunset":
        this.dirLight.color.setHex(0xff5500);
        this.dirLight.intensity = 0.75;
        this.ambientLight.color.setHex(0x502040);
        this.ambientLight.intensity = 0.25;
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x301020);
          this.scene.fog.density = 0.02;
        }
        this.scene.background = new THREE.Color(0x301020);
        break;
      case "Midnight":
      default:
        this.dirLight.color.setHex(0x7090ff);
        this.dirLight.intensity = 0.45;
        this.ambientLight.color.setHex(0x1a113a);
        this.ambientLight.intensity = 0.15;
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x07050e);
          this.scene.fog.density = 0.025;
        }
        this.scene.background = new THREE.Color(0x07050e);
        break;
    }
  }

  // Setup visual environments based on active arena selection
  buildStage(stageId) {
    this.activeStageId = stageId;
    this.particles.clearAll();
    
    // Clear old stage
    this.stageFloors.forEach(f => this.scene.remove(f));
    this.bgObjects.forEach(b => this.scene.remove(b));
    if (this.stageRainParticles) this.scene.remove(this.stageRainParticles);
    this.stageFloors = [];
    this.bgObjects = [];
    
    this.pointLights.forEach(pl => this.scene.remove(pl));
    this.pointLights = [];

    const dbStages = window.GameDatabase.arenas;
    const stageData = dbStages.find(s => s.id === stageId) || dbStages[0];

    // Background color
    this.scene.background = new THREE.Color(stageData.skyColor);
    this.scene.fog = new THREE.FogExp2(stageData.skyColor, 0.05);

    // Update spot light colors
    this.spotLight.color.set(stageData.glowColor);
    this.ambientLight.color.set(stageData.glowColor);

    if (stageId === "cybercity") {
      this.buildCyberCity(stageData);
    } else if (stageId === "lavadojo") {
      this.buildLavaDojo(stageData);
    } else { // default ancientdojo
      this.buildAncientDojo(stageData);
    }
  }

  buildCyberCity(data) {
    // 1. Grid glowing floor
    const floorGeo = new THREE.PlaneGeometry(40, 15);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080812,
      roughness: 0.12,
      metalness: 0.92
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.stageFloors.push(floor);

    // Add glowing neon lines on floor
    const gridHelper = new THREE.GridHelper(40, 20, 0x00ffcc, 0xff007f);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
    this.stageFloors.push(gridHelper);

    // 2. Neon skyscrapers in background
    for (let i = 0; i < 20; i++) {
      const w = 2 + Math.random() * 4;
      const h = 8 + Math.random() * 15;
      const d = 2 + Math.random() * 4;
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      
      const neonColor = Math.random() > 0.5 ? 0xff00ff : 0x00ffcc;
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x020208,
        emissive: neonColor,
        emissiveIntensity: 0.08,
        roughness: 0.8
      });
      const b = new THREE.Mesh(boxGeo, boxMat);
      
      // Position behind stage (z range from -10 to -25)
      b.position.set(
        (Math.random() - 0.5) * 40,
        h / 2 - 2, // slightly buried
        -10 - Math.random() * 15
      );
      this.scene.add(b);
      this.bgObjects.push(b);
      
      // Add glowing neon bars on structures
      const glowGeo = new THREE.BoxGeometry(0.15, h * 0.8, 0.15);
      const glowMat = new THREE.MeshBasicMaterial({ color: neonColor });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(b.position);
      glow.position.x += w / 2 + 0.05;
      glow.position.z += d / 2 + 0.05;
      this.scene.add(glow);
      this.bgObjects.push(glow);
      
      // Store building glow poles in animated props for slight flickers
      this.animatedProps.push({
        mesh: glow,
        type: "neon_flicker",
        baseIntensity: 1.0,
        flickerDelay: Math.random() * 5.0
      });
    }

    // 3. Volumetric God Rays (Spotlight Cones)
    const coneGeo = new THREE.ConeGeometry(3.5, 12, 16, 1, true);
    coneGeo.translate(0, -6, 0); // anchor at top point
    const coneMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(data.glowColor),
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.set(0, 10, 4);
    lightCone.rotation.x = 0.2; // tilt forward slightly
    this.scene.add(lightCone);
    this.bgObjects.push(lightCone);

    // 4. Elevated Monorail track & train
    const trackGeo = new THREE.BoxGeometry(50, 0.25, 0.5);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x0b0b14, metalness: 0.85, roughness: 0.35 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, 5.2, -9.5);
    this.scene.add(track);
    this.bgObjects.push(track);

    const trainGroup = new THREE.Group();
    trainGroup.position.set(-25, 5.5, -9.5);
    
    const carGeo = new THREE.BoxGeometry(2.4, 0.55, 0.55);
    const carMat = new THREE.MeshStandardMaterial({ color: 0x020206, metalness: 0.9, roughness: 0.15 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

    for (let j = 0; j < 3; j++) {
      const car = new THREE.Mesh(carGeo, carMat);
      car.position.x = -j * 2.6;
      trainGroup.add(car);
      
      const winGeo = new THREE.BoxGeometry(1.6, 0.12, 0.58);
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, 0.04, 0);
      car.add(win);
    }
    
    this.scene.add(trainGroup);
    this.bgObjects.push(trainGroup);
    this.elevatedMonorail = trainGroup;


    // 3. Setup weather: Falling Rain particles
    const rainCount = 1000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = [];

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      velocities.push(10 + Math.random() * 5); // falling speed
    }

    rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x77bbff,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });
    this.stageRainParticles = new THREE.Points(rainGeo, rainMat);
    this.stageRainParticles.userData = { velocities: velocities };
    this.scene.add(this.stageRainParticles);
  }

  buildLavaDojo(data) {
    // 1. Center stone platform where fights occur
    const platformGeo = new THREE.BoxGeometry(22, 1, 6);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1c1a1a,
      roughness: 0.9,
      metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.scene.add(platform);
    this.stageFloors.push(platform);

    // 2. Liquid lava below (y = -1.5)
    const lavaGeo = new THREE.PlaneGeometry(100, 100);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff1100,
      emissiveIntensity: 0.8,
      roughness: 0.9
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = -1.6;
    this.scene.add(lava);
    this.stageFloors.push(lava);

    // 3. Volcanic rocks and torches in background
    for (let i = 0; i < 15; i++) {
      const size = 2 + Math.random() * 4;
      const rockGeo = new THREE.DodecahedronGeometry(size);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x110c0a,
        roughness: 0.95
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        (Math.random() - 0.5) * 35,
        -1 + (Math.random() - 0.5) * 2,
        -8 - Math.random() * 8
      );
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.scene.add(rock);
      this.bgObjects.push(rock);
      
      // If close to center, add a torch
      if (Math.abs(rock.position.x) < 14) {
        const light = new THREE.PointLight(0xff6600, 1.5, 8);
        light.position.copy(rock.position);
        light.position.y += size;
        this.scene.add(light);
        this.pointLights.push(light);
        
        // Torch particle anchor
        const fireGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
        const fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.copy(light.position);
        this.scene.add(fire);
        this.bgObjects.push(fire);
        
        this.animatedProps.push({
          mesh: fire,
          light: light,
          type: "torch",
          baseY: fire.position.y,
          offset: Math.random() * Math.PI
        });
      }
    }

    // Volumetric spotlight shaft
    const coneGeo = new THREE.ConeGeometry(5, 12, 16, 1, true);
    coneGeo.translate(0, -6, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.set(0, 10, 4);
    this.scene.add(lightCone);
    this.bgObjects.push(lightCone);


    // 4. Volcanic embers weather
    const emberCount = 300;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    const velocities = []; // speed upwards

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = -1.5 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      velocities.push(1 + Math.random() * 2);
    }

    emberGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.08,
      transparent: true,
      opacity: 0.8
    });
    this.stageRainParticles = new THREE.Points(emberGeo, emberMat);
    this.stageRainParticles.userData = { velocities: velocities, type: "ember" };
    this.scene.add(this.stageRainParticles);
  }

  buildAncientDojo(data) {
    // 1. Wooden platform
    const woodGeo = new THREE.BoxGeometry(24, 0.8, 8);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6e3d22,
      roughness: 0.5,
      metalness: 0.1
    });
    const platform = new THREE.Mesh(woodGeo, woodMat);
    platform.position.y = -0.4;
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.scene.add(platform);
    this.stageFloors.push(platform);

    // Subdivisions planks look
    const grid = new THREE.GridHelper(24, 12, 0x331a0e, 0x331a0e);
    grid.position.y = 0.01;
    this.scene.add(grid);
    this.stageFloors.push(grid);

    // 2. Pillars and paper lanterns in back
    const pillarPositions = [-10, -5, 0, 5, 10];
    pillarPositions.forEach(x => {
      // Wood pillar
      const pilGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      const pilMat = new THREE.MeshStandardMaterial({ color: 0x472412, roughness: 0.6 });
      const pil = new THREE.Mesh(pilGeo, pilMat);
      pil.position.set(x, 2.6, -3);
      pil.castShadow = true;
      pil.receiveShadow = true;
      this.scene.add(pil);
      this.bgObjects.push(pil);

      // Lantern hanging
      const lanGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 6);
      const lanMat = new THREE.MeshStandardMaterial({
        color: 0xffeedd,
        emissive: 0xffaa44,
        emissiveIntensity: 0.9,
        roughness: 0.9
      });
      const lan = new THREE.Mesh(lanGeo, lanMat);
      lan.position.set(x, 4.0, -2.6);
      this.scene.add(lan);
      this.bgObjects.push(lan);

      // PointLight from lantern
      const light = new THREE.PointLight(0xff7733, 1.2, 7);
      light.position.copy(lan.position);
      this.scene.add(light);
      this.pointLights.push(light);
      
      this.animatedProps.push({
        mesh: lan,
        light: light,
        type: "lantern",
        baseX: lan.position.x,
        baseY: lan.position.y,
        offset: x * 0.4
      });
    });

    // Volumetric Moonlight Shaft in center Torii back
    const moonConeGeo = new THREE.CylinderGeometry(4, 8, 15, 16, 1, true);
    moonConeGeo.translate(0, -7.5, 0);
    const moonConeMat = new THREE.MeshBasicMaterial({
      color: 0x90b0ff,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const moonShaft = new THREE.Mesh(moonConeGeo, moonConeMat);
    moonShaft.position.set(0, 12, -5);
    moonShaft.rotation.x = 0.25;
    this.scene.add(moonShaft);
    this.bgObjects.push(moonShaft);


    // 3. Torii gate center back
    const toriiMat = new THREE.MeshStandardMaterial({ color: 0x8a1811, roughness: 0.6 });
    const postGeo = new THREE.CylinderGeometry(0.3, 0.35, 7, 8);
    
    const postL = new THREE.Mesh(postGeo, toriiMat);
    postL.position.set(-6, 3, -6);
    this.scene.add(postL);
    this.bgObjects.push(postL);

    const postR = new THREE.Mesh(postGeo, toriiMat);
    postR.position.set(6, 3, -6);
    this.scene.add(postR);
    this.bgObjects.push(postR);

    const crossGeo = new THREE.BoxGeometry(15, 0.5, 0.6);
    const cross = new THREE.Mesh(crossGeo, toriiMat);
    cross.position.set(0, 6.6, -6);
    this.scene.add(cross);
    this.bgObjects.push(cross);

    // 4. Cherry Blossom falling petals weather
    const petalCount = 150;
    const petalGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(petalCount * 3);
    const velocities = [];

    for (let i = 0; i < petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      velocities.push({
        y: 1.5 + Math.random() * 1.5,
        x: -0.5 - Math.random() * 0.8,
        sw: Math.random() * Math.PI
      });
    }

    petalGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const petalMat = new THREE.PointsMaterial({
      color: 0xffb7c5,
      size: 0.12,
      transparent: true,
      opacity: 0.8
    });
    this.stageRainParticles = new THREE.Points(petalGeo, petalMat);
    this.stageRainParticles.userData = { velocities: velocities, type: "petal" };
    this.scene.add(this.stageRainParticles);
  }

  // Calculate mid-point and frame distance of the fighters
  trackFighters(f1Pos, f2Pos, isKO) {
    const midX = (f1Pos.x + f2Pos.x) / 2;
    const midY = (f1Pos.y + f2Pos.y) / 2 + 1.2; // center vertically on chests
    const dist = Math.abs(f1Pos.x - f2Pos.x);

    // Dynamic zoom based on fighter distance
    let baseDepth = 4.0;
    let maxDepth = 12.0;
    let targetZ = THREE.MathUtils.clamp(dist * 0.8 + 3.0, baseDepth, maxDepth);
    let targetY = midY + THREE.MathUtils.clamp(dist * 0.15, 0.0, 1.5) - 0.2;

    // Constrain camera stage limits
    const maxBoundX = 11.0;
    let targetX = THREE.MathUtils.clamp(midX, -maxBoundX, maxBoundX);

    // K.O. Cinematic Zoom Override
    if (isKO) {
      this.cameraZoomFactor = THREE.MathUtils.lerp(this.cameraZoomFactor, 0.45, 0.05); // heavy zoom-in
      targetZ = 2.8;
      targetY = midY - 0.2;
    } else {
      this.cameraZoomFactor = THREE.MathUtils.lerp(this.cameraZoomFactor, 1.0, 0.1);
    }

    this.cameraTargetX = targetX;
    this.cameraTargetY = targetY;
    this.cameraTargetZ = targetZ;
  }

  // Add camera vibration
  triggerShake(amount) {
    this.cameraShake = amount;
  }

  onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    if (this.composer) {
      this.composer.setSize(this.width, this.height);
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(this.width, this.height);
    }
  }

  update(dt, isKO) {
    // 1. Decay prop wobble strength
    this.propsShakeStrength = Math.max(0, this.propsShakeStrength - dt * 3.5);

    // 2. Monorail background train movement
    if (this.elevatedMonorail) {
      this.elevatedMonorail.position.x += 12.0 * dt;
      if (this.elevatedMonorail.position.x > 26.0) {
        this.elevatedMonorail.position.x = -26.0;
      }
    }

    // 3. Lightning storms in Shibuya stage
    if (this.activeStageId === "cybercity") {
      this.lightningNextStrike -= dt;
      if (this.lightningNextStrike <= 0) {
        this.lightningFlashTime = 0.15 + Math.random() * 0.15;
        this.lightningNextStrike = 8.0 + Math.random() * 12.0;
        if (window.SoundSynth) {
          window.SoundSynth.synthImpactBoom(38, 1.5);
        }
      }
      
      if (this.lightningFlashTime > 0) {
        this.lightningFlashTime -= dt;
        this.ambientLight.color.setHex(0xb0b5ff);
        this.ambientLight.intensity = 1.6;
        this.dirLight.color.setHex(0xffffff);
        this.dirLight.intensity = 2.0;
        this.scene.background.setHex(0x353545);
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x353545);
        }
      } else {
        this.ambientLight.color.setHex(0xff00ff);
        this.ambientLight.intensity = 0.15;
        this.dirLight.color.setHex(0x7090ff);
        this.dirLight.intensity = 0.45;
        this.scene.background.setHex(0x050014);
        if (this.scene.fog) {
          this.scene.fog.color.setHex(0x050014);
        }
      }
    }

    // 4. Background lights oscillation & animated props (wind sways + flickers + wobbles)
    const time = Date.now() * 0.001;
    if (this.activeStageId === "cybercity") {
      this.spotLight.position.x = Math.sin(time * 1.5) * 8;
    } else if (this.activeStageId === "lavadojo") {
      this.pointLights.forEach((pl, i) => {
        if (!this.animatedProps.find(p => p.light === pl)) {
          pl.intensity = 1.0 + Math.sin(time * 6.0 + i) * 0.4;
        }
      });
    }

    this.animatedProps.forEach(prop => {
      if (prop.type === "lantern") {
        const windSway = Math.sin(time * 1.5 + prop.offset) * 0.06;
        const impactWobble = this.propsShakeStrength * Math.sin(time * 24.0 + prop.offset) * 0.4;
        prop.mesh.rotation.z = windSway + impactWobble;
        prop.mesh.rotation.x = Math.cos(time * 1.1 + prop.offset) * 0.03 + impactWobble * 0.5;
        
        if (prop.light) {
          prop.light.intensity = 1.2 + Math.sin(time * 2.0 + prop.offset) * 0.2 + this.propsShakeStrength * 0.4;
        }
      } else if (prop.type === "torch") {
        const flicker = Math.sin(time * 22.0 + prop.offset) * 0.08;
        const impactWobble = this.propsShakeStrength * Math.cos(time * 26.0 + prop.offset) * 0.12;
        
        prop.mesh.scale.setScalar(1.0 + flicker + impactWobble);
        prop.mesh.position.y = prop.baseY + flicker * 0.1;
        if (prop.light) {
          prop.light.intensity = 1.5 + flicker * 0.35 + this.propsShakeStrength * 0.6;
        }
      } else if (prop.type === "neon_flicker") {
        const flickerTime = time + prop.flickerDelay;
        const flickerPattern = Math.sin(flickerTime * 12.0) * Math.cos(flickerTime * 4.0);
        if (flickerPattern > 0.88) {
          prop.mesh.material.opacity = 0.2;
        } else {
          prop.mesh.material.opacity = 1.0;
        }
      }
    });

    // 5. Smoothly interpolate camera position
    const lerpSpeed = isKO ? 0.05 : 0.1;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.cameraTargetX, lerpSpeed);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.cameraTargetY, lerpSpeed);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.cameraTargetZ * this.cameraZoomFactor, lerpSpeed);

    // Look at center or custom cinematic coordinates
    let lookTarget;
    if (this.cinematicCameraMode && this.customLookTarget) {
      lookTarget = this.customLookTarget;
    } else {
      lookTarget = new THREE.Vector3(this.cameraTargetX, this.cameraTargetY - 0.3, 0);
    }
    this.cameraLookTarget.lerp(lookTarget, lerpSpeed);
    this.camera.lookAt(this.cameraLookTarget);

    // Apply camera shake if active
    if (this.cameraShake > 0.01) {
      const shakeX = (Math.random() - 0.5) * this.cameraShake;
      const shakeY = (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.cameraShake -= dt * 6.0; // Decay rate
    } else {
      this.cameraShake = 0;
    }

    // 6. Weather particles updates
    if (this.stageRainParticles) {
      const posAttr = this.stageRainParticles.geometry.attributes.position;
      const arr = posAttr.array;
      const count = posAttr.count;
      const uData = this.stageRainParticles.userData;

      for (let i = 0; i < count; i++) {
        if (uData.type === "petal") {
          const vel = uData.velocities[i];
          arr[i * 3 + 1] -= vel.y * dt; // fall
          arr[i * 3] += vel.x * dt;     // drift sideways
          
          // Sway wobble
          vel.sw += dt * 3.0;
          arr[i * 3 + 2] += Math.sin(vel.sw) * 0.5 * dt;

          // Recycle
          if (arr[i * 3 + 1] < -0.8) {
            arr[i * 3 + 1] = 12.0;
            arr[i * 3] = (Math.random() - 0.5) * 30;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
          }
        } else if (uData.type === "ember") {
          const vel = uData.velocities[i];
          arr[i * 3 + 1] += vel * dt; // rises up
          arr[i * 3] += Math.sin(arr[i * 3 + 1] * 2) * 0.3 * dt; // wobble

          // Recycle
          if (arr[i * 3 + 1] > 10.0) {
            arr[i * 3 + 1] = -1.5;
            arr[i * 3] = (Math.random() - 0.5) * 30;
          }
        } else { // default rain
          const vel = uData.velocities[i];
          arr[i * 3 + 1] -= vel * dt; // falls down fast
          arr[i * 3] -= 1.5 * dt;     // slant wind

          // Recycle
          if (arr[i * 3 + 1] < 0) {
            arr[i * 3 + 1] = 15.0;
            arr[i * 3] = (Math.random() - 0.5) * 35;
          }
        }
      }
      posAttr.needsUpdate = true;
    }

    // 7. Update planar reflections pass
    if (this.reflectionActive && this.reflectOverlayPlane && this.reflectionRenderTarget) {
      this.reflectOverlayPlane.visible = false; // Hide mirror plane from itself
      
      this.reflectionCamera.copy(this.camera);
      this.reflectionCamera.position.y = -this.camera.position.y;
      this.reflectionCamera.up.set(0, -1, 0); // Invert up vector to flip image
      
      const reflectedLook = new THREE.Vector3(this.cameraLookTarget.x, -this.cameraLookTarget.y, this.cameraLookTarget.z);
      this.reflectionCamera.lookAt(reflectedLook);
      
      this.renderer.setRenderTarget(this.reflectionRenderTarget);
      this.renderer.render(this.scene, this.reflectionCamera);
      this.renderer.setRenderTarget(null);
      
      this.reflectOverlayPlane.visible = true; // Restore mirror plane visibility
    }

    // 8. Update visual particles
    this.particles.update(dt);

    // 9. Draw with bloom/composer if active
    if (this.bloomActive && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.GameEngine = GameEngine;
