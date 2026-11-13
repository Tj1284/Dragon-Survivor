/** Counters read by the debug commands and browser tests; they don't affect the game. */
export const weaponStats = { meteorVolley: 0, staticTargets: 0, staticMult: 1, staticCharge: 1 };

export function resetWeaponStats(): void {
  weaponStats.meteorVolley = 0; weaponStats.staticTargets = 0; weaponStats.staticMult = 1; weaponStats.staticCharge = 1;
}
