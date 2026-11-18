/** One captured thumb controls a 2D platformer's horizontal or ladder axis. */
export function createJoystick(host, { enabled, onChange }) {
  const abort = new AbortController(), signal = abort.signal;
  let pointer = null, center = null, axis = null;
  let offset = { x: 0, y: 0 }, axes = { move: 0, climb: 0 };
  const base = () => host.querySelector('[data-joystick]');

  function paint() {
    const element = base();
    if (!element) return;
    element.dataset.active = String(pointer !== null);
    element.style.setProperty('--stick-x', `${offset.x}px`);
    element.style.setProperty('--stick-y', `${offset.y}px`);
  }
  function publish(move, climb) {
    axes = { move, climb };
    onChange(axes);
  }
  function reset() {
    const previousPointer = pointer;
    pointer = null; center = null; axis = null;
    offset = { x: 0, y: 0 };
    publish(0, 0); paint();
    if (previousPointer !== null && host.hasPointerCapture(previousPointer)) {
      host.releasePointerCapture(previousPointer);
    }
  }
  function measure(element) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: Math.min(rect.width, rect.height) * .28 };
  }
  function update(event) {
    if (!center || center.radius <= 0) return reset();
    const dx = event.clientX - center.x, dy = event.clientY - center.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > center.radius ? center.radius / distance : 1;
    offset = { x: dx * scale, y: dy * scale };
    const magnitude = Math.min(1, distance / center.radius);
    if (magnitude <= .18) {
      axis = null; publish(0, 0);
    } else {
      // The level has two separate movement modes. Keeping one dominant axis
      // avoids repeatedly detaching from a ladder when the thumb wobbles.
      if (axis === null) axis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
      else if (axis === 'horizontal' && Math.abs(dy) > Math.abs(dx) * 1.2) axis = 'vertical';
      else if (axis === 'vertical' && Math.abs(dx) > Math.abs(dy) * 1.2) axis = 'horizontal';
      const strength = (magnitude - .18) / .82;
      publish(axis === 'horizontal' ? Math.sign(dx) * strength : 0,
        axis === 'vertical' ? -Math.sign(dy) * strength : 0);
    }
    paint();
  }
  host.addEventListener('pointerdown', event => {
    const element = event.target.closest('[data-joystick]');
    if (!element || !enabled() || event.button !== 0) return;
    event.preventDefault();
    if (pointer !== null) return;
    pointer = event.pointerId; center = measure(element);
    host.focus({ preventScroll: true });
    // The host survives a room render; capturing the replaced button would
    // discard the thumb in the middle of moving through an exit.
    host.setPointerCapture(pointer);
    update(event);
  }, { signal });
  window.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    if (!enabled()) return reset();
    event.preventDefault(); update(event);
  }, { signal, passive: false });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    window.addEventListener(name, event => {
      if (event.pointerId === pointer) reset();
    }, { signal });
  }
  host.addEventListener('contextmenu', event => {
    if (event.target.closest('[data-joystick]')) event.preventDefault();
  }, { signal });
  window.addEventListener('resize', reset, { signal });

  return {
    reset,
    rebind() {
      const element = base();
      if (!enabled() || !element) return reset();
      if (center) {
        const next = measure(element);
        if (Math.hypot(next.x - center.x, next.y - center.y) > 2 || Math.abs(next.radius - center.radius) > 1) return reset();
      }
      paint();
    },
    destroy() { reset(); abort.abort(); },
  };
}
