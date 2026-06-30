// Legends of Iron - Main Application Coordinator
class App {
  constructor() {
    this.currentScreen = "screen-splash";
    
    // Game Mode: "versus", "practice", "arcade"
    this.gameMode = "versus";
    this.selectedP1Id = "ironfist";
    this.selectedP2Id = "cybersamurai";
    this.selectedStageId = "cybercity";

    // Arcade mode state
    this.arcadeStageIndex = 0;
    this.arcadeLadder = [
      { opponentId: "nebula", stageId: "cybercity" },
      { opponentId: "jadesentinel", stageId: "ancientdojo" },
      { opponentId: "vulcan", stageId: "lavadojo" }
    ];
    this.continueTimer = 10;
    this.continueInterval = null;

    // Customizable Settings
    this.isPaused = false;
    this.roundTimerMax = 99; // 30, 45, 60, 90, 99, or Unlimited
    this.controlSize = 1.0;
    this.controlOpacity = 0.75;
    this.controlSpacing = 12;
    this.controlDeadZone = 0.15;
    this.controlHandedness = "right";
    this.controlPreset = "Classic";
    this.trainingHP = false;
    this.trainingRage = false;
    this.trainingAI = "Idle";
    this.trainingShowInputs = true;
    this.trainingShowFrameData = true;
    this.volumeMaster = 1.0;
    this.cameraShakeMultiplier = 1.0;
    this.cameraSensitivity = 1.0;
    this.inputHistoryList = [];
    
    this.aiDifficulty = "Normal";
    this.graphicsPreset = "Medium";
    this.soundOn = true;


    // Rounds management
    this.roundsToWin = 2; // Default best of 3 (requires 2 wins)
    this.roundsWon = { p1: 0, p2: 0 };
    this.roundNum = 1;
    this.roundHistory = [];

    // Costume selections
    this.selectedP1Costume = "A";
    this.selectedP1Color = 1;
    this.selectedP2Costume = "A";
    this.selectedP2Color = 1;

    // Previews
    this.p1Preview = null;
    this.p2Preview = null;

    // Carousel index
    this.stageCarouselIndex = 0;

    // 3D Loop & Entities
    this.engine = null;
    this.p1 = null;
    this.p2 = null;
    this.aiBrain = null;
    this.clock = new THREE.Clock();
    this.projectiles = [];
    
    // Match state
    this.matchActive = false;
    this.matchTimer = 99;
    this.timerInterval = null;
    this.isKOState = false;
    this.koTimer = 0;
    this.koStartTime = 0;
    this.maxCombos = { p1: 0, p2: 0 };
    
    // Initialize UI
    this.initUI();
  }

  // Handle Screen transitions
  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
      this.currentScreen = screenId;
    }
  }

  initUI() {
    // 1. SPLASH SCREEN Click
    document.getElementById("screen-splash").addEventListener("click", () => {
      window.SoundSynth.startBGM();
      window.SoundSynth.playSFX("ui_select");
      this.showScreen("screen-menu");
    });

    // 2. MAIN MENU BUTTONS
    document.querySelectorAll(".menu-btn").forEach(btn => {
      // Hover desc updating
      btn.addEventListener("mouseenter", () => {
        const action = btn.getAttribute("data-action");
        const titleNode = document.getElementById("menu-desc-title");
        const descNode = document.getElementById("menu-desc-text");
        
        document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        if (action === "arcade") {
          titleNode.textContent = "ARCADE MODE";
          descNode.textContent = "Fight your way through a series of challenging combatants to claim the title of Legend of Iron.";
        } else if (action === "versus") {
          titleNode.textContent = "VERSUS MODE";
          descNode.textContent = "Test your skills against an adaptive, intelligent AI opponent. Choose your fighters, arena, and difficulty.";
        } else if (action === "practice") {
          titleNode.textContent = "PRACTICE DOJO";
          descNode.textContent = "Train your combos, examine move hitboxes, and customize AI behaviors in a risk-free environment.";
        } else if (action === "settings") {
          titleNode.textContent = "SETTINGS";
          descNode.textContent = "Adjust game audio, configure screen resolutions, change control mappings, and select graphics options.";
        }
        window.SoundSynth.playSFX("ui_click");
      });

      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        window.SoundSynth.playSFX("ui_select");
        
        if (action === "settings") {
          this.showScreen("screen-settings");
        } else {
          this.gameMode = action; // versus or practice
          this.setupCharGrid();
          this.showScreen("screen-char-select");
        }
      });
    });

    // 3. CHARACTER SELECT SCREEN
    document.getElementById("btn-char-back").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_click");
      this.cleanupPreviews();
      this.showScreen("screen-menu");
    });

    document.getElementById("btn-char-confirm").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_select");
      this.cleanupPreviews();
      if (this.gameMode === "arcade") {
        this.arcadeStageIndex = 0;
        this.setupArcadeMatch();
        this.startFight();
      } else {
        this.setupStageSelect();
        this.showScreen("screen-stage-select");
      }
    });


    // 4. STAGE SELECT SCREEN
    document.getElementById("btn-stage-back").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_click");
      this.setupCharGrid();
      this.showScreen("screen-char-select");
    });

    document.getElementById("btn-stage-prev").addEventListener("click", () => {
      this.scrollStage(-1);
    });

    document.getElementById("btn-stage-next").addEventListener("click", () => {
      this.scrollStage(1);
    });

    document.getElementById("btn-stage-confirm").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_select");
      this.startFight();
    });

    // 5. SETTINGS SCREEN
    document.querySelectorAll(".diff-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.aiDifficulty = btn.getAttribute("data-diff");
        window.SoundSynth.playSFX("ui_click");
      });
    });

    document.querySelectorAll(".graphics-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".graphics-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.graphicsPreset = btn.getAttribute("data-preset");
        if (this.engine) {
          this.engine.updateGraphicsPreset(this.graphicsPreset);
        }
        window.SoundSynth.playSFX("ui_click");
      });
    });


    const soundBtn = document.getElementById("btn-sound-toggle");
    soundBtn.addEventListener("click", () => {
      this.soundOn = !this.soundOn;
      soundBtn.textContent = this.soundOn ? "ON" : "OFF";
      soundBtn.classList.toggle("active", this.soundOn);
      window.SoundSynth.masterVolume = this.soundOn ? 0.5 : 0;
      window.SoundSynth.playSFX("ui_click");
    });

    // Match Length Settings (Best of 3 vs 5)
    document.querySelectorAll(".match-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".match-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.roundsToWin = parseInt(btn.getAttribute("data-rounds"));
        window.SoundSynth.playSFX("ui_click");
      });
    });

    // P1 Customization click events
    document.getElementById("btn-p1-costume-a").addEventListener("click", () => {
      document.getElementById("btn-p1-costume-a").classList.add("active");
      document.getElementById("btn-p1-costume-b").classList.remove("active");
      this.selectedP1Costume = "A";
      this.updateCharSelectPreview();
      window.SoundSynth.playSFX("ui_click");
    });
    document.getElementById("btn-p1-costume-b").addEventListener("click", () => {
      document.getElementById("btn-p1-costume-b").classList.add("active");
      document.getElementById("btn-p1-costume-a").classList.remove("active");
      this.selectedP1Costume = "B";
      this.updateCharSelectPreview();
      window.SoundSynth.playSFX("ui_click");
    });
    document.querySelectorAll(".p1-profile .color-dot").forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        document.querySelectorAll(".p1-profile .color-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        this.selectedP1Color = idx + 1;
        this.updateCharSelectPreview();
        window.SoundSynth.playSFX("ui_click");
      });
    });

    // P2 Customization click events
    document.getElementById("btn-p2-costume-a").addEventListener("click", () => {
      document.getElementById("btn-p2-costume-a").classList.add("active");
      document.getElementById("btn-p2-costume-b").classList.remove("active");
      this.selectedP2Costume = "A";
      this.updateCharSelectPreview();
      window.SoundSynth.playSFX("ui_click");
    });
    document.getElementById("btn-p2-costume-b").addEventListener("click", () => {
      document.getElementById("btn-p2-costume-b").classList.add("active");
      document.getElementById("btn-p2-costume-a").classList.remove("active");
      this.selectedP2Costume = "B";
      this.updateCharSelectPreview();
      window.SoundSynth.playSFX("ui_click");
    });
    document.querySelectorAll(".p2-profile .color-dot").forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        document.querySelectorAll(".p2-profile .color-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        this.selectedP2Color = idx + 1;
        this.updateCharSelectPreview();
        window.SoundSynth.playSFX("ui_click");
      });
    });

    document.getElementById("btn-settings-back").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_click");
      this.showScreen("screen-menu");
    });

    // 6. MOBILE TOUCH BUTTONS CONTROLLER LISTENERS
    const bindTouchBtn = (btnId, keyName) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        window.GameInput.setVirtualButton(keyName, true);
      });
      el.addEventListener("mouseup", (e) => {
        window.GameInput.setVirtualButton(keyName, false);
      });
      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        window.GameInput.setVirtualButton(keyName, true);
      });
      el.addEventListener("touchend", (e) => {
        window.GameInput.setVirtualButton(keyName, false);
      });
    };

    bindTouchBtn("btn-ctrl-punch", "punch");
    bindTouchBtn("btn-ctrl-kick", "kick");
    bindTouchBtn("btn-ctrl-block", "block");
    bindTouchBtn("btn-ctrl-grab", "grab");
    bindTouchBtn("btn-ctrl-special", "special");
    bindTouchBtn("btn-ctrl-ultimate", "ultimate");
    bindTouchBtn("btn-ctrl-dash", "dash");
    bindTouchBtn("btn-ctrl-jump", "jump");
    bindTouchBtn("btn-ctrl-dodge", "dodge");

    // Virtual Joystick Touch events
    const joyRing = document.getElementById("joystick-ring");
    if (joyRing) {
      const joyHandle = document.getElementById("joystick-handle");
      
      const processTouch = (x, y) => {
        const bounds = joyRing.getBoundingClientRect();
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        window.GameInput.handleJoystickMove(x, y);

        // Update handle visual coordinates
        const dx = window.GameInput.virtualJoystick.dirX * 35;
        const dy = window.GameInput.virtualJoystick.dirY * 35;
        joyHandle.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      joyRing.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const bounds = joyRing.getBoundingClientRect();
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        window.GameInput.handleJoystickStart(cx, cy);
        processTouch(t.clientX, t.clientY);
      });

      window.addEventListener("touchmove", (e) => {
        if (!window.GameInput.virtualJoystick.active) return;
        const t = e.touches[0];
        processTouch(t.clientX, t.clientY);
      }, { passive: false });

      window.addEventListener("touchend", () => {
        window.GameInput.handleJoystickEnd();
        joyHandle.style.transform = "translate(0px, 0px)";
      });

      // Mouse drag emulation for PC testing
      joyRing.addEventListener("mousedown", (e) => {
        const bounds = joyRing.getBoundingClientRect();
        const cx = bounds.left + bounds.width / 2;
        const cy = bounds.top + bounds.height / 2;
        window.GameInput.handleJoystickStart(cx, cy);
        
        const onMouseMove = (ev) => {
          processTouch(ev.clientX, ev.clientY);
        };
        const onMouseUp = () => {
          window.GameInput.handleJoystickEnd();
          joyHandle.style.transform = "translate(0px, 0px)";
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    }

    // 7. GAME OVER ACTIONS
    document.getElementById("btn-gameover-menu").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_click");
      this.cleanupFight();
      this.showScreen("screen-menu");
    });

    document.getElementById("btn-gameover-rematch").addEventListener("click", () => {
      window.SoundSynth.playSFX("ui_select");
      this.cleanupFight();
      this.startFight();
    });

    // 8. CONTINUE ACTIONS
    document.getElementById("btn-continue-yes").addEventListener("click", () => {
      this.selectContinue(true);
    });

    document.getElementById("btn-continue-no").addEventListener("click", () => {
      this.selectContinue(false);
    });


    // Move List Panel Toggling
    const moveBtn = document.getElementById("btn-movelist-toggle");
    const movePanel = document.getElementById("movelist-panel");
    if (moveBtn && movePanel) {
      moveBtn.addEventListener("click", () => {
        window.SoundSynth.playSFX("ui_click");
        movePanel.classList.toggle("open");
        moveBtn.classList.toggle("active");
      });
    }
  }

  // Generate character grid selections
  setupCharGrid() {
    const gridNode = document.getElementById("char-grid-node");
    gridNode.innerHTML = ""; // clean

    window.GameDatabase.characters.forEach(char => {
      const cell = document.createElement("div");
      cell.className = `grid-cell ${char.playable ? "playable" : "locked"}`;
      
      if (char.playable) {
        cell.innerHTML = `
          <span class="cell-glow"></span>
          <div class="grid-cell-label">${char.name}</div>
        `;
        cell.style.borderColor = char.colors.primary;
        cell.style.boxShadow = `inset 0 0 10px ${char.colors.primary}33`;

        // Selection triggers
        cell.addEventListener("click", () => {
          window.SoundSynth.playSFX("ui_click");
          this.selectedP1Id = char.id;
          
          // AI picks a random opponent playable character that is NOT the same (to make it interesting!)
          const playables = window.GameDatabase.characters.filter(c => c.playable);
          const others = playables.filter(c => c.id !== char.id);
          const p2Pick = others[Math.floor(Math.random() * others.length)] || playables[0];
          this.selectedP2Id = p2Pick.id;

          this.updateCharSelectUI();
        });
      } else {
        cell.innerHTML = `
          <div class="lock-icon">🔒</div>
          <div class="grid-cell-label">${char.name}</div>
        `;
      }
      gridNode.appendChild(cell);
    });

    // Default select
    this.updateCharSelectUI();
  }

  updateCharSelectUI() {
    const chars = window.GameDatabase.characters;
    const p1 = chars.find(c => c.id === this.selectedP1Id);
    const p2 = chars.find(c => c.id === this.selectedP2Id);

    // Set grid visual selections
    document.querySelectorAll(".grid-cell").forEach(cell => {
      cell.classList.remove("selected-p1", "selected-p2");
      const name = cell.querySelector(".grid-cell-label").textContent;
      if (name === p1.name) cell.classList.add("selected-p1");
      if (name === p2.name) cell.classList.add("selected-p2");
    });

    // Update P1 panel
    document.getElementById("p1-name").textContent = p1.name;
    document.getElementById("p1-title").textContent = p1.title;
    document.getElementById("p1-bio").textContent = p1.bio;
    document.getElementById("p1-stat-power").style.width = `${p1.stats.power * 10}%`;
    document.getElementById("p1-stat-speed").style.width = `${p1.stats.speed * 10}%`;
    document.getElementById("p1-stat-defense").style.width = `${p1.stats.defense * 10}%`;
    document.getElementById("p1-card-glow").style.backgroundColor = p1.colors.primary;

    // Update P2/AI panel
    document.getElementById("p2-name").textContent = p2.name;
    document.getElementById("p2-title").textContent = p2.title;
    document.getElementById("p2-bio").textContent = p2.bio;
    document.getElementById("p2-stat-power").style.width = `${p2.stats.power * 10}%`;
    document.getElementById("p2-stat-speed").style.width = `${p2.stats.speed * 10}%`;
    document.getElementById("p2-stat-defense").style.width = `${p2.stats.defense * 10}%`;
    document.getElementById("p2-card-glow").style.backgroundColor = p2.colors.primary;

    this.updateCharSelectPreview();
  }

  initPreviewRenderer(containerId, isPlayer2 = false) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = "";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 10);
    camera.position.set(0, 0.9, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    
    const dir = new THREE.DirectionalLight(0xffffff, 1.25);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const previewState = {
      scene,
      camera,
      renderer,
      fighterMesh: null,
      fighterObj: null,
      rotationY: isPlayer2 ? -Math.PI / 6 : Math.PI / 6,
      targetRotationY: isPlayer2 ? -Math.PI / 6 : Math.PI / 6,
      active: true,
      clock: new THREE.Clock()
    };

    let isDragging = false;
    let prevMouseX = 0;
    
    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
    });
    container.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      previewState.targetRotationY += deltaX * 0.015;
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    container.addEventListener("touchstart", (e) => {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
    });
    container.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      previewState.targetRotationY += deltaX * 0.015;
    });
    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    const tick = () => {
      if (!previewState.active) return;
      
      const dt = previewState.clock.getDelta();
      
      if (previewState.fighterObj) {
        previewState.fighterObj.animateBones(dt);
        previewState.fighterObj.updateBlinking(dt);
        previewState.fighterObj.updateFaceExpressions();
        previewState.fighterObj.updateChains(dt);
        
        previewState.rotationY += (previewState.targetRotationY - previewState.rotationY) * 0.15;
        previewState.fighterMesh.rotation.y = previewState.rotationY;
      }
      
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    
    previewState.tick = tick;
    return previewState;
  }

  loadPreviewFighter(previewState, charId, costume, colorIdx) {
    if (!previewState) return;

    if (previewState.fighterMesh) {
      previewState.scene.remove(previewState.fighterMesh);
      previewState.fighterMesh = null;
    }
    
    const dbChars = window.GameDatabase.characters;
    const charData = dbChars.find(f => f.id === charId) || dbChars[0];

    const mockChar = JSON.parse(JSON.stringify(charData));
    mockChar.costume = costume;
    mockChar.colorOption = colorIdx;

    const fighterObj = new Fighter(previewState.scene, mockChar, false);
    fighterObj.position.set(0, 0, 0);
    fighterObj.mesh.position.set(0, 0, 0);
    fighterObj.state = "IDLE";
    fighterObj.stateTime = 0;
    
    previewState.fighterMesh = fighterObj.mesh;
    previewState.fighterObj = fighterObj;
    
    fighterObj.mesh.scale.set(0.68, 0.68, 0.68);
    fighterObj.mesh.position.y = -0.55;
    
    previewState.tick();
  }

  updateCharSelectPreview() {
    if (!this.p1Preview) {
      this.p1Preview = this.initPreviewRenderer("p1-3d-preview", false);
    }
    if (!this.p2Preview) {
      this.p2Preview = this.initPreviewRenderer("p2-3d-preview", true);
    }
    
    this.loadPreviewFighter(this.p1Preview, this.selectedP1Id, this.selectedP1Costume, this.selectedP1Color);
    this.loadPreviewFighter(this.p2Preview, this.selectedP2Id, this.selectedP2Costume, this.selectedP2Color);
  }

  cleanupPreviews() {
    if (this.p1Preview) {
      this.p1Preview.active = false;
      this.p1Preview.renderer.dispose();
      this.p1Preview = null;
    }
    if (this.p2Preview) {
      this.p2Preview.active = false;
      this.p2Preview.renderer.dispose();
      this.p2Preview = null;
    }
  }

  setupArcadeMatch() {
    const match = this.arcadeLadder[this.arcadeStageIndex];
    let oppId = match.opponentId;
    if (oppId === this.selectedP1Id) {
      oppId = this.selectedP1Id === "nebula" ? "ironfist" : "nebula";
    }
    this.selectedP2Id = oppId;
    this.selectedStageId = match.stageId;
  }

  // Stage Select builder
  setupStageSelect() {
    this.selectedStageId = window.GameDatabase.arenas.filter(a => a.playable)[0].id;
    this.stageCarouselIndex = 0;
    this.updateStageSelectUI();
  }

  scrollStage(dir) {
    const playables = window.GameDatabase.arenas.filter(a => a.playable);
    this.stageCarouselIndex = (this.stageCarouselIndex + dir + playables.length) % playables.length;
    this.selectedStageId = playables[this.stageCarouselIndex].id;
    window.SoundSynth.playSFX("ui_click");
    this.updateStageSelectUI();
  }

  updateStageSelectUI() {
    const stage = window.GameDatabase.arenas.find(s => s.id === this.selectedStageId);
    document.getElementById("stage-name").textContent = stage.name;
    document.getElementById("stage-weather").textContent = `WEATHER: ${stage.weather.toUpperCase()}`;
    document.getElementById("stage-desc").textContent = stage.desc;
    document.getElementById("stage-glow").style.boxShadow = `inset 0 0 50px ${stage.glowColor}aa`;
    document.getElementById("stage-glow").style.borderColor = stage.glowColor;
  }

  // 6. INITIATE FIGHT SIMULATION
  startFight() {
    this.showScreen("screen-fight");

    // Init Three.js context if not built yet
    const container = document.getElementById("three-container");
    if (!this.engine) {
      this.engine = new window.GameEngine(container);
    }
    this.engine.updateGraphicsPreset(this.graphicsPreset);
    
    // Clear projectiles
    this.projectiles.forEach(p => {
      this.engine.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.projectiles = [];

    // Construct stage
    this.engine.buildStage(this.selectedStageId);

    // Setup customized characters
    const chars = window.GameDatabase.characters;
    const p1Data = chars.find(c => c.id === this.selectedP1Id);
    const p2Data = chars.find(c => c.id === this.selectedP2Id);

    if (this.p1) {
      this.engine.scene.remove(this.p1.mesh);
    }
    if (this.p2) {
      this.engine.scene.remove(this.p2.mesh);
    }

    const p1Mock = Object.assign({}, p1Data, { costume: this.selectedP1Costume, colorOption: this.selectedP1Color });
    const p2Mock = Object.assign({}, p2Data, { costume: this.selectedP2Costume, colorOption: this.selectedP2Color });

    this.p1 = new window.GameFighter(this.engine.scene, p1Mock, false);
    this.p2 = new window.GameFighter(this.engine.scene, p2Mock, true);

    // Set stage lighting preset
    const activeStage = window.GameDatabase.arenas.find(s => s.id === this.selectedStageId);
    this.engine.setLightingPreset(activeStage.timeOfDay || "Midnight");

    // Connect callbacks
    this.p1.onLaunchProjectile = this.spawnProjectile.bind(this);
    this.p2.onLaunchProjectile = this.spawnProjectile.bind(this);

    // Connect dust landing callback
    this.p1.onLand = (pos) => { this.engine.particles.spawnDustParticles(pos, 8); };
    this.p2.onLand = (pos) => { this.engine.particles.spawnDustParticles(pos, 8); };

    // Connect perfect parry callback
    this.p1.onParry = () => {
      const parryPos = new THREE.Vector3((this.p1.position.x + this.p2.position.x) / 2, 1.2, 0);
      this.engine.particles.spawnHitParticles(parryPos, 15, "#ffffff");
      this.engine.particles.spawnBlockParryShield(parryPos, "#ffffff");
      this.engine.triggerShake(0.45);
      this.engine.triggerPropsShake(0.3);
      
      this.p2.state = "HIT";
      this.p2.stateTime = 0;
      this.p2.stateDuration = 0.5;
      this.p2.velocity.x = -3.0 * this.p2.facingDir;
    };
    this.p2.onParry = () => {
      const parryPos = new THREE.Vector3((this.p1.position.x + this.p2.position.x) / 2, 1.2, 0);
      this.engine.particles.spawnHitParticles(parryPos, 15, "#ffffff");
      this.engine.particles.spawnBlockParryShield(parryPos, "#ffffff");
      this.engine.triggerShake(0.45);
      this.engine.triggerPropsShake(0.3);
      
      this.p1.state = "HIT";
      this.p1.stateTime = 0;
      this.p1.stateDuration = 0.5;
      this.p1.velocity.x = -3.0 * this.p1.facingDir;
    };

    // Connect ground impact callbacks
    const handleGroundImpact = (pos, isHeavy) => {
      this.engine.particles.spawnDustParticles(pos, isHeavy ? 14 : 6);
      if (isHeavy && this.graphicsPreset !== "Low" && this.graphicsPreset !== "Medium") {
        this.engine.particles.spawnGroundCrack(pos);
      }
      this.engine.triggerShake(isHeavy ? 0.75 : 0.25);
      this.engine.triggerPropsShake(isHeavy ? 0.45 : 0.15);
    };
    this.p1.onGroundImpact = (pos, isHeavy) => handleGroundImpact(pos, isHeavy);
    this.p2.onGroundImpact = (pos, isHeavy) => handleGroundImpact(pos, isHeavy);

    // Render Move List
    this.renderMoveList(p1Data);

    // Hook AI brain
    this.aiBrain = new window.GameAI(this.p2, this.p1, this.aiDifficulty);

    // Reset HUD details
    document.getElementById("hud-p1-name").textContent = p1Data.name;
    document.getElementById("hud-p2-name").textContent = p2Data.name;
    
    document.getElementById("hud-p1-health").style.width = "100%";
    document.getElementById("hud-p1-health-catch").style.width = "100%";
    document.getElementById("hud-hud-p2-health").style.width = "100%";
    document.getElementById("hud-hud-p2-health-catch").style.width = "100%";

    document.getElementById("hud-p1-rage").style.width = "0%";
    document.getElementById("hud-hud-p2-rage").style.width = "0%";
    
    this.maxCombos = { p1: 0, p2: 0 };
    this.roundNum = 1;
    this.roundsWon = { p1: 0, p2: 0 };
    this.updateRoundMarkers();
    
    this.isKOState = false;
    this.koTimer = 0;
    this.matchTimer = 99;
    document.getElementById("hud-timer").textContent = this.matchTimer;

    // Reset controls input helper times
    if (window.GameInput) {
      window.GameInput.lastInputTime = Date.now();
    }

    // Trigger banner entrance sequence
    this.triggerRoundEntrance();
  }

  updateRoundMarkers() {
    const p1Markers = document.querySelectorAll("#hud-p1-rounds .marker");
    const p2Markers = document.querySelectorAll("#hud-p2-rounds .marker");
    
    p1Markers.forEach((m, idx) => {
      m.classList.toggle("active", idx < this.roundsWon.p1);
    });
    p2Markers.forEach((m, idx) => {
      m.classList.toggle("active", idx < this.roundsWon.p2);
    });
  }

  triggerRoundEntrance() {
    this.matchActive = false;
    this.isKOState = false;
    this.koTimer = 0;
    this.koStartTime = 0;
    this.matchTimer = 99;
    document.getElementById("hud-timer").textContent = this.matchTimer;

    // Reset health and positions
    this.p1.health = 100;
    this.p1.rage = 0;
    this.p1.state = "INTRO";
    this.p1.stateTime = 0;
    this.p1.stateDuration = 3.5;
    this.p1.position.set(-6.0, 0, 0); // start further back to walk in
    this.p1.velocity.set(0, 0, 0);
    this.p1.isGrounded = true;

    this.p2.health = 100;
    this.p2.rage = 0;
    this.p2.state = "INTRO";
    this.p2.stateTime = 0;
    this.p2.stateDuration = 3.5;
    this.p2.position.set(6.0, 0, 0);
    this.p2.velocity.set(0, 0, 0);
    this.p2.isGrounded = true;

    // Clear projectiles
    this.projectiles.forEach(p => {
      this.engine.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.projectiles = [];

    // Trigger walk in velocities
    this.p1.velocity.x = 1.0;
    this.p2.velocity.x = -1.0;

    const banner = document.getElementById("hud-center-banner");
    banner.classList.remove("knockout");
    const bannerText = document.getElementById("banner-text");
    
    // Set Round Label (ROUND 1, ROUND 2, or FINAL ROUND)
    const isFinalRound = (this.roundsWon.p1 === this.roundsToWin - 1) && (this.roundsWon.p2 === this.roundsToWin - 1);
    const roundLabel = isFinalRound ? "FINAL ROUND" : `ROUND ${this.roundNum}`;
    
    bannerText.textContent = roundLabel;
    banner.classList.add("show");

    // Synthesize announcer phrase voice
    const announceSFX = isFinalRound ? "announce_final" : `announce_round${Math.min(this.roundNum, 2)}`;
    window.SoundSynth.playSFX(announceSFX);

    // Cinematic Intro Camera Sweep
    this.engine.cinematicCameraMode = true;
    this.engine.cameraTargetX = -3.5;
    this.engine.cameraTargetY = 1.4;
    this.engine.cameraTargetZ = 3.5;
    this.engine.customLookTarget.copy(this.p1.position);

    // After 1.0s, camera sweeps to P2
    setTimeout(() => {
      if (this.currentScreen !== "screen-fight") return;
      this.engine.cameraTargetX = 3.5;
      this.engine.customLookTarget.copy(this.p2.position);
    }, 1000);

    // After 1.8s, camera returns to wide combat angle
    setTimeout(() => {
      if (this.currentScreen !== "screen-fight") return;
      this.engine.cinematicCameraMode = false;
      this.engine.cameraTargetX = 0;
      this.engine.cameraTargetY = 2.0;
      this.engine.cameraTargetZ = 8.0;
      this.engine.cameraZoomFactor = 1.0;
    }, 1800);

    // Banner transition into fight
    setTimeout(() => {
      banner.classList.remove("show");
      
      // Beeps countdown sequence
      let countdown = 3;
      const doCountdown = () => {
        if (countdown > 0) {
          bannerText.textContent = countdown;
          banner.classList.add("show");
          window.SoundSynth.playSFX("beep_tick");
          
          setTimeout(() => {
            banner.classList.remove("show");
            countdown--;
            setTimeout(doCountdown, 300);
          }, 500);
        } else {
          // "FIGHT!"
          bannerText.textContent = "FIGHT!";
          banner.classList.add("show");
          window.SoundSynth.playSFX("announce_fight");
          window.SoundSynth.playSFX("beep_start");
          this.engine.triggerShake(1.0);

          setTimeout(() => {
            banner.classList.remove("show");
            
            // Enable controls
            this.matchActive = true;
            this.p1.state = "IDLE";
            this.p1.velocity.x = 0;
            this.p2.state = "IDLE";
            this.p2.velocity.x = 0;
            this.clock.getDelta(); // reset clock delta
            this.startTimer();
            
            if (!this.frameId) {
              this.frameId = requestAnimationFrame(this.gameTick.bind(this));
            }
          }, 900);
        }
      };
      
      setTimeout(doCountdown, 200);
    }, 2000);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.gameMode === "practice") {
      document.getElementById("hud-timer").textContent = "∞";
      return;
    }

    this.timerInterval = setInterval(() => {
      if (!this.matchActive || this.isKOState) return;
      this.matchTimer--;
      document.getElementById("hud-timer").textContent = this.matchTimer;

      if (this.matchTimer <= 0) {
        clearInterval(this.timerInterval);
        this.resolveTimeout();
      }
    }, 1000);
  }

  // Create physical flying energy sphere projectile
  spawnProjectile(x, y, dir, colorCode) {
    let mesh;
    const owner = dir > 0 ? this.p1 : this.p2;
    
    if (owner.id === "vulcan") {
      // Vulcan volcanic fireball: magma stone core with fire aura
      const size = 0.42;
      const geometry = new THREE.DodecahedronGeometry(size); // boxy stone look
      const material = new THREE.MeshStandardMaterial({
        color: 0x1d1110,
        emissive: 0xff3300,
        emissiveIntensity: 1.5,
        roughness: 0.9
      });
      mesh = new THREE.Mesh(geometry, material);
      
      // Add mini fiery light inside
      const fireLight = new THREE.PointLight(0xff5500, 1.8, 4);
      mesh.add(fireLight);
    } else if (owner.id === "tigris") {
      // Tigris plasma razor claw: crescent orange plasma ring segment
      const size = 0.55;
      const geometry = new THREE.RingGeometry(0.08, size, 12, 1, 0, Math.PI); // semi-circle arc
      geometry.rotateY(Math.PI / 2); // face flight direction
      if (dir < 0) geometry.rotateY(Math.PI);
      
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff5500"),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      mesh = new THREE.Mesh(geometry, material);
    } else {
      // Standard physical flying energy sphere
      const size = 0.35;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorCode),
        transparent: true,
        opacity: 0.9
      });
      mesh = new THREE.Mesh(geometry, material);
      
      // Glowing core
      const coreGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      mesh.add(coreMesh);
    }
    
    mesh.position.set(x, y, 0);
    this.engine.scene.add(mesh);

    this.projectiles.push({
      mesh: mesh,
      velocity: new THREE.Vector2(12.0 * dir, 0),
      dir: dir,
      damage: owner.id === "vulcan" ? 14 : 10,
      colorCode: colorCode,
      owner: owner,
      target: dir > 0 ? this.p2 : this.p1
    });
  }


  gameTick() {
    if (this.currentScreen !== "screen-fight") {
      this.frameId = null;
      return;
    }

    let dt = this.clock.getDelta();
    // Cap dt to prevent massive jumps when screen lag occurs
    dt = Math.min(dt, 0.05);

    // K.O. Cinematic Hitstop & Slow motion speed scale
    if (this.isKOState) {
      if (!this.koStartTime) this.koStartTime = Date.now();
      const realElapsed = (Date.now() - this.koStartTime) / 1000;
      
      if (realElapsed < 0.5) {
        // Phase 1: Action freeze (hitstop)
        dt = 0.0;
      } else if (realElapsed < 3.5) {
        // Phase 2: Slow motion knockdown fall
        dt *= 0.08;
      } else {
        // Phase 3: Transition to victory pose / round end
        this.resolveRoundEnd();
      }
    }

    // 1. Inputs update (Player 1)
    const p1In = window.GameInput ? window.GameInput.getP1Inputs() : {
      left: false, right: false, up: false, down: false,
      punch: false, kick: false, block: false, grab: false,
      special: false, ultimate: false, dashLeft: false, dashRight: false,
      sidestepLeft: false, sidestepRight: false
    };
    this.handleFighterInputs(this.p1, p1In, dt);

    // 2. AI Brain tick
    if (this.gameMode !== "practice" && !this.isKOState && this.matchActive) {
      this.aiBrain.update(dt);
    } else if (this.gameMode === "practice" && !this.isKOState && this.matchActive) {
      // Practice AI blocks standard moves or stands still
      this.aiBrain.update(dt);
    }

    // 3. Update Fighter positions and animations
    this.p1.update(dt, this.p2);
    this.p2.update(dt, this.p1);

    // Prevent players from walking past edges or through each other
    this.resolveFightersOverlap();

    // 4. Update projectles physics & impacts
    this.updateProjectiles(dt);

    // 5. Check physical hitbox collisions
    if (this.matchActive && !this.isKOState) {
      this.checkCombatCollisions();
    }

    // 6. Camera tracking
    this.engine.trackFighters(this.p1.position, this.p2.position, this.isKOState);
    this.engine.update(dt, this.isKOState);

    // 7. Update HUD UI widths and combos
    this.updateHUD(dt);

    // Loop
    this.frameId = requestAnimationFrame(this.gameTick.bind(this));
  }

  handleFighterInputs(fighter, inputs, dt) {
    if (!this.matchActive || this.isKOState || ["HIT", "FALLEN", "KO", "BLOCK"].includes(fighter.state)) return;

    // Movement
    if (fighter.isGrounded) {
      const walkSpeed = 3.5;
      
      if (inputs.sidestepLeft) {
        fighter.performMove("SIDESTEP_L");
        return;
      }
      if (inputs.sidestepRight) {
        fighter.performMove("SIDESTEP_R");
        return;
      }

      if (inputs.left) {
        fighter.velocity.x = -walkSpeed;
        fighter.state = fighter.facingDir > 0 ? "WALK_BWD" : "WALK_FWD";
      } else if (inputs.right) {
        fighter.velocity.x = walkSpeed;
        fighter.state = fighter.facingDir > 0 ? "WALK_FWD" : "WALK_BWD";
      } else {
        if (fighter.state === "WALK_FWD" || fighter.state === "WALK_BWD") {
          fighter.state = "IDLE";
        }
      }

      // Crouch
      if (inputs.down) {
        fighter.state = "CROUCH";
        fighter.velocity.x = 0;
      }

      // Jump
      if (inputs.up) {
        fighter.isGrounded = false;
        fighter.velocity.y = 8.8; // jump impulse
        fighter.state = "JUMP";
        fighter.stateDuration = 0.7;
      }
    } else {
      // In-air drift
      const airDrift = 1.8;
      if (inputs.left) fighter.velocity.x = -airDrift;
      if (inputs.right) fighter.velocity.x = airDrift;
    }

    // Attacks
    if (inputs.punch) {
      fighter.performMove(inputs.down ? "KICK_L" : "PUNCH_L"); // crouch punch resolves to kick/sweep in some styles
    } else if (inputs.kick) {
      fighter.performMove(inputs.down ? "KICK_H" : "KICK_H");
    } else if (inputs.grab) {
      fighter.performMove("GRAB");
    } else if (inputs.special) {
      fighter.performMove("SPECIAL");
    } else if (inputs.ultimate) {
      fighter.performMove("ULTIMATE");
    } else if (inputs.dashLeft) {
      fighter.performMove(fighter.facingDir > 0 ? "DASH_BWD" : "DASH_FWD");
    } else if (inputs.dashRight) {
      fighter.performMove(fighter.facingDir > 0 ? "DASH_FWD" : "DASH_BWD");
    } else if (inputs.block) {
      fighter.state = "BLOCK";
      fighter.stateDuration = 0.15;
    }
  }

  resolveFightersOverlap() {
    const dist = this.p1.position.x - this.p2.position.x;
    const absDist = Math.abs(dist);
    const minSeparation = 0.8;

    if (absDist < minSeparation) {
      const push = (minSeparation - absDist) / 2;
      const dir = dist >= 0 ? 1 : -1;
      
      // push them apart
      this.p1.position.x += push * dir;
      this.p2.position.x -= push * dir;
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.x += p.velocity.x * dt;

      // Spawn trails
      if (Math.random() > 0.4) {
        this.engine.particles.spawnEnergyTrail(p.mesh.position, p.colorCode);
      }

      // Check stage boundary limit
      if (Math.abs(p.mesh.position.x) > 13) {
        this.removeProjectile(i);
        continue;
      }

      // Check collision with target hurtbox
      const tHurt = p.target.getHurtbox();
      const pX = p.mesh.position.x;
      const pY = p.mesh.position.y;
      
      const targetIsSidestepping = p.target.state === "SIDESTEP_L" || p.target.state === "SIDESTEP_R" || Math.abs(p.target.position.z) > 0.4;

      if (!targetIsSidestepping && pX >= tHurt.minX && pX <= tHurt.maxX && pY >= tHurt.minY && pY <= tHurt.maxY) {
        // Impact!
        const isBlocking = p.target.state === "BLOCK";
        const damageDealt = p.target.takeDamage(p.damage, isBlocking, false, p.dir, p.owner.comboCounter, p.owner.id);

        
        if (damageDealt > 0) {
          p.owner.connectedStrikes++;
          p.owner.totalDamageDealt += damageDealt;
        }

        // Spawn sparks
        this.engine.particles.spawnHitParticles(p.mesh.position, 12, p.colorCode);
        if (isBlocking) {
          this.engine.particles.spawnBlockParryShield(p.mesh.position, p.target.colors.primary);
          this.engine.triggerPropsShake(0.15);
          window.SoundSynth.playSFX("block");
        } else {
          this.engine.triggerPropsShake(0.2);
          if (p.owner.id === "vulcan") {
            window.SoundSynth.playSFX("fire_explode");
          } else if (p.owner.id === "tigris") {
            window.SoundSynth.playSFX("claw_hit");
          } else {
            window.SoundSynth.playSFX("light_hit");
          }
        }

        
        this.engine.triggerShake(0.4);

        
        // Combo increment if hit lands
        if (!isBlocking) {
          p.owner.comboCounter++;
          p.owner.comboTimer = 2.0; // 2 seconds window
        }

        this.removeProjectile(i);
      }
    }
  }

  removeProjectile(idx) {
    const p = this.projectiles[idx];
    this.engine.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    p.mesh.material.dispose();
    this.projectiles.splice(idx, 1);
  }

  // Check physical hitbox-to-hurtbox collisions
  checkCombatCollisions() {
    const processHit = (attacker, defender) => {
      const hitbox = attacker.getHitbox();
      if (!hitbox) return;

      const hurtbox = defender.getHurtbox();

      // Check if defender is sidestepping (Z-separation)
      const isSidestepping = defender.state === "SIDESTEP_L" || defender.state === "SIDESTEP_R" || Math.abs(defender.position.z) > 0.45;

      // Check box intersection (AABB overlap)
      const overlapX = hitbox.minX <= hurtbox.maxX && hitbox.maxX >= hurtbox.minX;
      const overlapY = hitbox.minY <= hurtbox.maxY && hitbox.maxY >= hurtbox.minY;

      if (!isSidestepping && overlapX && overlapY) {
        attacker.hasHitActive = true; // prevent double hits this action
        
        const isBlocking = defender.state === "BLOCK" && defender.facingDir !== attacker.facingDir;
        
        // Block parry override if sentinel shield
        const reflectDamage = defender.id === "jadesentinel" && isBlocking && hitbox.type === "SPECIAL";

        // Apply Damage (passing attacker.comboCounter and attacker.id)
        const damageDealt = defender.takeDamage(hitbox.damage, isBlocking, hitbox.isHeavy, attacker.facingDir, attacker.comboCounter, attacker.id);

        
        // FX
        const hitPos = new THREE.Vector3(
          (hitbox.minX + hitbox.maxX) / 2,
          (hitbox.minY + hitbox.maxY) / 2,
          0
        );

        if (damageDealt > 0) {
          attacker.connectedStrikes++;
          attacker.totalDamageDealt += damageDealt;
        }

        if (isBlocking) {
          this.engine.particles.spawnHitParticles(hitPos, 6, "#ffffff");
          this.engine.particles.spawnBlockParryShield(hitPos, defender.colors.primary);
          this.engine.triggerShake(0.2);
          this.engine.triggerPropsShake(0.12);
        } else {
          let shakeAmount = 0.35;
          let particleCount = 10;
          
          if (hitbox.type === "ULTIMATE") {
            shakeAmount = 1.5;
            particleCount = 45;
            this.engine.particles.spawnGroundCrack(defender.position);
            this.engine.particles.spawnUltimateExplosion(hitPos, attacker.colors.primary);
            window.SoundSynth.playSFX("ultimate_explosion");
          } else if (hitbox.type === "PUNCH_H" || hitbox.type === "KICK_H" || hitbox.type === "GRAB") {
            shakeAmount = 0.85;
            particleCount = 20;
            this.engine.particles.spawnDustParticles(defender.position, 8);
            if (attacker.id === "vulcan") {
              window.SoundSynth.playSFX("fire_explode");
            } else {
              window.SoundSynth.playSFX("heavy_hit");
            }
          } else if (hitbox.type === "SPECIAL") {
            shakeAmount = 0.6;
            particleCount = 16;
            if (attacker.id === "vulcan") {
              window.SoundSynth.playSFX("fire_explode");
            } else if (attacker.id === "tigris") {
              window.SoundSynth.playSFX("claw_hit");
            } else {
              window.SoundSynth.playSFX("special");
            }
          } else {
            // Light attacks (PUNCH_L, KICK_L)
            shakeAmount = 0.35;
            particleCount = 10;
            this.engine.particles.spawnDustParticles(defender.position, 3);
            if (attacker.id === "tigris") {
              window.SoundSynth.playSFX("claw_hit");
            } else {
              window.SoundSynth.playSFX("light_hit");
            }
          }

          this.engine.particles.spawnHitParticles(hitPos, particleCount, attacker.colors.primary);
          this.engine.triggerShake(shakeAmount);
          this.engine.triggerPropsShake(shakeAmount * 0.3);

          // Update attacker combo tracker
          attacker.comboCounter++;
          attacker.comboTimer = 2.0;

          if (attacker.comboCounter > (attacker === this.p1 ? this.maxCombos.p1 : this.maxCombos.p2)) {
            if (attacker === this.p1) this.maxCombos.p1 = attacker.comboCounter;
            else this.maxCombos.p2 = attacker.comboCounter;
          }
        }

        // Check if defender died to trigger KO State
        if (defender.health <= 0) {
          this.triggerKO(hitPos);
        }
      }
    };

    processHit(this.p1, this.p2);
    processHit(this.p2, this.p1);
  }

  triggerKO(hitPos) {
    this.isKOState = true;
    this.koTimer = 0;
    this.koStartTime = Date.now();
    this.matchActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Stop horizontal movement for winner; loser gets knocked down
    const winner = this.p1.health > 0 ? this.p1 : this.p2;
    winner.velocity.set(0, winner.velocity.y, 0);

    // Clear all projectiles immediately to ignore remaining attacks
    this.projectiles.forEach(p => {
      this.engine.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.projectiles = [];

    // Trigger stage-specific custom K.O. particles
    const particleTargetPos = hitPos || this.p2.position.clone().add(this.p1.position).multiplyScalar(0.5);
    this.engine.particles.spawnStageKOParticles(particleTargetPos, this.selectedStageId);

    // Apply high-strength visual screen shake
    this.engine.triggerShake(1.5);

    // Zoom camera on contact point
    this.engine.cinematicCameraMode = true;
    this.engine.cameraZoomFactor = 0.45;
    this.engine.cameraTargetX = hitPos ? hitPos.x : 0;
    this.engine.cameraTargetY = hitPos ? hitPos.y + 0.15 : 1.35;
    if (hitPos) {
      this.engine.customLookTarget.copy(hitPos);
    }

    // Play announcer vocal
    window.SoundSynth.playSFX("announce_ko");

    // Stylized K.O. visual text banner trigger
    const banner = document.getElementById("hud-center-banner");
    banner.classList.add("knockout");
    const bannerText = document.getElementById("banner-text");
    bannerText.textContent = "K.O.";
    banner.classList.add("show");
  };

  resolveTimeout() {
    this.matchActive = false;
    this.isKOState = true;
    this.koStartTime = Date.now();
    this.koTimer = 2.0; // instant exit

    const banner = document.getElementById("hud-center-banner");
    const bannerText = document.getElementById("banner-text");
    bannerText.textContent = "TIME UP";
    banner.classList.add("show");
    window.SoundSynth.playSFX("ko_slow");
  }

  resolveRoundEnd() {
    // Determine winner of the round
    let roundWinner = null;
    if (this.p1.health > this.p2.health) {
      roundWinner = "p1";
      this.roundsWon.p1++;
    } else {
      roundWinner = "p2";
      this.roundsWon.p2++;
    }

    // Save detailed round statistics
    this.roundHistory.push({
      roundNum: this.roundNum,
      winner: roundWinner,
      p1HealthRemaining: Math.ceil(this.p1.health),
      p2HealthRemaining: Math.ceil(this.p2.health),
      matchTimeElapsed: 99 - this.matchTimer,
      p1MaxCombo: this.maxCombos.p1,
      p2MaxCombo: this.maxCombos.p2
    });

    this.updateRoundMarkers();

    // Make winner perform victory taunt
    const winnerObj = roundWinner === "p1" ? this.p1 : this.p2;
    winnerObj.state = "WIN_POSE";
    winnerObj.stateTime = 0;
    winnerObj.stateDuration = 999;

    // Orbit/focus camera on winner
    this.engine.cinematicCameraMode = true;
    this.engine.cameraZoomFactor = 0.55;
    this.engine.cameraTargetX = winnerObj.position.x;
    this.engine.cameraTargetY = 1.35;
    this.engine.customLookTarget.copy(winnerObj.position);

    // Play announcer winner SFX
    window.SoundSynth.playSFX("announce_winner");

    // Check if match decided
    const matchDecided = (this.roundsWon.p1 >= this.roundsToWin) || (this.roundsWon.p2 >= this.roundsToWin);

    setTimeout(() => {
      if (this.currentScreen !== "screen-fight") return;

      if (matchDecided) {
        this.resolveMatchEnd();
      } else {
        this.roundNum++;
        this.triggerRoundEntrance();
      }
    }, 3200);
  }

  populateStatsUI(p1Win, isPractice, subtitleOverride = null) {
    document.getElementById("gameover-title").textContent = p1Win ? "VICTORY" : "DEFEAT";
    if (subtitleOverride) {
      document.getElementById("gameover-subtitle").textContent = subtitleOverride;
    } else {
      document.getElementById("gameover-subtitle").textContent = isPractice ? "PRACTICE SESSION ENDED" : (p1Win ? "PLAYER 1 WINS THE MATCH" : "AI OPPONENT WINS THE MATCH");
    }

    const totalDmg = Math.round(this.p1.totalDamageDealt);
    const longestCombo = Math.max(this.p1.maxComboCount, this.maxCombos.p1);
    const accuracy = Math.round((this.p1.connectedStrikes / Math.max(1, this.p1.totalStrikes)) * 100);
    const timeLeft = `${this.matchTimer}s`;
    const roundsScore = `${this.roundsWon.p1} - ${this.roundsWon.p2}`;

    document.getElementById("stat-total-damage").textContent = `${totalDmg} HP`;
    document.getElementById("stat-longest-combo").textContent = `${longestCombo} HITS`;
    document.getElementById("stat-accuracy").textContent = `${accuracy}%`;
    document.getElementById("stat-time-left").textContent = timeLeft;
    document.getElementById("stat-rounds-won").textContent = roundsScore;
  }

  resolveMatchEnd() {
    // Clear cinematic zoom
    this.engine.cinematicCameraMode = false;
    this.engine.cameraZoomFactor = 1.0;

    const p1Win = this.roundsWon.p1 > this.roundsWon.p2;
    const isPractice = this.gameMode === "practice";

    if (this.gameMode === "arcade") {
      if (p1Win) {
        // Advance ladder index!
        this.arcadeStageIndex++;
        if (this.arcadeStageIndex < this.arcadeLadder.length) {
          // Show victory transition banner and load next match
          const banner = document.getElementById("hud-center-banner");
          const bannerText = document.getElementById("banner-text");
          bannerText.textContent = "VICTORY! NEXT MATCH...";
          banner.classList.add("show");
          window.SoundSynth.playSFX("announce_winner");
          
          setTimeout(() => {
            banner.classList.remove("show");
            this.setupArcadeMatch();
            this.startFight();
          }, 3200);
        } else {
          // Beat the boss (Vulcan)! Show overall victory champion screen
          this.showScreen("screen-gameover");
          this.populateStatsUI(true, false, "YOU CONQUERED THE ARCADE LADDER!");
          document.getElementById("gameover-title").textContent = "CHAMPION";
        }
      } else {
        // Player lost in Arcade Mode! Trigger "CONTINUE?" countdown
        this.cleanupPreviews();
        this.showScreen("screen-continue");
        this.startContinueCountdown();
      }
    } else {
      // Standard versus/practice gameover
      this.showScreen("screen-gameover");
      this.populateStatsUI(p1Win, isPractice);
    }
  }

  startContinueCountdown() {
    if (this.continueInterval) clearInterval(this.continueInterval);
    this.continueTimer = 10;
    document.getElementById("continue-timer").textContent = this.continueTimer;
    
    // Play countdown slow start
    window.SoundSynth.playSFX("beep_tick");

    this.continueInterval = setInterval(() => {
      this.continueTimer--;
      document.getElementById("continue-timer").textContent = this.continueTimer;
      
      if (this.continueTimer > 0) {
        window.SoundSynth.playSFX("beep_tick");
      } else {
        clearInterval(this.continueInterval);
        this.selectContinue(false); // times out to defeat
      }
    }, 1000);
  }

  selectContinue(yes) {
    if (this.continueInterval) clearInterval(this.continueInterval);
    
    if (yes) {
      window.SoundSynth.playSFX("ui_select");
      this.cleanupFight();
      this.setupArcadeMatch();
      this.startFight();
    } else {
      window.SoundSynth.playSFX("ui_click");
      this.cleanupFight();
      
      // Go directly to gameover defeat screen!
      this.showScreen("screen-gameover");
      const isPractice = this.gameMode === "practice";
      this.populateStatsUI(false, isPractice);
    }
  }


  updateHUD(dt) {
    // 1. Health slider widths
    const h1 = document.getElementById("hud-p1-health");
    const h2 = document.getElementById("hud-hud-p2-health");
    
    h1.style.width = `${this.p1.health}%`;
    h2.style.width = `${this.p2.health}%`;

    // Red damage bar catching up slowly
    const h1Catch = document.getElementById("hud-p1-health-catch");
    const h2Catch = document.getElementById("hud-hud-p2-health-catch");

    const w1Current = parseFloat(h1Catch.style.width);
    const w2Current = parseFloat(h2Catch.style.width);
    
    h1Catch.style.width = `${THREE.MathUtils.lerp(w1Current, this.p1.health, 0.05)}%`;
    h2Catch.style.width = `${THREE.MathUtils.lerp(w2Current, this.p2.health, 0.05)}%`;

    // 2. Rage bar widths
    document.getElementById("hud-p1-rage").style.width = `${this.p1.rage}%`;
    document.getElementById("hud-hud-p2-rage").style.width = `${this.p2.rage}%`;

    // 3. Combos display trigger
    const c1Label = document.getElementById("combo-display-left");
    const c2Label = document.getElementById("combo-display-right");

    if (this.p1.comboCounter > 1) {
      c1Label.querySelector(".count").textContent = this.p1.comboCounter;
      c1Label.classList.add("show");
    } else {
      c1Label.classList.remove("show");
    }

    if (this.p2.comboCounter > 1) {
      c2Label.querySelector(".count").textContent = this.p2.comboCounter;
      c2Label.classList.add("show");
    } else {
      c2Label.classList.remove("show");
    }
  }

  cleanupFight() {
    this.matchActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    // Clear projectiles
    this.projectiles.forEach(p => {
      this.engine.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.projectiles = [];

    // Clear particles
    if (this.engine) {
      this.engine.particles.clearAll();
    }

    // Hide Move List HUD panel on cleanup
    const movePanel = document.getElementById("movelist-panel");
    const moveBtn = document.getElementById("btn-movelist-toggle");
    if (movePanel) movePanel.classList.remove("open");
    if (moveBtn) moveBtn.classList.remove("active");
  }

  renderMoveList(charData) {
    const listContainer = document.getElementById("movelist-content");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    
    charData.moves.forEach(move => {
      const item = document.createElement("div");
      item.className = "movelist-item";
      item.innerHTML = `
        <div class="move-header">
          <span class="move-name">${move.name}</span>
          <span class="move-combo">${move.combo}</span>
        </div>
        <div class="move-desc">${move.desc}</div>
      `;
      listContainer.appendChild(item);
    });
  }
}

// Instantiate App
window.addEventListener("DOMContentLoaded", () => {
  window.GameApp = new App();
});
