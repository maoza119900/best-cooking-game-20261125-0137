// Keyboard and mouse input for the kitchen: WASD / arrows to walk, E / Space to
// interact, M to mute, Enter to start or restart, and a click that walks the chef
// to a station (or interacts at once when already in reach).

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.interactPressed = false;
    this.mutePressed = false;
    this.confirmPressed = false;
    this.click = null;
    this.canvas = canvas;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('mousedown', this.onMouseDown);
  }

  /** Losing the window must not leave the chef walking forever. */
  onBlur() {
    this.keys.clear();
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === 'e' || key === ' ') {
      if (!event.repeat) this.interactPressed = true;
    }
    if (key === 'm' && !event.repeat) this.mutePressed = true;
    if (key === 'enter' && !event.repeat) this.confirmPressed = true;
    this.keys.add(key);
  }

  onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  onMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  /** The walk direction this frame, from the keys held down. */
  moveDirection() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    return { dx, dy };
  }

  /** Consume the one-frame flags after main.js has read them. */
  consume() {
    const out = {
      interact: this.interactPressed,
      mute: this.mutePressed,
      confirm: this.confirmPressed,
      click: this.click,
    };
    this.interactPressed = false;
    this.mutePressed = false;
    this.confirmPressed = false;
    this.click = null;
    return out;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
  }
}
