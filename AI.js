// Legends of Iron - Fighting AI brain
class AI {
  constructor(fighter, target, difficulty = "Normal") {
    this.fighter = fighter;
    this.target = target;
    this.difficulty = difficulty;
    
    this.decisionTimer = 0;
    this.decisionDelay = 0.5; // seconds between action updates
    this.blockChance = 0.3;   // percentage probability to defend
    
    this.setDifficulty(difficulty);
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    switch (difficulty) {
      case "Easy":
        this.decisionDelay = 0.7;
        this.blockChance = 0.1;
        break;
      case "Normal":
        this.decisionDelay = 0.45;
        this.blockChance = 0.35;
        break;
      case "Hard":
        this.decisionDelay = 0.25;
        this.blockChance = 0.65;
        break;
      case "Expert":
        this.decisionDelay = 0.14;
        this.blockChance = 0.8;
        break;
      case "Legend":
        this.decisionDelay = 0.06; // ultra-fast reaction
        this.blockChance = 0.95;   // blocks almost everything
        break;
    }
  }

  update(dt) {
    if (this.fighter.state === "KO" || this.fighter.state === "FALLEN" || this.target.state === "KO") return;

    this.decisionTimer += dt;
    if (this.decisionTimer < this.decisionDelay) return;
    this.decisionTimer = 0;

    const dist = Math.abs(this.fighter.position.x - this.target.position.x);
    const targetIsAttacking = ["PUNCH_L", "PUNCH_H", "KICK_L", "KICK_H", "SPECIAL", "ULTIMATE"].includes(this.target.state);

    // 1. Reactive defensive/evasive logic
    if (targetIsAttacking && dist < 3.5) {
      const isSpecialOrHeavy = ["SPECIAL", "PUNCH_H", "KICK_H", "ULTIMATE"].includes(this.target.state);
      const sidestepChance = this.difficulty === "Legend" ? 0.65 : (this.difficulty === "Expert" ? 0.45 : (this.difficulty === "Hard" ? 0.3 : 0.12));
      
      if (isSpecialOrHeavy && Math.random() < sidestepChance) {
        // Dodge along Z-axis (away or in)
        const sideDir = Math.random() > 0.5 ? "SIDESTEP_L" : "SIDESTEP_R";
        this.fighter.performMove(sideDir);
        return;
      }

      // Fallback to block defend
      if (Math.random() < this.blockChance && dist < 3.0) {
        this.fighter.velocity.x = -1.2 * this.fighter.facingDir;
        this.fighter.state = "BLOCK";
        this.fighter.stateDuration = 0.3;
        return;
      }
    }

    // 2. Offense decision trees
    if (this.fighter.rage >= 100 && Math.random() < 0.7) {
      this.fighter.performMove("ULTIMATE");
      return;
    }

    // Close Range decisions
    if (dist < 1.35) {
      const rand = Math.random();
      if (rand < 0.3) {
        this.fighter.performMove("PUNCH_L");
      } else if (rand < 0.55) {
        this.fighter.performMove("KICK_L");
      } else if (rand < 0.75) {
        this.fighter.performMove("PUNCH_H");
      } else if (rand < 0.9) {
        this.fighter.performMove("GRAB");
      } else {
        // Back off
        this.fighter.velocity.x = -3.5 * this.fighter.facingDir;
      }
    } 
    // Mid Range decisions
    else if (dist >= 1.35 && dist < 3.2) {
      const rand = Math.random();
      if (rand < 0.28) {
        // Move closer
        this.fighter.velocity.x = 3.0 * this.fighter.facingDir;
        this.fighter.state = "WALK_FWD";
        this.fighter.stateDuration = 0.25;
      } else if (rand < 0.42) {
        // Random sidestep shuffle spacing
        const sideDir = Math.random() > 0.5 ? "SIDESTEP_L" : "SIDESTEP_R";
        this.fighter.performMove(sideDir);
      } else if (rand < 0.65) {
        this.fighter.performMove("KICK_H");
      } else if (rand < 0.8) {
        this.fighter.performMove("SPECIAL");
      } else {
        // Jump attack attempt
        if (this.fighter.isGrounded) {
          this.fighter.isGrounded = false;
          this.fighter.velocity.y = 8.0;
          this.fighter.velocity.x = 4.5 * this.fighter.facingDir;
          this.fighter.state = "JUMP";
          this.fighter.stateDuration = 0.6;
        }
      }
    } 
    // Far Range decisions
    else {
      const rand = Math.random();
      if (rand < 0.5) {
        // Forward Dash
        this.fighter.performMove("DASH_FWD");
      } else if (rand < 0.85) {
        // Walk closer
        this.fighter.velocity.x = 3.0 * this.fighter.facingDir;
        this.fighter.state = "WALK_FWD";
        this.fighter.stateDuration = 0.3;
      } else {
        // Fire Special projectile
        this.fighter.performMove("SPECIAL");
      }
    }
  }
}

window.GameAI = AI;
