# Dragones nuevos, habilidades y gráficos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two new elements (poison, shadow) → 16 dragon forms, 6 new attacks with gold versions and ultimates, and procedural graphics polish.

**Architecture:** Elements are data (`ELEMENTS`, `LOOKS`, `COLORS`, i18n); forms, sheets and the collection derive from them. New status effects live as pure logic in `src/logic/combat.ts` and are applied by `EnemyManager`. Each new attack is one class in `src/game/weapons/`, numbers in `TABLE`/`GOLD` (`src/logic/attacks.ts`) and fixed numbers in `PLAYER_WEAPONS` (`src/config/balance.ts`). Graphics changes are visual only (`Juice`, `Decor`, `src/art/*`).

**Tech Stack:** Phaser 4.2.1, TypeScript 5.9.3, Vite 8, Vitest, Playwright e2e (`e2e/run.mjs`).

**Spec:** user request "mejora los gráficos, las habilidades, más dragones" + "dale" (opted out of questions). Decisions stated to the user: poison + shadow elements, 3 attacks each, procedural graphics polish, sprite prompts (done: `docs/PROMPTS_ASSETS.md`).

## Global Constraints

- User PNGs in `art/` keep overriding generated art; new sheets follow existing sizes: young 32, adult 48, legendary 64, 6 frames; icons 16×16.
- Every visible string goes through `t()` with `es` and `en` entries (i18n test enforces both).
- No synthesized audio (existing test). No new dependencies.
- Bosses: immune to freeze/stun/knockback/pull/execute; poison damage does apply to them.
- Perf: keep ≥ 55 fps headless with 300 enemies (`e2e` perf spec).
- Save stays tolerant: unknown forms are dropped, new forms accepted.

## Review Focus

1. Old saves with 10-form collections load and show `n/16` without crashing.
2. Poisoned enemy killed by poison tick triggers `onKilled` once (no double gold/xp) and plague spread does not recurse forever.
3. Execute (reaper) and pull (void rift) skip bosses.
4. Element picker with 5 cards fits a 390×844 portrait phone and 844×390 landscape.
5. Homing projectiles with no enemies left keep flying straight and expire.

---

### Task 1: Poison and shadow elements, 16 forms

**Files:** `src/logic/types.ts`, `src/art/dragon.ts`, `src/assets/manifest.ts`, `src/i18n.ts`, `src/scenes/CollectionScene.ts`, `src/scenes/LevelUpScene.ts` (layout only if needed), `src/game/weapons/Ultimate.ts` (exhaustive switch, temporary no-op for new elements), tests `tests/logic/evolution.test.ts`, `tests/logic/art.test.ts`, `tests/logic/save.test.ts`.

**Interfaces — Produces:** `Element = 'fire'|'ice'|'lightning'|'poison'|'shadow'`; `ELEMENTS` in that order; `COLORS.poison = 0x8fe04a`, `COLORS.shadow = 0xc23a6e`; i18n `el_poison` "Veneno"/"Poison" (d: "Envenena y contagia"/"Poisons and spreads"), `el_shadow` "Sombra"/"Shadow" (d: "Persigue, remata y absorbe"/"Seeks, executes and drains").

- [ ] Tests: `ALL_FORMS` has 16 unique ids incl. `legendary_shadow`; art test: the 5 adult looks are pairwise different; save: `{collection:['hatchling','young_poison','bogus']}` parses to `['hatchling','young_poison']`.
- [ ] Implement. Looks: poison `body 0x8a4fc2, belly 0xb8f07a, wing 0x4a2a78, membrane 0x8fe04a, horn 0xd8f8a0, accent 0x8fe04a, eye 0xe8ff9a`; shadow `body 0x34304a, belly 0x5a3f7a, wing 0x1a1824, membrane 0x8a1f3c, horn 0x9a90b0, accent 0xff3d7f, eye 0xff3d7f`. Tail tips: poison = drop, shadow = 3-px smoke wisps.
- [ ] Collection: `cols = landscape ? 8 : 4` (16 → 2 or 4 rows).
- [ ] Run `npm test`, `npx tsc --noEmit`; commit.

### Task 2: Poison status, plague and homing projectiles

**Files:** `src/logic/combat.ts`, `src/game/EnemyManager.ts`, `src/game/Projectiles.ts`, `tests/logic/combat.test.ts`.

**Interfaces — Produces:**
- `interface PoisonStatus { until: number; dps: number; acc: number }`, `newPoison()`, `applyPoison(s, dps, duration, now): PoisonStatus` (keeps the higher dps, extends `until` to `max(until, now+duration)`), `tickPoison(s, dt, now): { s: PoisonStatus; damage: number }` (accumulates `dps*dt`, releases damage in 0.5 s ticks; nothing after `until`).
- `Enemy.poison: PoisonStatus`; `EnemyManager.poison(e, dps, duration, now)`; `EnemyManager.plagueRadius = 0` (when > 0, a poisoned enemy that dies passes its poison to non-poisoned enemies within the radius; spread happens once per death, receivers get the remaining duration — no recursion beyond normal deaths); poisoned enemies tinted `0xb8ff9a`; tick source `'poison'`.
- `Projectile.homing?: number` (turn rate rad/s toward `enemies.nearest(x, y, 220)`; straight when none).

- [ ] Tests: `tickPoison` 4 dps over 1 s → 4 damage in two 2-dmg ticks; stops at `until`; `applyPoison` keeps max dps and extends.
- [ ] Implement; e2e debug `poisonedCount`.
- [ ] Run tests; commit.

### Task 3: Poison attacks

**Files:** create `src/game/weapons/PoisonBreath.ts`, `ToxicCloud.ts`, `VenomSpines.ts`; modify `attacks.ts`, `weapons/index.ts`, `Ultimate.ts`, `balance.ts`, `i18n.ts`, `src/art/items.ts` (fx `poison_glob` 8×2, `spine` 8×1; icons), `manifest.ts` (`FxKey`), `tests/logic/attacks.test.ts`.

Numbers (`TABLE`):

| id | damage | cooldown | count | radius | extra | key | offered |
|---|---|---|---|---|---|---|---|
| poison_breath | 9,11,11,14,14 | .8,.75,.75,.7,.65 | 1,1,2,2,3 | 4 | poison dps 4,5,6,7,8 | regen | no (breath) |
| toxic_cloud | dps 6,7,8,9,10 | 3,2.8,2.6,2.4,2.2 | 1 | 28,30,32,34,36 | duration 3,3,3.5,3.5,4 | armor | yes |
| venom_spines | 6,7,8,9,10 | 2.4,2.3,2.2,2.1,2 | 6,8,8,10,12 | 3 | poison dps 2,2,3,3,4 | fury | yes |

Gold: Plaga (poison_breath: extra×1.5, sets `plagueRadius = 48`), Pantano (toxic_cloud: radius×1.5, count 2, clouds slow 0.4), Erizo (venom_spines: pierce all + second burst 0.3 s later). Poison duration `PLAYER_WEAPONS.poison.duration = 3`. Poison dps goes through `weaponDamage`. Ultimate poison: all visible enemies get `ultimate.poisonDps = 20` for `ultimate.poisonTime = 5`.

- [ ] Tests: `attackParams('toxic_cloud', 5, true).radius === 54`, `.count === 2`; `spitToBreath({spit:3}, 'poison')` → `{poison_breath:3}`; `availableUpgrades` with element `poison` offers `toxic_cloud` and not `meteor`.
- [ ] Implement weapons, i18n names (Aliento venenoso, Nube tóxica, Púas venenosas, Plaga, Pantano, Erizo + en), art.
- [ ] e2e `e2e/elements.spec.mjs` (poison half): become `young_poison`, give clouds and spines, assert `poisonedCount > 0` and kills rise; screenshot `e2e/out/poison.png`.
- [ ] Run unit + e2e; commit.

### Task 4: Shadow attacks

**Files:** create `ShadowBreath.ts`, `Reaper.ts`, `VoidRift.ts`; same shared files as Task 3; fx `shadow_bolt` 10×2.

| id | damage | cooldown | count | radius | extra | key | offered |
|---|---|---|---|---|---|---|---|
| shadow_breath | 13,16,16,20,20 | .9,.85,.85,.8,.75 | 1,1,2,2,3 | 5 | homing 4 rad/s | regen | no |
| reaper | 18,22,26,30,36 | 2.5,2.4,2.3,2.2,2 | 1 | 44,48,52,56,60 | execute 0.1,0.12,0.14,0.16,0.2 | magnet | yes |
| void_rift | 20,24,28,32,40 | 4,3.7,3.4,3.1,2.8 | 1 | 40,44,48,52,56 | pull 40,45,50,55,60 px/s | quick_breath | yes |

Reaper: hits all in radius; non-boss survivors at ≤ extra×maxHp die. Void rift: opens on a random visible enemy, pulls non-boss enemies in radius for 1.5 s, then deals damage in radius. Gold: Eclipse (shadow_breath pierce 2, each kill heals 1 HP), Segadora (reaper extra 0.3 and a second swing 0.25 s later), Agujero negro (void_rift count 2, radius×1.3). Ultimate shadow: 40×damageMult to visible enemies, heals 15% max HP.

- [ ] Tests: `attackParams('reaper', 5, true).extra === 0.3`; `attackParams('void_rift', 1, true).radius === 52`.
- [ ] Implement; debug counters `weaponStats.executed`, `weaponStats.pulled`.
- [ ] e2e (shadow half): become `young_shadow`, give reaper + void_rift; `executed > 0`, `pulled > 0`, a boss is never executed; screenshot `e2e/out/shadow.png`.
- [ ] Run; commit.

### Task 5: Graphics polish

**Files:** `src/game/Juice.ts`, `src/game/Decor.ts`, `src/art/items.ts`, `src/art/dragon.ts`, `src/scenes/GameScene.ts`.

- Element particles around the dragon (fire embers rise, ice flakes fall, lightning sparks, poison bubbles, shadow smoke), rate grows with stage; hatchling none.
- Hit sparks tinted by the source attack's element (`tagOf` of `source` when it is an attack id; white otherwise).
- Short additive trails for player breath projectiles (shared emitter, ≤ 24 particles per frame).
- Ground: large soft patches (darker grass, dirt) per 192-px chunk under the decor, plus 32-px decor (bush, stump, mossy rock) — deterministic like `Decor`.
- Dragon art: belly stripes, rim light on the back, membrane gradient, eye highlight; legendary gets a glow ring in its element colour.
- [ ] Art test still passes (every frame visible, looks differ). Perf spec ≥ 55 fps.
- [ ] Look at screenshots of each element; commit.

### Task 6: Docs, artifact, review

- [ ] `docs/ASSETS.md`: new dragon, fx and icon files and the element list.
- [ ] Full `npm test`, `npm run e2e`, build; publish the artifact; independent reviewer on the branch; fix findings with tests.
