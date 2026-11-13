import { expect, it } from 'vitest';
import { createJoystick, drag, joystickVector, press, release } from '../../src/logic/joystick';

it('ignores movement inside the dead zone', () => {
  const j = createJoystick(); press(j, 0, 0); drag(j, 3, 0);
  expect(joystickVector(j)).toEqual({ x: 0, y: 0 });
});
it('scales with distance up to the max radius', () => {
  const j = createJoystick(); press(j, 0, 0);
  drag(j, 64, 0); expect(joystickVector(j)).toEqual({ x: 1, y: 0 });
  drag(j, 16, 0); expect(joystickVector(j).x).toBeCloseTo(0.5, 2);
  drag(j, 30, 30); const v = joystickVector(j); expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1.0001);
});
it('release stops the stick', () => {
  const j = createJoystick(); press(j, 0, 0); drag(j, 40, 0); release(j);
  expect(joystickVector(j)).toEqual({ x: 0, y: 0 });
  expect(j.active).toBe(false);
});
it('dragging without a press does nothing', () => {
  const j = createJoystick(); drag(j, 40, 0);
  expect(joystickVector(j)).toEqual({ x: 0, y: 0 });
});
