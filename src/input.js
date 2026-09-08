import { normalize } from './math.js';
export class Input {
  constructor(canvas, onPause) {
    this.keys = new Set(); this.touch = null; this.stick = document.querySelector('#joystick');
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code) && e.target.tagName !== 'BUTTON') e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat && ['KeyP','Escape'].includes(e.code)) onPause();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.clear());
    window.addEventListener('resize', () => this.clear());
    canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || this.touch) return; canvas.setPointerCapture(e.pointerId); this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; this.stick.style.cssText = `display:block;left:${e.clientX-canvas.getBoundingClientRect().left}px;top:${e.clientY-canvas.getBoundingClientRect().top}px`; });
    canvas.addEventListener('pointermove', e => { if (this.touch?.id !== e.pointerId) return; const dx = e.clientX - this.touch.x, dy = e.clientY - this.touch.y, d = Math.max(40, Math.hypot(dx, dy)); this.touch.dx = dx / d; this.touch.dy = dy / d; this.stick.firstElementChild.style.transform = `translate(${this.touch.dx * 34}px,${this.touch.dy * 34}px)`; });
    for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event, e => { if (this.touch?.id === e.pointerId) this.clear(); });
  }
  clear() { this.keys.clear(); this.touch = null; this.stick.style.display = 'none'; this.stick.firstElementChild.style.transform = ''; }
  vector() { if (this.touch) return { x: this.touch.dx, y: this.touch.dy }; const k = this.keys; return normalize(Number(k.has('KeyD') || k.has('ArrowRight')) - Number(k.has('KeyA') || k.has('ArrowLeft')), Number(k.has('KeyS') || k.has('ArrowDown')) - Number(k.has('KeyW') || k.has('ArrowUp'))); }
}
