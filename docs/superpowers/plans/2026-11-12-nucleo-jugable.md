# Dragones Survivors — Plan 1: Núcleo jugable

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** Una partida jugable de principio a fin con dibujos provisionales. El dragón se mueve, ataca solo, se come a los cazadragones, sube de nivel, elige mejoras y evoluciona en las 10 formas de los tres elementos hasta morir.

**Arquitectura:** Toda la lógica de reglas es TypeScript puro en `src/logic/`, sin Phaser, y está cubierta por tests unitarios con Vitest. La parte que pinta y mueve cosas en pantalla (`src/game/`, `src/scenes/`) usa Phaser y se comprueba con pruebas de navegador (Playwright) contra la build real. Para esas pruebas, `?debug=1` expone `window.__dbg`. Los assets se cargan a partir de un manifiesto y, si falta un PNG, se genera un provisional del mismo tamaño.

**Tecnologías:** Phaser 4.2.1, TypeScript 5.9.3, Vite 8.3.5, Vitest 5.0.5, Playwright (preinstalado en el entorno, `require('playwright')`), Node 22.

**Spec:** `docs/superpowers/specs/2026-11-12-dragones-survivors-design.md`

**Fuera de este plan** (van en planes posteriores):
- **Plan 2, "Partida completa y meta":** jefe del minuto 10 y victoria, menú, Guarida, Colección y guardado.
- **Plan 3, "Plataforma y publicación":** capa de plataforma con Bridge y CrazyGames, anuncios (revivir, duplicar oro, intersticial), pausa y silencio de la plataforma, idiomas desde la plataforma, sonido, empaquetado para el envío.

## Restricciones globales

- Resolución lógica: lado corto **270 px**. Lado largo = `round(270 × aspecto)`, acotado a [270, 600]. Horizontal y vertical. `pixelArt: true`, `roundPixels: true`.
- Los sprites miran a la derecha. Spritesheets en una fila horizontal, sin separación entre frames.
- Tamaños de frame: cría 24, joven 32, adulto 48, legendario 64. Enemigos de 24 a 32. Jefe 96.
- Niveles de evolución: **5 / 12 / 20**.
- El elemento se elige a partir de las mejoras escogidas. En empate gana el de la mejora más reciente. Si no hay ninguna de elemento, el jugador elige entre los tres. Una vez elegido, el elemento es fijo toda la partida.
- Rendimiento: objetivo de 60 fps con 300 enemigos y 200 proyectiles. Mínimo 30 fps estables.
- Build total menor de 10 MB. Primera pantalla jugable en menos de 5 s.
- Sin enlaces externos ni marcas propias en el juego.
- Todo texto visible pasa por `t(key)` (diccionarios `es` y `en`).
- Durante la partida no se crean ni destruyen objetos de enemigos, proyectiles o gemas: todo sale de pools.

## Riesgos a revisar (fallos probables que la spec no menciona)

1. **Cambiar de pestaña y volver:** el delta acumulado no debe teletransportar enemigos ni hacer daño de golpe. Delta acotado a 50 ms (test en la Tarea 4).
2. **Varias subidas de nivel de golpe** (gema grande, o cruzar 5 y 12 a la vez): una pantalla de mejora por nivel, en orden, y una sola animación de evolución hasta la etapa más alta (tests en las Tareas 2, 9 y 10).
3. **Sin mejoras disponibles** (todo al máximo): debe ofrecerse la opción de reserva (curar un 30 % y +5 de oro), nunca una pantalla vacía (test en la Tarea 3).
4. **Joystick "pegado":** si el dedo se suelta fuera del canvas o la ventana pierde el foco, el dragón tiene que parar (test en la Tarea 7).
5. **Girar el móvil o redimensionar a mitad de partida:** el tamaño del juego se recalcula y el HUD se recoloca (test en la Tarea 11).

---

## Estructura de archivos

```
dragones/
  index.html
  package.json  tsconfig.json  vite.config.ts
  public/assets/…               PNG reales del usuario (pueden faltar)
  docs/ASSETS.md                guía de assets para el usuario
  src/main.ts                   configuración de Phaser.Game y redimensionado
  src/debug.ts                  window.__dbg cuando ?debug=1
  src/i18n.ts                   t(key), diccionarios es/en
  src/config/balance.ts         todos los números de equilibrio
  src/assets/manifest.ts        definición de cada spritesheet
  src/logic/                    reglas puras, con tests
    types.ts rng.ts viewport.ts xp.ts evolution.ts upgrades.ts stats.ts
    spatialGrid.ts pool.ts combat.ts time.ts spawn.ts joystick.ts
  src/game/                     entidades y sistemas Phaser
    Player.ts InputController.ts EnemyManager.ts Projectiles.ts Pickups.ts
    weapons/ (Spit.ts FireBreath.ts IceBreath.ts LightningBreath.ts
              FireOrbit.ts FrostShards.ts ThunderStrike.ts Ultimate.ts)
    Evolution.ts Hud.ts placeholders.ts
  src/scenes/ BootScene.ts GameScene.ts LevelUpScene.ts GameOverScene.ts PauseScene.ts
  tests/logic/*.test.ts         Vitest
  e2e/run.mjs  e2e/*.spec.mjs   Playwright contra `vite preview`
  scripts/check-size.mjs
```

---

### Task 1: Proyecto base, tamaño de pantalla y pruebas de navegador

**Archivos:**
- Crear: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.ts`, `src/debug.ts`, `src/logic/viewport.ts`, `src/scenes/BootScene.ts`, `src/scenes/GameScene.ts` (stub), `e2e/run.mjs`, `e2e/smoke.spec.mjs`
- Test: `tests/logic/viewport.test.ts`

**Interfaces:**
- Produce:
  - `computeGameSize(viewW: number, viewH: number): { width: number; height: number }`.
  - `installDebug(game: Phaser.Game): void`, que crea `window.__dbg` solo con `?debug=1`.
  - `registerDebug(name: string, fn: (...args: any[]) => unknown): void`, para que las tareas posteriores añadan comandos.
  - `window.__dbg.ready: boolean`, que pasa a `true` al terminar `GameScene.create`.
  - Contrato de las pruebas de navegador: cada `e2e/*.spec.mjs` hace `export default async function (page, baseUrl)` y lanza un error si falla.
  - Scripts npm: `dev`, `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `e2e` (`npm run build && node e2e/run.mjs [filtro]`).

- [ ] **Paso 1:** `git init`. Crear `package.json` con dependencias fijadas: `phaser@4.2.1`; en desarrollo `typescript@5.9.3`, `vite@8.3.5`, `vitest@5.0.5`. `npm install`. `.gitignore` con `node_modules`, `dist`, `e2e/out`.
- [ ] **Paso 2: Escribir el test que falla**, `tests/logic/viewport.test.ts`:
```ts
expect(computeGameSize(1920,1080)).toEqual({width:480,height:270});
expect(computeGameSize(1080,1920)).toEqual({width:270,height:480});
expect(computeGameSize(2400,1080)).toEqual({width:600,height:270});
expect(computeGameSize(3000,1000)).toEqual({width:600,height:270}); // acotado
expect(computeGameSize(390,844)).toEqual({width:270,height:584});
expect(computeGameSize(1000,1000)).toEqual({width:270,height:270});
```
- [ ] **Paso 3:** `npx vitest run tests/logic/viewport.test.ts`. Se espera FAIL (módulo inexistente).
- [ ] **Paso 4:** Implementar `computeGameSize` en `src/logic/viewport.ts`.
- [ ] **Paso 5:** `npx vitest run`. Se espera PASS.
- [ ] **Paso 6:** `src/main.ts`:
  - Crea `Phaser.Game` con `type: AUTO`, `pixelArt: true`, `roundPixels: true`, `backgroundColor: '#1d1b2a'`, `scale.mode: FIT`, `autoCenter: CENTER_BOTH` y el tamaño de `computeGameSize(innerWidth, innerHeight)`.
  - En `window.resize` llama a `game.scale.setGameSize(...)` con el nuevo cálculo.
  - Escenas: `[BootScene, GameScene]`. `BootScene` pasa directamente a `GameScene`, que de momento solo pinta un texto y marca `__dbg.ready = true`.
- [ ] **Paso 7:** `e2e/run.mjs`:
  - Arranca `vite preview` en el puerto 4173 con la API de Vite (`import { preview } from 'vite'`) y lanza Chromium con `require('playwright')`.
  - Ejecuta en orden cada `e2e/*.spec.mjs` cuyo nombre contenga el filtro opcional. Cada uno en una página nueva de 960×540 con `deviceScaleFactor: 1`.
  - Recoge los errores de consola y hace fallar el spec si hay alguno. Imprime `PASS nombre` o `FAIL nombre: motivo`. El código de salida es distinto de 0 si algo falla.
- [ ] **Paso 8:** `e2e/smoke.spec.mjs`: abre `baseUrl + '/?debug=1'`, espera `window.__dbg?.ready === true` con un timeout de 5000 ms y comprueba que hay un `canvas`. Guarda una captura en `e2e/out/smoke.png`.
- [ ] **Paso 9:** `npm run e2e`. Se espera `PASS smoke.spec`.
- [ ] **Paso 10:** Commit: `chore: proyecto base Phaser 4 + Vite + pruebas`.

---

### Task 2: Tipos, RNG, experiencia y evolución

**Archivos:**
- Crear: `src/logic/types.ts`, `src/logic/rng.ts`, `src/logic/xp.ts`, `src/logic/evolution.ts`
- Test: `tests/logic/xp.test.ts`, `tests/logic/evolution.test.ts`, `tests/logic/rng.test.ts`

**Interfaces:**
- Produce:
```ts
export type Element = 'fire' | 'ice' | 'lightning';
export type Tag = Element | 'neutral';
export type Stage = 0 | 1 | 2 | 3;               // cría, joven, adulto, legendario
export type FormId = 'hatchling' | `${'young'|'adult'|'legendary'}_${Element}`;
export const ELEMENTS: readonly Element[];        // ['fire','ice','lightning']
export function createRng(seed: number): () => number;          // mulberry32, [0,1)
export function xpToNext(level: number): number;                // 5 + 4*(level-1)
export function applyXp(s: {level:number; xp:number}, gained: number): {level:number; xp:number; levelsGained:number};
export const EVOLUTION_LEVELS: readonly [5, 12, 20];
export function stageForLevel(level: number): Stage;
export function chooseElement(picks: readonly Tag[]): Element | 'choose';
export function formId(stage: Stage, element: Element | null): FormId; // stage>0 sin elemento → throw
export const ALL_FORMS: readonly FormId[];        // las 10
```

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
// rng: la misma semilla da la misma secuencia y todos los valores están en [0,1)
// xp
expect(xpToNext(1)).toBe(5); expect(xpToNext(5)).toBe(21);
expect(applyXp({level:1,xp:0},5)).toEqual({level:2,xp:0,levelsGained:1});
expect(applyXp({level:1,xp:3},40)).toEqual({level:4,xp:16,levelsGained:3});
expect(applyXp({level:3,xp:0},0)).toEqual({level:3,xp:0,levelsGained:0});
// evolución
expect([1,4,5,11,12,19,20,40].map(stageForLevel)).toEqual([0,0,1,1,2,2,3,3]);
expect(chooseElement(['fire','ice','fire','neutral'])).toBe('fire');
expect(chooseElement(['fire','ice'])).toBe('ice');                // empate: gana la más reciente
expect(chooseElement(['ice','fire','fire','ice'])).toBe('ice');
expect(chooseElement(['neutral','neutral'])).toBe('choose');
expect(chooseElement([])).toBe('choose');
expect(formId(0,null)).toBe('hatchling');
expect(formId(2,'ice')).toBe('adult_ice');
expect(() => formId(1,null)).toThrow();
expect(new Set(ALL_FORMS).size).toBe(10);
```
- [ ] **Paso 2:** `npx vitest run tests/logic`. Se espera FAIL.
- [ ] **Paso 3:** Implementar los cuatro módulos con las firmas de arriba.
- [ ] **Paso 4:** `npx vitest run tests/logic`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: reglas de experiencia y evolución`.

---

### Task 3: Mejoras y estadísticas

**Archivos:**
- Crear: `src/logic/upgrades.ts`, `src/logic/stats.ts`
- Test: `tests/logic/upgrades.test.ts`, `tests/logic/stats.test.ts`

**Interfaces:**
- Consume: `Element`, `Tag`, `Stage` (Tarea 2).
- Produce:
```ts
export type UpgradeId =
  | 'swift_wings' | 'thick_scales' | 'magnet' | 'fury' | 'quick_breath' | 'regen'   // neutral, pasivas
  | 'fire_orbit' | 'frost_shards' | 'thunder_strike'                                 // armas de elemento
  | 'ember_trail' | 'wider_flames' | 'searing' | 'fire_burst'                        // pasivas fuego
  | 'deep_chill' | 'shatter' | 'ice_armor' | 'frost_aura'                            // pasivas hielo
  | 'extra_jump' | 'static_charge' | 'overcharge' | 'spark_speed';                   // pasivas rayo
export interface UpgradeDef { id: UpgradeId; tag: Tag; kind: 'passive' | 'weapon'; maxLevel: number }
export const UPGRADES: readonly UpgradeDef[];
export type Owned = Partial<Record<UpgradeId, number>>;
export interface OfferContext { owned: Owned; element: Element | null }
export type Choice = { type: 'upgrade'; id: UpgradeId } | { type: 'fallback' };
export function availableUpgrades(ctx: OfferContext): UpgradeId[];
export function rollChoices(ctx: OfferContext, rng: () => number, count?: number): Choice[]; // count=3
export interface PlayerStats { maxHp:number; speed:number; damageMult:number; cooldownMult:number; pickupRadius:number; regen:number; armor:number }
export const BASE_STATS: PlayerStats;
export function computeStats(stage: Stage, owned: Owned): PlayerStats;
export const FALLBACK = { healFraction: 0.3, gold: 5 };
```

**Niveles máximos:** 5 para swift_wings, thick_scales, fury, quick_breath, las 3 armas, searing, ice_armor, extra_jump y spark_speed. 3 para todas las demás.

**Reglas de qué mejoras se ofrecen** (`availableUpgrades`):
- Se excluyen las que ya están al máximo.
- Una pasiva de elemento solo se ofrece si el jugador tiene el arma de ese elemento (`owned[arma] > 0`) o si su dragón es de ese elemento.
- Con el elemento ya fijado, se excluye todo lo de los otros dos elementos (armas y pasivas). Las armas de otro elemento que ya tenga siguen funcionando, pero no se ofrecen más niveles.

`rollChoices` devuelve hasta `count` ids distintos sin repetir. Si no hay ninguno disponible, devuelve `[{type:'fallback'}]`.

**Valores de `computeStats`:**
- `BASE_STATS = {maxHp:100, speed:70, damageMult:1, cooldownMult:1, pickupRadius:24, regen:0, armor:0}`.
- Bonus por etapa 0–3: vida máxima +0/+25/+50/+100, multiplicador de daño ×1/×1.3/×1.7/×2.3, radio de recogida +0/+8/+16/+24.
- Por cada nivel de mejora:
  - thick_scales: +20 de vida máxima.
  - swift_wings: velocidad × (1 + 0.08·n).
  - fury: daño × (1 + 0.1·n).
  - quick_breath: recarga × 0.92ⁿ.
  - magnet: radio de recogida × (1 + 0.2·n).
  - regen: +0.5 vida/s por nivel.
  - ice_armor: +1 de armadura por nivel.

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
const none = { owned: {}, element: null };
expect(availableUpgrades(none)).toEqual(expect.arrayContaining(['swift_wings','fire_orbit','frost_shards','thunder_strike']));
expect(availableUpgrades(none)).not.toContain('searing');                         // falta el arma de fuego
expect(availableUpgrades({ owned:{fire_orbit:1}, element:null })).toContain('searing');
expect(availableUpgrades({ owned:{}, element:'ice' })).toContain('shatter');
const iceCtx = { owned:{fire_orbit:2}, element:'ice' as const };
expect(availableUpgrades(iceCtx)).not.toContain('fire_orbit');
expect(availableUpgrades(iceCtx)).not.toContain('searing');
expect(availableUpgrades({ owned:{magnet:3}, element:null })).not.toContain('magnet');
const c = rollChoices(none, createRng(1)); expect(c).toHaveLength(3); expect(new Set(c.map(x=>JSON.stringify(x))).size).toBe(3);
// todo al máximo → reserva
const maxed = Object.fromEntries(UPGRADES.map(u=>[u.id,u.maxLevel]));
expect(rollChoices({ owned:maxed, element:'fire' }, createRng(1))).toEqual([{type:'fallback'}]);
// estadísticas
expect(computeStats(0,{})).toEqual(BASE_STATS);
const s = computeStats(2,{thick_scales:2, fury:3, quick_breath:1});
expect(s.maxHp).toBe(190); expect(s.damageMult).toBeCloseTo(2.21); expect(s.cooldownMult).toBeCloseTo(0.92);
```
- [ ] **Paso 2:** `npx vitest run tests/logic`. Se espera FAIL.
- [ ] **Paso 3:** Implementar `upgrades.ts` y `stats.ts` según las reglas de arriba.
- [ ] **Paso 4:** `npx vitest run tests/logic`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: mejoras y estadísticas del dragón`.

---

### Task 4: Cuadrícula espacial, pools, combate y tiempo

**Archivos:**
- Crear: `src/logic/spatialGrid.ts`, `src/logic/pool.ts`, `src/logic/combat.ts`, `src/logic/time.ts`
- Test: `tests/logic/spatialGrid.test.ts`, `tests/logic/pool.test.ts`, `tests/logic/combat.test.ts`, `tests/logic/time.test.ts`

**Interfaces:**
- Produce:
```ts
export class SpatialGrid {
  constructor(cellSize: number);
  clear(): void;
  insert(id: number, x: number, y: number): void;
  queryRadius(x: number, y: number, r: number, out: number[]): number[]; // vacía `out`, distancia exacta ≤ r
}
export class Pool<T> {
  constructor(create: () => T, reset: (item: T) => void);
  acquire(): T; release(item: T): void; readonly activeCount: number;
}
export interface Point { id: number; x: number; y: number }
export function chainTargets(origin: {x:number;y:number}, candidates: readonly Point[], maxJumps: number, range: number): number[];
export function armorReduce(damage: number, armor: number): number;        // max(1, damage - armor)
export interface IceStatus { hitTimes: number[]; slowUntil: number; frozenUntil: number }
export function newIceStatus(): IceStatus;
export function registerIceHit(s: IceStatus, now: number, slowDuration?: number /*2*/): IceStatus;
//   3 golpes en una ventana de 2 s → frozenUntil = now + 1.5 y se vacía hitTimes
export function damageMultiplier(s: IceStatus, now: number, shatterLevel: number): number; // congelado: 1.5 + 0.25*nivel; si no, 1
export function clampDelta(ms: number): number;                              // min(ms, 50)
```
`chainTargets`: algoritmo voraz. Desde el punto actual salta al candidato más cercano aún no golpeado que esté a `range` o menos. Para cuando no queda ninguno o se alcanza `maxJumps`. El primer objetivo cuenta como salto.

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
const g = new SpatialGrid(32); g.insert(1,0,0); g.insert(2,10,0); g.insert(3,100,0); g.insert(4,-20,-5);
expect(g.queryRadius(0,0,25,[]).sort()).toEqual([1,2,4]);
const out=[99]; g.queryRadius(100,0,1,out); expect(out).toEqual([3]);
// pool: reutiliza el objeto y llama a reset; activeCount sube y baja
const pts=[{id:1,x:10,y:0},{id:2,x:30,y:0},{id:3,x:200,y:0},{id:4,x:50,y:0}];
expect(chainTargets({x:0,y:0},pts,3,60)).toEqual([1,2,4]);
expect(chainTargets({x:0,y:0},pts,10,60)).toEqual([1,2,4]);           // la 3 queda fuera de alcance
expect(chainTargets({x:0,y:0},[],3,60)).toEqual([]);
expect(armorReduce(5,10)).toBe(1); expect(armorReduce(12,2)).toBe(10);
let s=newIceStatus(); s=registerIceHit(s,0); s=registerIceHit(s,1);
expect(damageMultiplier(s,1,0)).toBe(1); expect(s.slowUntil).toBe(3);
s=registerIceHit(s,1.5); expect(s.frozenUntil).toBe(3); expect(damageMultiplier(s,2,2)).toBe(2);
let t=newIceStatus(); t=registerIceHit(t,0); t=registerIceHit(t,1); t=registerIceHit(t,3); expect(t.frozenUntil).toBe(0); // fuera de la ventana
expect(clampDelta(16)).toBe(16); expect(clampDelta(5000)).toBe(50);
```
- [ ] **Paso 2:** `npx vitest run tests/logic`. Se espera FAIL.
- [ ] **Paso 3:** Implementar. La cuadrícula guarda las posiciones en arrays planos indexados por celda (`Map<number, number[]>` con clave `cx*73856093 ^ cy*19349663`) y las reutiliza tras `clear()`.
- [ ] **Paso 4:** `npx vitest run tests/logic`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: cuadrícula espacial, pools y reglas de combate`.

---

### Task 5: Enemigos (datos) y director de oleadas

**Archivos:**
- Crear: `src/config/balance.ts`, `src/logic/spawn.ts`
- Test: `tests/logic/spawn.test.ts`

**Interfaces:**
- Produce:
```ts
export type EnemyTypeId = 'squire' | 'archer' | 'lancer' | 'netter' | 'heavy' | 'cleric';
export interface EnemyDef { id: EnemyTypeId; hp: number; speed: number; damage: number; unlockAt: number; weight: number; xp: number; radius: number }
export const ENEMIES: Record<EnemyTypeId, EnemyDef>;
export function targetAlive(tSeconds: number): number;     // min(300, floor(15 + 0.5*t))
export function hpMult(tSeconds: number): number;          // 1 + t/180
export function pickEnemyType(tSeconds: number, rng: () => number): EnemyTypeId;   // ponderado entre los desbloqueados
export function spawnPosition(cx: number, cy: number, viewW: number, viewH: number, rng: () => number): {x:number;y:number}; // anillo de radio hypot(w,h)/2 + 20
```

**Tabla de enemigos** (vida / velocidad / daño / desbloqueo en s / peso / xp / radio):

| Enemigo | Vida | Velocidad | Daño | Desbloqueo | Peso | XP | Radio |
|---|---|---|---|---|---|---|---|
| squire | 12 | 30 | 5 | 0 | 10 | 1 | 8 |
| archer | 10 | 25 | 6 | 60 | 4 | 1 | 8 |
| lancer | 20 | 30 | 8 | 120 | 3 | 2 | 10 |
| netter | 15 | 28 | 0 | 180 | 2 | 2 | 8 |
| heavy | 80 | 20 | 12 | 240 | 2 | 5 | 12 |
| cleric | 25 | 24 | 0 | 300 | 1 | 3 | 8 |

`balance.ts` reúne además todos los números de la Tarea 10 y del jugador para poder ajustarlos en un solo sitio.

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
expect(targetAlive(0)).toBe(15); expect(targetAlive(100)).toBe(65); expect(targetAlive(600)).toBe(300);
expect(hpMult(180)).toBe(2);
const r=createRng(7); for(let i=0;i<200;i++) expect(pickEnemyType(0,r)).toBe('squire');
const seen=new Set<string>(); const r2=createRng(7); for(let i=0;i<2000;i++) seen.add(pickEnemyType(300,r2)); expect(seen.size).toBe(6);
const p=spawnPosition(100,50,480,270,createRng(3)); expect(Math.hypot(p.x-100,p.y-50)).toBeCloseTo(Math.hypot(480,270)/2+20,3);
```
- [ ] **Paso 2:** `npx vitest run tests/logic`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npx vitest run tests/logic`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: tabla de enemigos y director de oleadas`.

---

### Task 6: Manifiesto de assets, provisionales y guía para el artista

**Archivos:**
- Crear: `src/assets/manifest.ts`, `src/game/placeholders.ts`, `docs/ASSETS.md`
- Modificar: `src/scenes/BootScene.ts`
- Test: `tests/logic/manifest.test.ts`, `e2e/assets.spec.mjs`

**Interfaces:**
- Consume: `FormId`, `ALL_FORMS`, `UpgradeId`, `UPGRADES`, `EnemyTypeId`.
- Produce:
```ts
export interface SheetDef { key: string; path: string; frameWidth: number; frameHeight: number; frames: number; color: number }
export const DRAGON_SHEETS: Record<FormId, SheetDef>;      // key = formId, path = `assets/dragons/${formId}.png`
export const ENEMY_SHEETS: Record<EnemyTypeId | 'boss', SheetDef>;   // `assets/enemies/${id}.png`
export const FX_SHEETS: Record<'spit'|'fire_zone'|'ice_shard'|'lightning_bolt'|'arrow'|'net'|'fire_orb', SheetDef>; // `assets/fx/`
export const PICKUP_SHEETS: Record<'gem_s'|'gem_m'|'gem_l'|'gold', SheetDef>;   // `assets/pickups/`
export const ICON_SHEETS: Record<UpgradeId, SheetDef>;     // `assets/icons/${id}.png`, 16×16, 1 frame
export const GROUND: SheetDef;                             // `assets/tiles/ground.png`, 32×32, 1 frame
export const ALL_SHEETS: readonly SheetDef[];
export const COLORS: Record<Tag, number>;  // fire 0xe8542a, ice 0x6cc6f0, lightning 0xf5d742, neutral 0xb08cff
export function makePlaceholder(scene: Phaser.Scene, def: SheetDef): void; // crea la textura `def.key` con `frames` frames numerados
```

**Tamaños:**
- Dragones (6 frames): hatchling 24, young_* 32, adult_* 48, legendary_* 64.
- Enemigos (4 frames): squire, archer, netter y cleric 24; lancer y heavy 32; boss 96.
- Efectos: spit 8×8 (2 frames), fire_zone 32×32 (4), ice_shard 8×8 (2), lightning_bolt 16×16 (3), arrow 8×8 (1), net 16×16 (1), fire_orb 12×12 (2).
- Recogibles: gem_s 6, gem_m 8, gem_l 10 (1 frame cada uno); gold 8 (2 frames).

**Comportamiento de `BootScene`:**
- Pone en cola `load.spritesheet` para cada `ALL_SHEETS`. Las claves que den `loaderror` se apuntan.
- Al terminar la carga, llama a `makePlaceholder` para cada clave que falte.
- Crea una animación `${key}_loop` (8 fps, repetición infinita) para cada hoja de más de un frame.
- Pasa a `GameScene`.
- Registra en debug `textures()`, que devuelve `{key, frames, w, h, placeholder:boolean}[]`.

**Cómo es un provisional:** un rectángulo redondeado del color del manifiesto, con un borde más oscuro, un "ojo" blanco en el lado derecho (para que se vea hacia dónde mira) y una ligera variación de brillo por frame (para que se note la animación).

`docs/ASSETS.md` es la guía para el usuario:
- Formato: PNG con transparencia, una fila por animación, sin separación entre frames, mirando a la derecha, pixel art sin suavizado.
- Una tabla con **cada ruta del manifiesto**, su tamaño de frame y su número de frames.
- Cómo sustituir un provisional: dejar el PNG en `public/assets/...` con ese nombre exacto y recargar.

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
expect(Object.keys(DRAGON_SHEETS)).toHaveLength(10);
expect(DRAGON_SHEETS.hatchling.frameWidth).toBe(24); expect(DRAGON_SHEETS.adult_ice.frameWidth).toBe(48); expect(DRAGON_SHEETS.legendary_lightning.frameHeight).toBe(64);
expect(new Set(ALL_SHEETS.map(s=>s.key)).size).toBe(ALL_SHEETS.length);
for (const u of UPGRADES) expect(ICON_SHEETS[u.id]).toBeDefined();
const doc = readFileSync('docs/ASSETS.md','utf8'); for (const s of ALL_SHEETS) expect(doc).toContain(s.path);
```
Prueba de navegador `assets.spec.mjs`: con `?debug=1`, `__dbg.textures()` contiene todas las claves del manifiesto con su `frames`, `w` y `h`, y todas tienen `placeholder: true` (todavía no hay PNG reales).
- [ ] **Paso 2:** `npx vitest run tests/logic/manifest.test.ts`. Se espera FAIL.
- [ ] **Paso 3:** Implementar el manifiesto, los provisionales, `BootScene` y `docs/ASSETS.md`.
- [ ] **Paso 4:** `npx vitest run` y `npm run e2e assets`. Se espera PASS en los dos.
- [ ] **Paso 5:** Commit: `feat: manifiesto de assets con provisionales y guía para el artista`.

---

### Task 7: Dragón, movimiento, joystick y mundo infinito

**Archivos:**
- Crear: `src/logic/joystick.ts`, `src/game/InputController.ts`, `src/game/Player.ts`
- Modificar: `src/scenes/GameScene.ts`
- Test: `tests/logic/joystick.test.ts`, `e2e/movement.spec.mjs`

**Interfaces:**
- Consume: `computeStats`, `clampDelta`, `DRAGON_SHEETS`, `GROUND`, `registerDebug`.
- Produce:
```ts
export interface JoystickState { active: boolean; ox: number; oy: number; px: number; py: number }
export function createJoystick(): JoystickState;
export function press(s: JoystickState, x: number, y: number): void;
export function drag(s: JoystickState, x: number, y: number): void;
export function release(s: JoystickState): void;
export function joystickVector(s: JoystickState, deadZone?: number /*6*/, maxRadius?: number /*32*/): { x: number; y: number }; // magnitud ≤ 1
export class InputController { constructor(scene: Phaser.Scene); readonly joystick: JoystickState; moveVector(): {x:number;y:number}; destroy(): void }
export class Player {
  constructor(scene: Phaser.Scene, x: number, y: number);
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number; y: number; hp: number; stats: PlayerStats; formId: FormId; slowUntil: number;
  setForm(id: FormId): void;            // cambia textura y animación, y ajusta el radio de colisión a frameWidth*0.35
  get radius(): number;
  update(dt: number, move: {x:number;y:number}, now: number): void;   // velocidad × 0.5 si now < slowUntil; aplica regen
  damage(amount: number): void;         // aplica armorReduce y no baja de 0
}
```
- `InputController`: WASD y flechas, normalizado en diagonal. Si el joystick está activo tiene prioridad. Llama a `release` en `pointerup`, `pointerupoutside`, en `game.events` `blur`/`hidden` y en `visibilitychange`.
- `GameScene`: un `TileSprite` de `GROUND` a pantalla completa, fijo a la cámara (`scrollFactor 0`), con `tilePosition` igual al scroll de la cámara. La cámara sigue al dragón. El sprite mira hacia donde se mueve (`flipX` cuando x < 0). Cada frame usa `dt = clampDelta(delta)/1000`.
- Debug: `player()` devuelve `{x, y, hp, maxHp, level, formId, element}` (level y element los rellena la Tarea 9), `joystick()` devuelve el estado y `blur()` emite `game.events.emit('blur')`.

- [ ] **Paso 1: Escribir los tests que fallan.**
```ts
const j=createJoystick(); press(j,0,0); drag(j,3,0); expect(joystickVector(j)).toEqual({x:0,y:0});
drag(j,64,0); expect(joystickVector(j)).toEqual({x:1,y:0});
drag(j,16,0); expect(joystickVector(j).x).toBeCloseTo(0.5,2);    // magnitud = min(1, dist/maxRadius) si dist > deadZone; si no, 0
drag(j,30,30); const v=joystickVector(j); expect(Math.hypot(v.x,v.y)).toBeLessThanOrEqual(1.0001);
release(j); expect(joystickVector(j)).toEqual({x:0,y:0}); expect(j.active).toBe(false);
```
Prueba de navegador `movement.spec.mjs`:
- Mantener `d` 1000 ms: `player().x` aumenta entre 50 y 90 (velocidad 70).
- Pulsar con el ratón en (300,200), arrastrar a (340,200) **sin soltar** y llamar a `__dbg.blur()`: `joystick().active === false` y la x deja de cambiar durante 300 ms (riesgo 4).
- [ ] **Paso 2:** `npx vitest run tests/logic/joystick.test.ts`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npx vitest run` y `npm run e2e movement`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: movimiento del dragón con teclado y joystick`.

---

### Task 8: Enemigos en pantalla, daño al dragón y fin de partida

**Archivos:**
- Crear: `src/game/EnemyManager.ts`, `src/game/Projectiles.ts`, `src/scenes/GameOverScene.ts`, `src/i18n.ts`
- Modificar: `src/scenes/GameScene.ts`, `src/main.ts` (registrar escenas)
- Test: `tests/logic/i18n.test.ts`, `e2e/enemies.spec.mjs`

**Interfaces:**
- Consume: `ENEMIES`, `targetAlive`, `hpMult`, `pickEnemyType`, `spawnPosition`, `SpatialGrid`, `Pool`, `armorReduce`, `newIceStatus`, `damageMultiplier`, `Player`.
- Produce:
```ts
export interface Enemy { id: number; type: EnemyTypeId; x: number; y: number; hp: number; maxHp: number; alive: boolean;
  sprite: Phaser.GameObjects.Sprite; ice: IceStatus; hitCooldowns: Map<string, number>; state: string; timer: number }
export class EnemyManager {
  constructor(scene: Phaser.Scene, rng: () => number);
  readonly grid: SpatialGrid;           // reconstruida cada frame con los vivos
  readonly active: Enemy[];
  update(dt: number, now: number, elapsed: number, player: Player, projectiles: Projectiles): void;
  spawn(type: EnemyTypeId, x: number, y: number, elapsed: number): Enemy;
  hit(e: Enemy, damage: number, now: number): boolean;      // aplica damageMultiplier del hielo; true si muere
  onKilled: (e: Enemy) => void;                             // lo asignan otros sistemas (gemas y oro)
  nearest(x: number, y: number, maxRange: number): Enemy | null;
  inRadius(x: number, y: number, r: number, out: Enemy[]): Enemy[];
}
export type ProjectileOwner = 'player' | 'enemy';
export interface Projectile { x:number; y:number; vx:number; vy:number; damage:number; radius:number; life:number; owner: ProjectileOwner;
  key: string; pierce: number; onHit?: (target: Enemy | Player, p: Projectile) => void; alive: boolean; sprite: Phaser.GameObjects.Sprite }
export class Projectiles {
  constructor(scene: Phaser.Scene);
  fire(opts: Omit<Projectile, 'alive' | 'sprite'>): Projectile;
  update(dt: number, enemies: EnemyManager, player: Player, now: number): void;   // contra enemigos o contra el jugador según el dueño
  readonly activeCount: number;
}
export function t(key: string, vars?: Record<string, string | number>): string;
export function setLanguage(lang: string): void;   // 'es' por defecto; cualquier idioma desconocido → 'en'
```

**Comportamiento de cada enemigo:**
- **squire y heavy:** persiguen al dragón.
- **archer:** se mantiene a unos 120 px. Cada 2.5 s dispara una flecha a 90 px/s con 6 de daño.
- **lancer:** a menos de 100 px se prepara 0.4 s (parpadea) y embiste a 140 px/s durante 0.6 s. Luego vuelve a perseguir.
- **netter:** a menos de 110 px lanza una red cada 4 s (proyectil `net`). Si acierta, `player.slowUntil = now + 1.5`.
- **cleric:** se mantiene a unos 80 px. Cada 2 s cura 5 a los aliados a 60 px o menos.

**Reglas generales:**
- **Daño por contacto:** si la distancia es menor que `e.radius + player.radius`, cada enemigo puede dañar como mucho una vez cada 0.5 s.
- **Separación:** cada enemigo se aparta de hasta 4 vecinos a menos de 10 px, usando la cuadrícula.
- **Enemigos lejanos:** los que estén a más de 1.5 × el radio de aparición se recolocan en el anillo.
- **Generación:** se mantiene `targetAlive(elapsed)`, con un máximo de 10 apariciones por frame. La vida escala con `hpMult(elapsed)`.
- **Muerte del dragón:** `scene.start('GameOver', {time, level, formId, gold})`. `GameOverScene` muestra tiempo, nivel, forma (sprite) y oro, con un botón grande "Otra vez" (`t('again')`) que reinicia `GameScene`.

**Debug:**
- `spawn(type, n, dist=40)`: crea n enemigos alrededor del dragón a esa distancia.
- `enemies()`: devuelve el número de enemigos.
- `setHp(n)`.
- `pauseSpawns(bool)`: para que las pruebas controlen el número de enemigos.
- `scene()`: devuelve las claves de las escenas activas.

- [ ] **Paso 1: Escribir los tests que fallan** (i18n):
```ts
setLanguage('es'); expect(t('again')).toBe('Otra vez');
setLanguage('fr'); expect(t('again')).toBe('Again');
expect(t('no_such_key')).toBe('no_such_key');
setLanguage('es'); expect(t('level_n',{n:3})).toBe('Nivel 3');
```
Prueba de navegador `enemies.spec.mjs`:
- `pauseSpawns(true)`, `spawn('squire',5,20)`, esperar 2 s: `player().hp < 100`.
- `setHp(1)`, `spawn('heavy',3,10)`: en menos de 3 s `scene()` incluye `'GameOver'`. Hacer clic en "Otra vez" → `GameScene` activa y `player().hp === 100`.
- Con los spawns activados y `elapsed` adelantado por debug a 300 s (`__dbg.setElapsed(300)`), en 10 s aparecen al menos 4 tipos distintos (`__dbg.enemyTypes()`).
- [ ] **Paso 2:** `npx vitest run tests/logic/i18n.test.ts`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npx vitest run` y `npm run e2e enemies`. Se espera PASS.
- [ ] **Paso 5:** Commit: `feat: cazadragones, daño y fin de partida`.

---

### Task 9: Ataque base, gemas, oro y pantalla de mejoras

**Archivos:**
- Crear: `src/game/weapons/Spit.ts`, `src/game/Pickups.ts`, `src/scenes/LevelUpScene.ts`
- Modificar: `src/scenes/GameScene.ts`, `src/i18n.ts` (nombres y descripciones de las 21 mejoras y de la opción de reserva, en es/en)
- Test: `e2e/levelup.spec.mjs`

**Interfaces:**
- Consume: `applyXp`, `rollChoices`, `computeStats`, `FALLBACK`, `ICON_SHEETS`, `PICKUP_SHEETS`, `EnemyManager.onKilled`, `Projectiles.fire`.
- Produce:
```ts
export interface Weapon { update(dt: number, now: number): void; destroy(): void }
export interface WeaponCtx { scene: Phaser.Scene; player: Player; enemies: EnemyManager; projectiles: Projectiles; run: RunState }
export interface RunState { level: number; xp: number; gold: number; elapsed: number; owned: Owned; picks: Tag[];
  element: Element | null; stage: Stage; pendingLevels: number }
export class Spit implements Weapon { constructor(ctx: WeaponCtx) }
export class Pickups { constructor(scene: Phaser.Scene); dropGem(x:number, y:number, xp:number): void; dropGold(x:number, y:number): void;
  update(dt: number, player: Player, onXp: (n:number)=>void, onGold: (n:number)=>void): void; readonly activeCount: number }
// LevelUpScene: scene.launch('LevelUp', { mode: 'upgrade', choices: Choice[] } | { mode: 'element' })
//   emite en game.events: 'levelup:picked' (Choice) | 'element:picked' (Element)
```
- **Spit:** cada `0.8 × cooldownMult` s dispara al enemigo más cercano a 160 px o menos. Velocidad 220, daño `10 × damageMult`, `pierce 0`, textura `spit`.
- **Gemas:** xp 1 → `gem_s`, 2–4 → `gem_m`, 5 o más → `gem_l`. El oro cae con un 10 % de probabilidad por muerte (1 de oro). Dentro de `pickupRadius` el recogible vuela hacia el dragón a 200 px/s y se recoge a menos de 6 px.
- **Flujo al subir de nivel en `GameScene`:**
  1. Al ganar xp, `applyXp`, y `pendingLevels += levelsGained`.
  2. Mientras `pendingLevels > 0`: pausar `GameScene`, lanzar `LevelUp` con `rollChoices` y esperar la elección.
  3. Con la elección: `owned[id]++`, añadir el `tag` a `picks`, recalcular estadísticas y, si sube la vida máxima, sumar la diferencia a la vida actual. La reserva cura `FALLBACK.healFraction × maxHp` y da `+FALLBACK.gold` de oro.
  4. `pendingLevels--`. Cuando llega a 0 se reanuda la partida.
  5. Gancho `afterLevelResolved()`, vacío aquí. Lo usa la Tarea 10.
- **LevelUpScene:** 3 tarjetas grandes en fila (horizontal) o en columna (vertical). Cada una con icono, nombre, nivel siguiente y una línea de descripción. El color del borde es el del `tag`, para que se vea a qué elemento empuja. Se elige con clic, toque o las teclas 1–3. El modo `element` muestra 3 tarjetas: Fuego, Hielo y Rayo.
- **Debug:**
  - `addXp(n)`.
  - `run()`: devuelve una copia de `RunState`.
  - `give(id)`: suma un nivel de mejora sin pantalla y añade el tag a `picks`.
  - `pick(i)`: equivale a pulsar la tarjeta i.

- [ ] **Paso 1: Escribir la prueba de navegador que falla**, `levelup.spec.mjs`:
  - `pauseSpawns(true)`; `addXp(5)`: `scene()` incluye `'LevelUp'` y hay 3 tarjetas (`__dbg.cards()` devuelve 3 elementos).
  - Pulsar la tecla `1`: `run().level === 2` y `scene()` ya no incluye `'LevelUp'`.
  - `addXp(43)`, con lo que se ganan varios niveles (riesgo 2): se resuelven `levelsGained` pantallas seguidas con `pick(0)` y al final `run().pendingLevels === 0`, `run().level` es el esperado según `applyXp` y la partida se reanuda.
  - `spawn('squire',1,40)` con la vida del enemigo en 1 (`__dbg.setEnemyHp`), esperar 1.5 s: `enemies() === 0` y `__dbg.pickups() >= 1`. Esperar a que el dragón la recoja (mover el dragón a la posición de la gema con `__dbg.teleport(x, y)`): `run().xp` aumenta.
- [ ] **Paso 2:** `npm run e2e levelup`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npx vitest run` y `npm run e2e`. Se espera PASS en todo.
- [ ] **Paso 5:** Commit: `feat: ataque base, recogibles y pantalla de mejoras`.

---

### Task 10: Evolución, alientos de elemento, armas y ataque definitivo

**Archivos:**
- Crear: `src/game/Evolution.ts`, `src/game/weapons/FireBreath.ts`, `IceBreath.ts`, `LightningBreath.ts`, `FireOrbit.ts`, `FrostShards.ts`, `ThunderStrike.ts`, `Ultimate.ts`
- Modificar: `src/scenes/GameScene.ts` (rellenar `afterLevelResolved`), `src/config/balance.ts`
- Test: `e2e/evolution.spec.mjs`

**Interfaces:**
- Consume: `stageForLevel`, `chooseElement`, `formId`, `registerIceHit`, `damageMultiplier`, `chainTargets`, `WeaponCtx`, `Weapon`, `LevelUpScene` en modo `element`.
- Produce:
```ts
export class Evolution {
  constructor(ctx: WeaponCtx, onElementNeeded: () => Promise<Element>);
  check(): Promise<boolean>;       // true si ha evolucionado; salta directamente a la etapa más alta alcanzada con UNA sola animación
}
export function createBreath(ctx: WeaponCtx, element: Element): Weapon;
export function createElementWeapon(ctx: WeaponCtx, id: 'fire_orbit' | 'frost_shards' | 'thunder_strike'): Weapon;
export function createUltimate(ctx: WeaponCtx, element: Element): Weapon;
```

**Al evolucionar:**
1. Pausa de 0.8 s.
2. Destello blanco en el sprite, cambio con `setForm`, escala animada de 1.4 a 1 y explosión de partículas del color del elemento.
3. Onda que empuja 60 px hacia fuera a los enemigos a 100 px o menos.
4. Recalcular estadísticas con la nueva etapa.
5. En la primera evolución, el aliento del elemento sustituye a `Spit`.
6. En la etapa 3, se añade `createUltimate`.

**Números** (en `balance.ts`; n = nivel de la mejora, `dmg ×= damageMult`):
- **Aliento de fuego:** cada 0.9 s, proyectil a 180 px/s con 14 de daño. Al impactar o caducar crea una zona de fuego:
  - Radio: 18 × (1 + 0.15·wider_flames).
  - Dura 2 + 0.5·ember_trail s.
  - Hace 5 × (1 + 0.25·searing) de daño cada 0.5 s a los enemigos dentro.
  - Máximo 40 zonas a la vez; con más, se recicla la más antigua.
- **fire_burst:** al matar, un 10 %·n de probabilidad de explosión de 24 px con 10 de daño.
- **Aliento de hielo:** cada 0.8 s, 3 fragmentos en abanico de 15° a 200 px/s, con 8 de daño. Cada impacto llama a `registerIceHit`.
  - Ralentización: 40 % + 10 %·deep_chill.
  - El daño recibido por un enemigo se multiplica por `damageMultiplier(..., shatter)`.
- **frost_aura:** los enemigos a 40 px o menos se ralentizan un 20 %·n (máximo 60 %).
- **Aliento de rayo:** cada `0.9 × 0.9^spark_speed` s, rayo instantáneo al enemigo más cercano a 140 px o menos, con 12 de daño.
  - Encadena con `chainTargets(…, 2 + etapa + extra_jump, 60 × (1 + 0.15·static_charge))`.
  - Cada salto hace el daño del anterior × min(0.95, 0.7 + 0.1·overcharge).
  - Se dibuja como una línea quebrada durante 0.12 s.
- **fire_orbit:** n orbes a 36 px que giran a 2 rad/s, con 6 de daño. Cada orbe puede golpear al mismo enemigo como mucho una vez cada 0.5 s.
- **frost_shards:** cada 2 s, n+1 fragmentos en direcciones aleatorias, con 7 de daño y efecto de hielo.
- **thunder_strike:** cada (3.5 − 0.3·n) s, impacta a un enemigo aleatorio visible, con 20 de daño en un radio de 16.
- **Ataque definitivo** (etapa 3, cada 20 s):
  - Fuego: nova de 120 px con 80 de daño.
  - Hielo: congela 3 s a todos los enemigos visibles.
  - Rayo: 12 rayos sobre enemigos aleatorios visibles, con 60 de daño cada uno.

**Elección del elemento:** si `chooseElement(picks) === 'choose'`, `onElementNeeded` lanza `LevelUp` en modo `element` y espera la elección. Al fijar el elemento, `run.element` se mantiene toda la partida.

**Debug:**
- `setLevel(n)`: fija el nivel, pone `pendingLevels = 0` y ejecuta `Evolution.check()`.
- `chooseElementNext(e)`: elige automáticamente la tarjeta `e` la próxima vez que se pida un elemento.

- [ ] **Paso 1: Escribir la prueba de navegador que falla**, `evolution.spec.mjs`:
  - Partida nueva. `give('fire_orbit')`, `give('searing')`, `setLevel(5)` → `player().formId === 'young_fire'` y `run().element === 'fire'`.
  - `setLevel(20)`, saltando la etapa adulta (riesgo 2) → `'legendary_fire'`. `__dbg.evolutions()` cuenta 2 animaciones en total (una por llamada, no por etapa).
  - Partida nueva con solo mejoras neutrales: `give('fury')`, `setLevel(5)` → `scene()` incluye `'LevelUp'` en modo elemento. `pick(1)` → `'young_ice'`.
  - Partida nueva: `give('thunder_strike')`, `give('thunder_strike')`, `give('frost_shards')`, `setLevel(12)` → `'adult_lightning'`.
  - Para cada una de las 10 formas, `__dbg.forceForm(id)` y captura en `e2e/out/forms/${id}.png`, para revisión visual.
  - Con `adult_lightning`, `spawn('squire',6,50)` con 999 de vida y `pauseSpawns(true)`: en 3 s, `__dbg.hitsBy('lightning')` muestra al menos 3 enemigos distintos golpeados en una sola descarga.
  - Con `adult_ice`: tras 3 s junto a un squire con 999 de vida, `__dbg.enemyStatus(id).frozenUntil > now` en algún momento.
- [ ] **Paso 2:** `npm run e2e evolution`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npx vitest run` y `npm run e2e`. Se espera PASS en todo.
- [ ] **Paso 5:** Commit: `feat: evolución en tres elementos, armas y ataque definitivo`.

---

### Task 11: HUD, pausa y redimensionado en partida

**Archivos:**
- Crear: `src/game/Hud.ts`, `src/scenes/PauseScene.ts`
- Modificar: `src/scenes/GameScene.ts`, `src/main.ts`
- Test: `e2e/hud.spec.mjs`

**Interfaces:**
- Consume: `RunState`, `Player`, `t`, `computeGameSize`.
- Produce:
  - `class Hud { constructor(scene: Phaser.Scene); update(run: RunState, player: Player): void; layout(width: number, height: number): void; destroy(): void }`.
  - Debug `hud()`: devuelve las posiciones `{timer:{x,y}, hp:{x,y,w}, xp:{x,y,w}, gold:{x,y}, pause:{x,y}}`.
  - Debug `size()`: devuelve `{width, height}` del juego.

**Disposición del HUD:**
- Barra de xp a lo ancho arriba (4 px de alto).
- Vida bajo ella, a la izquierda (60 × 5 px).
- Tiempo `mm:ss` centrado arriba.
- Nivel junto a la vida.
- Oro arriba a la derecha.
- Botón de pausa en la esquina superior derecha, con un área táctil de al menos 24 × 24 px lógicos (≥ 48 px físicos con escala ≥ 2).

Todo con `scrollFactor 0`. `layout` se llama en `scale.on('resize')`. La pausa abre `PauseScene` con el botón "Continuar" (`t('resume')`), que se activa también con Escape o P.

- [ ] **Paso 1: Escribir la prueba de navegador que falla**, `hud.spec.mjs`:
  - En horizontal (960×540): `size()` es `{480,270}` y `hud().timer.x === 240`.
  - `page.setViewportSize({width:390,height:844})` a mitad de partida (riesgo 5): en 500 ms `size()` es `{270,584}`, `hud().timer.x === 135`, `hud().pause.x > 240` y el dragón sigue centrado en cámara (`|player().x − camera.midPoint.x| < 2`, vía `__dbg.camera()`).
  - Pulsar `Escape`: `scene()` incluye `'Pause'`, y durante 1 s `run().elapsed` no cambia. Clic en "Continuar" → el tiempo vuelve a avanzar.
  - Capturas: `e2e/out/hud-landscape.png` y `e2e/out/hud-portrait.png`.
- [ ] **Paso 2:** `npm run e2e hud`. Se espera FAIL.
- [ ] **Paso 3:** Implementar.
- [ ] **Paso 4:** `npm run e2e`. Se espera PASS en todo.
- [ ] **Paso 5:** Commit: `feat: HUD, pausa y adaptación a vertical y horizontal`.

---

### Task 12: Rendimiento y tamaño de la build

**Archivos:**
- Crear: `e2e/perf.spec.mjs`, `scripts/check-size.mjs`
- Modificar: `package.json` (script `size`), y lo que haga falta optimizar según los resultados

**Interfaces:**
- Consume: los comandos de debug ya existentes. Además se añade `fps()`, que devuelve la media de `game.loop.actualFps` en los últimos 60 frames, y `counts()`, que devuelve `{enemies, projectiles, pickups}`.

- [ ] **Paso 1: Escribir la prueba que falla**, `perf.spec.mjs`:
  - `pauseSpawns(true)`, `setHp(1e9)`.
  - `spawn('squire', 300, 150)` con 1e6 de vida y `give('frost_shards')` ×5, más `setLevel(12)` con hielo, hasta que `counts().projectiles >= 200` (o los máximos que alcance el juego).
  - Medir `fps()` durante 5 s e imprimir el valor.
  - Afirmar `>= 30`. Es una comprobación mínima: Chromium sin GPU no es un móvil, y la prueba real la hace el usuario en su teléfono.
  - Afirmar que en la partida no se crean objetos nuevos fuera de los pools: `__dbg.poolStats()` no crece en `created` durante los 5 s, una vez calentado.
- [ ] **Paso 2:** `scripts/check-size.mjs` suma los bytes de `dist/` y falla si pasan de 10 × 1024 × 1024. Imprime el total en MB. Script npm `size`: `npm run build && node scripts/check-size.mjs`.
- [ ] **Paso 3:** `npm run e2e perf` y `npm run size`. Si alguno falla, perfilar con `page.evaluate(() => performance.now())` alrededor de los `update` de cada sistema (exponer `__dbg.timings()`) y optimizar lo que más pese. Hay que respetar la regla de los pools y la cuadrícula de la Tarea 4.
- [ ] **Paso 4:** `npx vitest run`, `npm run e2e` y `npm run size`. Se espera PASS en todo. Anotar en el mensaje de commit los fps y el tamaño medidos.
- [ ] **Paso 5:** Commit: `perf: comprobación de fps con 300 enemigos y tamaño de build`.
