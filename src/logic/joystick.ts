export interface JoystickState { active: boolean; ox: number; oy: number; px: number; py: number }

export function createJoystick(): JoystickState {
  return { active: false, ox: 0, oy: 0, px: 0, py: 0 };
}

export function press(s: JoystickState, x: number, y: number): void {
  s.active = true; s.ox = x; s.oy = y; s.px = x; s.py = y;
}

export function drag(s: JoystickState, x: number, y: number): void {
  if (!s.active) return;
  s.px = x; s.py = y;
}

export function release(s: JoystickState): void {
  s.active = false; s.px = s.ox; s.py = s.oy;
}

/** Direction with magnitude min(1, dist/maxRadius); zero inside the dead zone or when inactive. */
export function joystickVector(s: JoystickState, deadZone = 6, maxRadius = 32): { x: number; y: number } {
  if (!s.active) return { x: 0, y: 0 };
  const dx = s.px - s.ox, dy = s.py - s.oy;
  const dist = Math.hypot(dx, dy);
  if (dist <= deadZone) return { x: 0, y: 0 };
  const mag = Math.min(1, dist / maxRadius);
  return { x: (dx / dist) * mag, y: (dy / dist) * mag };
}
