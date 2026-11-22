/** Counters read by the debug commands and browser tests; they don't affect the game. */
export const weaponStats = { tailSwings: 0, meteorVolley: 0, staticTargets: 0, staticMult: 1, staticCharge: 1, executed: 0, pulled: 0, healed: 0, clouds: 0, spines: 0 };

export function resetWeaponStats(): void {
  Object.assign(weaponStats, { tailSwings: 0, meteorVolley: 0, staticTargets: 0, staticMult: 1, staticCharge: 1, executed: 0, pulled: 0, healed: 0, clouds: 0, spines: 0 });
}
