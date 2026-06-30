// Legends of Iron - Input Manager
class InputManager {
  constructor() {
    this.keys = {};
    this.virtualJoystick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, dirX: 0, dirY: 0 };
    this.buttonStates = {};
    this.gamepadConnected = false;
    this.lastInputTime = Date.now();

    this.initKeyboard();
    this.initGamepad();
  }

  initKeyboard() {
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      this.lastInputTime = Date.now();

      // Prevent scrolling
      if (["space", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.code.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    });
  }

  initGamepad() {
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad.id);
      this.gamepadConnected = true;
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected");
      this.gamepadConnected = false;
    });
  }

  // Get active inputs for Player 1
  getP1Inputs() {
    const inputs = {
      left: false,
      right: false,
      up: false, // jump
      down: false, // crouch
      punch: false,
      kick: false,
      block: false,
      grab: false,
      special: false,
      ultimate: false,
      dashLeft: false,
      dashRight: false,
      sidestepLeft: false,
      sidestepRight: false
    };

    // Keyboard inputs
    if (this.keys["a"] || this.keys["arrowleft"]) inputs.left = true;
    if (this.keys["d"] || this.keys["arrowright"]) inputs.right = true;
    if (this.keys["w"] || this.keys["arrowup"]) inputs.up = true;
    if (this.keys["s"] || this.keys["arrowdown"]) inputs.down = true;

    if (this.keys["j"]) inputs.punch = true;
    if (this.keys["k"]) inputs.kick = true;
    if (this.keys["l"]) inputs.grab = true;
    if (this.keys["i"]) inputs.special = true;
    if (this.keys["o"]) inputs.ultimate = true;
    if (this.keys["h"] || this.keys["s"]) inputs.block = true; // S is crouch/block or standalone H for block
    if (this.keys["q"]) inputs.sidestepLeft = true;
    if (this.keys["e"]) inputs.sidestepRight = true;

    // Space bar for dash (depending on horizontal input)
    if (this.keys[" "]) {
      if (inputs.left) inputs.dashLeft = true;
      if (inputs.right) inputs.dashRight = true;
    }

    // Virtual Joystick override
    if (this.virtualJoystick.active) {
      const dx = this.virtualJoystick.dirX;
      const dy = this.virtualJoystick.dirY;
      
      // Threshold
      if (dx < -0.3) inputs.left = true;
      if (dx > 0.3) inputs.right = true;
      if (dy < -0.3) inputs.up = true; // Y up is negative in standard touch drag coordinate delta
      if (dy > 0.3) inputs.down = true;
    }

    // Virtual button overrides
    if (this.buttonStates["punch"]) inputs.punch = true;
    if (this.buttonStates["kick"]) inputs.kick = true;
    if (this.buttonStates["block"]) inputs.block = true;
    if (this.buttonStates["grab"]) inputs.grab = true;
    if (this.buttonStates["special"]) inputs.special = true;
    if (this.buttonStates["ultimate"]) inputs.ultimate = true;
    if (this.buttonStates["dash"]) {
      if (inputs.left || this.virtualJoystick.dirX < -0.2) inputs.dashLeft = true;
      else if (inputs.right || this.virtualJoystick.dirX > 0.2) inputs.dashRight = true;
      else inputs.dashRight = true; // default forward dash
    }
    if (this.buttonStates["dodge"]) {
      if (inputs.left || this.virtualJoystick.dirX < -0.2) inputs.sidestepLeft = true;
      else if (inputs.right || this.virtualJoystick.dirX > 0.2) inputs.sidestepRight = true;
      else inputs.sidestepLeft = true; // default sidestep left
    }
    if (this.buttonStates["jump"]) inputs.up = true;

    // Gamepad controller support
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if (gp) {
      // D-Pad / Left Stick
      const stickX = gp.axes[0];
      const stickY = gp.axes[1];
      if (stickX < -0.4) inputs.left = true;
      if (stickX > 0.4) inputs.right = true;
      if (stickY < -0.4) inputs.up = true;
      if (stickY > 0.4) inputs.down = true;

      // Buttons (Xbox map standard: A=0/K, X=2/P, B=1/G, Y=3/S, LB=4/Block, RB=5/Dash, LT/RT=6/7/Ultimate)
      if (gp.buttons[2] && gp.buttons[2].pressed) inputs.punch = true;     // X button
      if (gp.buttons[0] && gp.buttons[0].pressed) inputs.kick = true;      // A button
      if (gp.buttons[1] && gp.buttons[1].pressed) inputs.grab = true;      // B button
      if (gp.buttons[3] && gp.buttons[3].pressed) inputs.special = true;   // Y button
      if (gp.buttons[4] && gp.buttons[4].pressed) inputs.block = true;     // LB
      if (gp.buttons[5] && gp.buttons[5].pressed) {                        // RB (dash)
        if (inputs.left) inputs.dashLeft = true;
        else inputs.dashRight = true;
      }
      if (gp.buttons[6] && gp.buttons[6].pressed) {                        // LT (sidestep)
        if (inputs.left) inputs.sidestepLeft = true;
        else inputs.sidestepRight = true;
      }
      if (gp.buttons[7] && gp.buttons[7].pressed) inputs.ultimate = true;  // RT
    }

    return inputs;
  }

  // Set virtual controls from touch interactions
  setVirtualButton(btnName, isPressed) {
    this.buttonStates[btnName] = isPressed;
    if (isPressed) this.lastInputTime = Date.now();
  }

  handleJoystickStart(x, y) {
    this.virtualJoystick.active = true;
    this.virtualJoystick.startX = x;
    this.virtualJoystick.startY = y;
    this.virtualJoystick.curX = x;
    this.virtualJoystick.curY = y;
    this.virtualJoystick.dirX = 0;
    this.virtualJoystick.dirY = 0;
    this.lastInputTime = Date.now();
  }

  handleJoystickMove(x, y) {
    if (!this.virtualJoystick.active) return;
    this.virtualJoystick.curX = x;
    this.virtualJoystick.curY = y;

    const dx = x - this.virtualJoystick.startX;
    const dy = y - this.virtualJoystick.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 60; // Max drag radius in pixels

    if (dist === 0) {
      this.virtualJoystick.dirX = 0;
      this.virtualJoystick.dirY = 0;
    } else {
      const clampDist = Math.min(dist, maxRadius);
      this.virtualJoystick.dirX = (dx / dist) * (clampDist / maxRadius);
      this.virtualJoystick.dirY = (dy / dist) * (clampDist / maxRadius);
    }
  }

  handleJoystickEnd() {
    this.virtualJoystick.active = false;
    this.virtualJoystick.dirX = 0;
    this.virtualJoystick.dirY = 0;
  }
}

window.GameInput = new InputManager();
