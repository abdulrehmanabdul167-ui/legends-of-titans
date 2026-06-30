// Legends of Iron - FX System (Synthesized Sound & 3D Particles)
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.bgmNode = null;
    this.isPlayingBGM = false;
    this.masterVolume = 0.5;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
  }

  playSFX(type) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    switch (type) {
      case "light_hit":
        this.synthHit(150, 40, 0.08, 0.4);
        this.synthNoise(2000, 800, 0.05, 0.3);
        break;
      case "heavy_hit":
        this.synthHit(120, 20, 0.25, 0.8);
        this.synthNoise(1500, 200, 0.15, 0.6);
        this.synthImpactBoom(60, 0.4);
        break;
      case "block":
        this.synthHit(450, 300, 0.05, 0.5, "triangle");
        this.synthNoise(6000, 3000, 0.04, 0.3);
        break;
      case "grab":
        this.synthSweep(80, 280, 0.15, 0.4, "sine");
        break;
      case "dash":
        this.synthSweep(400, 100, 0.1, 0.3, "triangle");
        this.synthNoise(800, 100, 0.1, 0.2);
        break;
      case "special":
        this.synthSweep(100, 900, 0.3, 0.5, "sawtooth");
        this.synthSweep(150, 1200, 0.3, 0.3, "sine");
        break;
      case "ultimate_charge":
        this.synthSweep(80, 1500, 1.2, 0.6, "sawtooth");
        this.synthNoise(3000, 200, 1.2, 0.4);
        break;
      case "ultimate_explosion":
        this.synthImpactBoom(40, 2.5);
        this.synthNoise(800, 50, 0.8, 1.0);
        this.synthSweep(2000, 100, 0.6, 0.8, "sawtooth");
        break;
      case "ko_slow":
        this.synthImpactBoom(30, 2.0);
        break;
      case "ui_click":
        this.synthHit(600, 800, 0.06, 0.2, "sine");
        break;
      case "ui_select":
        this.synthHit(300, 600, 0.1, 0.3, "triangle");
        break;
      case "announce_round1":
        this.synthAnnouncerSpeech("round1");
        break;
      case "announce_round2":
        this.synthAnnouncerSpeech("round2");
        break;
      case "announce_final":
        this.synthAnnouncerSpeech("finalround");
        break;
      case "announce_fight":
        this.synthAnnouncerSpeech("fight");
        break;
      case "announce_ko":
        this.synthAnnouncerSpeech("knockout");
        break;
      case "announce_winner":
        this.synthAnnouncerSpeech("winner");
        break;
      case "beep_tick":
        this.synthAnnouncerSpeech("countdown");
        break;
      case "beep_start":
        this.synthAnnouncerSpeech("countdown_start");
        break;
      case "claw_hit":
        this.synthSweep(800, 2400, 0.08, 0.5, "sawtooth");
        this.synthNoise(9000, 4000, 0.06, 0.45);
        break;
      case "fire_explode":
        this.synthImpactBoom(48, 1.2);
        this.synthNoise(1200, 250, 0.4, 0.7);
        this.synthSweep(100, 400, 0.35, 0.6, "sawtooth");
        break;
    }

  }

  synthAnnouncerSpeech(phrase) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Announcer vocal synth helper
    const speakSyllable = (freqStart, freqEnd, duration, type = "sawtooth", delay = 0, formants = [400, 1000]) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t + delay);
      osc.frequency.linearRampToValueAtTime(freqEnd, t + delay + duration);
      
      // Formant simulation using low-pass and band-pass filters
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(formants[0], t + delay);
      filter.frequency.exponentialRampToValueAtTime(formants[1], t + delay + duration);
      filter.Q.setValueAtTime(4.0, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, t + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t + delay);
      osc.stop(t + delay + duration);
    };

    if (phrase === "round1") {
      // "Round"
      speakSyllable(120, 100, 0.22, "sawtooth", 0, [450, 800]);
      // "One"
      speakSyllable(150, 180, 0.18, "triangle", 0.24, [600, 950]);
    } else if (phrase === "round2") {
      // "Round"
      speakSyllable(120, 100, 0.22, "sawtooth", 0, [450, 800]);
      // "Two"
      speakSyllable(240, 200, 0.25, "sawtooth", 0.24, [800, 500]);
    } else if (phrase === "finalround") {
      // "Fi-"
      speakSyllable(200, 220, 0.15, "triangle", 0, [900, 1200]);
      // "-nal"
      speakSyllable(220, 140, 0.2, "sawtooth", 0.16, [600, 450]);
      // "Round"
      speakSyllable(120, 95, 0.25, "sawtooth", 0.38, [450, 800]);
    } else if (phrase === "fight") {
      // "Fi-" (noise burst)
      this.synthNoise(2000, 400, 0.08, 0.25);
      // "-ght!" (punchy descending slide)
      speakSyllable(190, 85, 0.35, "sawtooth", 0.05, [750, 400]);
    } else if (phrase === "knockout") {
      // "Knock" (sharp buzz)
      speakSyllable(160, 150, 0.16, "sawtooth", 0, [500, 900]);
      // "Out"
      speakSyllable(140, 80, 0.28, "sawtooth", 0.18, [700, 350]);
      // Dramatic explosion hit
      this.synthImpactBoom(50, 0.65);
    } else if (phrase === "winner") {
      // "Win"
      speakSyllable(180, 220, 0.16, "sawtooth", 0, [600, 1000]);
      // "ner"
      speakSyllable(150, 110, 0.24, "sawtooth", 0.18, [400, 300]);
    } else if (phrase === "countdown") {
      // "Beep"
      this.synthHit(880, 880, 0.15, 0.3, "sine");
    } else if (phrase === "countdown_start") {
      // High pitch Start beep
      this.synthHit(1320, 1320, 0.35, 0.45, "sine");
    }
  }

  synthHit(startFreq, endFreq, duration, vol, type = "sine") {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(vol * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  synthNoise(startFilterFreq, endFilterFreq, duration, vol) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(startFilterFreq, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFilterFreq, this.ctx.currentTime + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  synthSweep(startFreq, endFreq, duration, vol, type = "sine") {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol * this.masterVolume, this.ctx.currentTime + duration * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  synthImpactBoom(freq, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(1.0 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  startBGM() {
    this.init();
    if (!this.ctx || this.isPlayingBGM) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isPlayingBGM = true;
    this.playBgmLoop();
  }

  playBgmLoop() {
    if (!this.isPlayingBGM) return;

    const tempo = 125; // BPM
    const eighthNoteTime = 60 / tempo / 2; // Time of one eighth note in seconds
    const tStart = this.ctx.currentTime;
    
    // Synth-wave bassline generator running in short segments
    // We schedule a 4-bar progression: Am, F, C, G
    const chords = [
      [37.0, 44.0], // A1, A2
      [29.1, 36.7], // F1, F2
      [32.7, 41.2], // C1, C2
      [24.5, 30.9]  // G1, G2
    ];
    
    let timeIndex = 0;
    const scheduleBassNote = (noteFreq, noteTime, noteDuration, accent) => {
      if (!this.isPlayingBGM) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.value = noteFreq;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 4;
      filter.frequency.setValueAtTime(180, noteTime);
      filter.frequency.exponentialRampToValueAtTime(500, noteTime + 0.05);
      filter.frequency.linearRampToValueAtTime(120, noteTime + noteDuration);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime((accent ? 0.22 : 0.15) * this.masterVolume, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + noteDuration);
    };

    const scheduleDrumBeat = (noteTime) => {
      if (!this.isPlayingBGM) return;
      // Kick drum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, noteTime);
      osc.frequency.exponentialRampToValueAtTime(45, noteTime + 0.1);
      gain.gain.setValueAtTime(0.3 * this.masterVolume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    };

    const scheduleSnareBeat = (noteTime) => {
      if (!this.isPlayingBGM) return;
      // Snare drum
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 * this.masterVolume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(noteTime);
      noise.stop(noteTime + 0.15);
    };

    const scheduleLeadMelody = (freq, noteTime, noteDuration) => {
      if (!this.isPlayingBGM) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, noteTime);
      filter.frequency.exponentialRampToValueAtTime(1500, noteTime + 0.1);
      
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + noteDuration);
    };

    // Melody: A4 (440Hz), B4 (494Hz), C5 (523Hz), E5 (659Hz), D5 (587Hz)
    const melody = [
      440.0, 440.0, 523.25, 494.0, 0, 494.0, 587.33, 523.25,
      659.25, 0, 587.33, 523.25, 494.0, 0, 440.0, 0
    ];

    // Generate 8 measures (16 beats, or 32 eighth notes)
    for (let step = 0; step < 32; step++) {
      const noteTime = tStart + step * eighthNoteTime;
      const chordIndex = Math.floor(step / 8) % chords.length;
      const bassFreq = chords[chordIndex][step % 2 === 0 ? 0 : 1];
      
      // Schedule Bass
      scheduleBassNote(bassFreq * 2, noteTime, eighthNoteTime * 0.9, step % 4 === 0);
      
      // Schedule Drums
      if (step % 4 === 0) {
        scheduleDrumBeat(noteTime); // Kick on beat 1 and 3
      }
      if (step % 4 === 2) {
        scheduleSnareBeat(noteTime); // Snare on beat 2 and 4
      }

      // Schedule Lead Melody (some notes)
      const melNote = melody[step % melody.length];
      if (melNote > 0 && Math.random() > 0.3) {
        scheduleLeadMelody(melNote, noteTime, eighthNoteTime * 1.5);
      }
    }

    // Schedule next loop segment 3.9 seconds in the future
    const loopDuration = 32 * eighthNoteTime;
    this.bgmTimeout = setTimeout(() => {
      this.playBgmLoop();
    }, loopDuration * 1000 - 50);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
  }
}

class VisualParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  // Create sparks or impact rings at hit target
  spawnHitParticles(position, count = 15, colorCode = "#ffcc00") {
    const color = new THREE.Color(colorCode);

    // 1. Sparks
    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.15;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position with offset
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.3;
      mesh.position.y += (Math.random() - 0.5) * 0.3;
      mesh.position.z += (Math.random() - 0.5) * 0.3;
      
      // Velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.3) * 6 + 2,
        (Math.random() - 0.5) * 4
      );

      this.scene.add(mesh);
      this.particles.push({
        type: "spark",
        mesh: mesh,
        velocity: velocity,
        life: 1.0,
        decay: 1.5 + Math.random() * 2.0
      });
    }

    // 2. Shockwave ring
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(position);
    ringMesh.rotation.y = Math.PI / 2; // Face side-view camera
    this.scene.add(ringMesh);
    
    this.particles.push({
      type: "ring",
      mesh: ringMesh,
      scaleSpeed: 8.0,
      life: 1.0,
      decay: 4.0
    });
  }

  spawnDustParticles(position, count = 10) {
    const color = new THREE.Color("#cccccc");
    for (let i = 0; i < count; i++) {
      const size = 0.15 + Math.random() * 0.2;
      const geometry = new THREE.SphereGeometry(size, 5, 5);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.copy(position);
      mesh.position.y = 0.05;
      mesh.position.x += (Math.random() - 0.5) * 0.6;
      mesh.position.z += (Math.random() - 0.5) * 0.6;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2.5
      );

      this.scene.add(mesh);
      this.particles.push({
        type: "dust",
        mesh: mesh,
        velocity: velocity,
        life: 1.0,
        decay: 1.2 + Math.random() * 1.5
      });
    }
  }

  // Energy projectile effect particle emitter
  spawnEnergyTrail(position, colorCode = "#00ffcc") {
    const size = 0.08 + Math.random() * 0.1;
    const geometry = new THREE.SphereGeometry(size, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorCode),
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );

    this.scene.add(mesh);
    this.particles.push({
      type: "trail",
      mesh: mesh,
      velocity: velocity,
      life: 1.0,
      decay: 2.5
    });
  }

  // Massive explosion for ultimate attacks
  spawnUltimateExplosion(position, colorCode = "#ff007f") {
    const color = new THREE.Color(colorCode);

    // Spawning 50 particles flying in a sphere
    for (let i = 0; i < 50; i++) {
      const size = 0.1 + Math.random() * 0.25;
      const geometry = new THREE.DodecahedronGeometry(size);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.copy(position);
      
      // Spherical direction velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 3.0 + Math.random() * 8.0;
      
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        type: "spark",
        mesh: mesh,
        velocity: velocity,
        life: 1.0,
        decay: 0.8 + Math.random() * 0.8
      });
    }

    // Expand multiple glowing dome shockwaves
    for (let j = 0; j < 3; j++) {
      const ringGeo = new THREE.RingGeometry(0.1, 0.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(position);
      ringMesh.rotation.y = Math.PI / 2;
      ringMesh.scale.set(1, 1, 1);
      this.scene.add(ringMesh);
      
      this.particles.push({
        type: "ring",
        mesh: ringMesh,
        scaleSpeed: 10.0 + j * 4.0,
        life: 1.0,
        decay: 2.0
      });
    }
  }

  // Spawn procedural cracked decal segments on the floor
  spawnGroundCrack(position) {
    const lineCount = 10;
    const vertices = [];
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const length = 0.5 + Math.random() * 0.7;
      
      vertices.push(0, 0.005, 0);
      vertices.push(Math.cos(angle) * length, 0.005, Math.sin(angle) * length);
      
      if (Math.random() > 0.4) {
        const branchAngle = angle + (Math.random() > 0.5 ? 0.45 : -0.45);
        const branchLen = length * 0.5;
        vertices.push(Math.cos(angle) * length * 0.6, 0.005, Math.sin(angle) * length * 0.6);
        vertices.push(
          Math.cos(angle) * length * 0.6 + Math.cos(branchAngle) * branchLen,
          0.005,
          Math.sin(angle) * length * 0.6 + Math.sin(branchAngle) * branchLen
        );
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0x14141a,
      transparent: true,
      opacity: 0.8
    });
    
    const crackLines = new THREE.LineSegments(geometry, material);
    crackLines.position.set(position.x, 0.005, position.z);
    this.scene.add(crackLines);
    
    this.particles.push({
      type: "crack",
      mesh: crackLines,
      life: 1.0,
      decay: 0.2 // stays for 5 seconds
    });
  }

  // Spawns speed lines during dashes and heavy attacks
  spawnWindStreak(position, dir) {
    const vertices = [
      0, 0, 0,
      -1.4 * dir, 0.03 * (Math.random() - 0.5), 0
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65
    });
    
    const streak = new THREE.Line(geometry, material);
    streak.position.copy(position);
    streak.position.y += (Math.random() - 0.5) * 0.8;
    streak.position.z += (Math.random() - 0.5) * 0.25;
    
    this.scene.add(streak);
    this.particles.push({
      type: "streak",
      mesh: streak,
      velocity: new THREE.Vector3(15.0 * dir, 0, 0),
      life: 1.0,
      decay: 5.0 // extremely fast speed fade
    });
  }

  // Spawns a glowing parry shield ring
  spawnBlockParryShield(position, colorCode = "#00ffcc") {
    const geometry = new THREE.RingGeometry(0.3, 0.65, 6);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorCode),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.y = Math.PI / 2;
    
    this.scene.add(mesh);
    this.particles.push({
      type: "shield",
      mesh: mesh,
      scaleSpeed: 5.0,
      life: 1.0,
      decay: 3.5
    });
  }

  // Spawns expanding ripples on wet floors
  spawnRainRipple(position, colorCode = "#77bbff") {
    const geometry = new THREE.RingGeometry(0.04, 0.2, 12);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorCode),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, 0.01, position.z);
    mesh.rotation.x = -Math.PI / 2;
    
    this.scene.add(mesh);
    this.particles.push({
      type: "ripple",
      mesh: mesh,
      scaleSpeed: 3.0,
      life: 1.0,
      decay: 2.2
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt * p.decay;
      
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === "spark" || p.type === "trail" || p.type === "dust" || p.type === "streak") {
        // Move particle
        p.mesh.position.addScaledVector(p.velocity, dt);
        
        // Apply gravity to sparks
        if (p.type === "spark") {
          p.velocity.y -= 9.8 * dt; // gravity
        }
        
        // Shrink particle or grow dust!
        if (p.type === "dust") {
          const sc = 1.0 + (1.0 - p.life) * 2.0;
          p.mesh.scale.set(sc, sc, sc);
        } else if (p.type !== "streak") {
          p.mesh.scale.set(p.life, p.life, p.life);
        }
        
        // Fade out
        p.mesh.material.opacity = p.life * (p.type === "dust" ? 0.5 : (p.type === "streak" ? 0.65 : 1.0));
      } else if (p.type === "ring" || p.type === "shield" || p.type === "ripple") {
        // Scale ring outwards
        const sc = 1.0 + (1.0 - p.life) * p.scaleSpeed;
        p.mesh.scale.set(sc, sc, sc);
        
        // Fade out
        p.mesh.material.opacity = p.life * (p.type === "ripple" ? 0.4 : 0.8);
      } else if (p.type === "crack") {
        // Fade out lines slowly
        p.mesh.material.opacity = p.life * 0.8;
      }
    }
  }


  // Stage-specific cinematic K.O. particles
  spawnStageKOParticles(position, stageId) {
    if (stageId === "cybercity") {
      // 1. Neon electric sparks
      for (let i = 0; i < 35; i++) {
        const size = 0.05 + Math.random() * 0.12;
        const geom = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(Math.random() > 0.5 ? "#00ffcc" : "#ff00ff"),
          transparent: true,
          opacity: 0.95
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.x += (Math.random() - 0.5) * 0.5;
        mesh.position.y += (Math.random() - 0.5) * 0.5;
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.3) * 8 + 3,
          (Math.random() - 0.5) * 5
        );
        this.scene.add(mesh);
        this.particles.push({
          type: "spark",
          mesh: mesh,
          velocity: velocity,
          life: 1.0,
          decay: 1.2 + Math.random() * 1.5
        });
      }

      // 2. Large expanding floor ripples (wet water splash)
      for (let j = 0; j < 4; j++) {
        const geom = new THREE.RingGeometry(0.1, 0.4, 20);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#00ffff"),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(position.x + (Math.random() - 0.5) * 1.2, 0.015, (Math.random() - 0.5) * 0.5);
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.particles.push({
          type: "ripple",
          mesh: mesh,
          scaleSpeed: 12.0 + j * 4.0,
          life: 1.0,
          decay: 2.5
        });
      }
    } else if (stageId === "lavadojo") {
      // 1. Fiery glowing embers
      for (let i = 0; i < 40; i++) {
        const size = 0.08 + Math.random() * 0.15;
        const geom = new THREE.TetrahedronGeometry(size);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#ff5500"),
          transparent: true,
          opacity: 0.95
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.x += (Math.random() - 0.5) * 0.4;
        mesh.position.y += (Math.random() - 0.5) * 0.4;
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.2) * 10 + 4,
          (Math.random() - 0.5) * 6
        );
        this.scene.add(mesh);
        this.particles.push({
          type: "spark",
          mesh: mesh,
          velocity: velocity,
          life: 1.0,
          decay: 1.0 + Math.random() * 1.0
        });
      }
      
      // 2. Rising lava smoke
      for (let j = 0; j < 15; j++) {
        const size = 0.2 + Math.random() * 0.3;
        const geom = new THREE.SphereGeometry(size, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#443333"),
          transparent: true,
          opacity: 0.4
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.y = 0.1;
        mesh.position.x += (Math.random() - 0.5) * 1.5;
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          1.5 + Math.random() * 2.0,
          (Math.random() - 0.5) * 1.5
        );
        this.scene.add(mesh);
        this.particles.push({
          type: "dust",
          mesh: mesh,
          velocity: velocity,
          life: 1.0,
          decay: 0.7 + Math.random() * 0.5
        });
      }
    } else {
      // Ancient Dojo / Default: Cherry blossom flower petal storm
      for (let i = 0; i < 50; i++) {
        const size = 0.08 + Math.random() * 0.12;
        const geom = new THREE.BoxGeometry(size, size * 0.6, 0.01);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#ff99cc"),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.x += (Math.random() - 0.5) * 0.8;
        mesh.position.y += (Math.random() - 0.5) * 0.8;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.2) * 8 + 3,
          (Math.random() - 0.5) * 7
        );
        this.scene.add(mesh);
        this.particles.push({
          type: "spark",
          mesh: mesh,
          velocity: velocity,
          life: 1.0,
          decay: 0.7 + Math.random() * 0.8
        });
      }
    }
  }

  clearAll() {
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.particles = [];
  }
}

window.SoundSynth = new SoundSynth();
window.VisualParticleSystem = VisualParticleSystem;
