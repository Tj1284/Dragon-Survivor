# Dragon Survivor — Plan 3: Jefes, menú y guardado

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** Que una partida tenga principio, clímax y final (minijefes, jefe, victoria), y que el oro y lo conseguido se guarden entre partidas (menú, Guarida, Colección).

**Arquitectura:**
- Las reglas son puras y con tests:
  - `src/logic/save.ts`: formato, lectura tolerante y migración.
  - `src/logic/meta.ts`: mejoras de la Guarida, costes y bonus.
  - `src/logic/bosses.ts`: calendario y vida.
- El guardado pasa por `src/platform/storage.ts`, una interfaz mínima con implementación en `localStorage`. El Plan 4 la cambiará por el SDK de la plataforma sin tocar el juego.
- Los jefes son enemigos del `EnemyManager` con un campo `boss` y su propio comportamiento.

**Tecnologías:** las mismas de los planes anteriores.

**Spec:** `docs/superpowers/specs/2026-11-12-dragones-survivors-design.md`, secciones 6.1, 6.5 y 6.6.

**Fuera de este plan** (van en el Plan 4): anuncios ("Revivir", "Duplicar oro", intersticial), SDK de plataforma, sonido y ajustes de sonido.

## Restricciones globales

- **Calendario de jefes:**
  - Minijefe 1 a los **3:00** y minijefe 2 a los **6:00**. Cada uno suelta un **cofre con una mejora gratis**.
  - Jefe final, el **Gran Cazadragones**, a los **10:00**. Al derrotarlo, **victoria**.
- **Primera visita:** se entra directamente a jugar, sin menú. A partir de la segunda, el juego arranca en el menú.
- **Fin de partida:**
  - Botones "Otra vez" y "Guarida" (además de "Menú").
  - El oro de la partida se suma al guardado **una sola vez**, aunque la pantalla se reconstruya al girar el móvil.
- **Guarida:**
  - 6 mejoras permanentes con coste creciente.
  - Comprar descuenta el oro y guarda en el acto.
- **Colección:** cada forma alcanzada por primera vez se guarda. Las que faltan se ven como silueta. Contador "n/10".
- **Robustez del guardado:**
  - Si el almacenamiento falla, lanza error o tiene datos corruptos, el juego arranca con un guardado nuevo y nunca se cuelga.
  - Los números del guardado se limitan a rangos válidos.
- Todo texto visible pasa por `t()`, en español e inglés.
- Los botones usan `onTap`.
- Las pantallas superpuestas usan `relayoutOnResize`.

## Riesgos a revisar

1. **Guardado corrupto o de otra versión** (JSON roto, campos que faltan, tipos raros, `localStorage` bloqueado en modo privado): el juego arranca con valores por defecto y no pierde lo que sí se pueda leer (test en la Task 2).
2. **Oro sumado dos veces** al reconstruirse la pantalla de fin de partida (girar el móvil) o al pulsar dos veces: se suma una sola vez (test en la Task 4).
3. **Jefe que aparece mientras la pantalla de mejora está abierta** o durante la pausa de evolución: debe aparecer al reanudarse la partida, una sola vez (test en la Task 3).
4. **Dos cofres o un cofre recogido durante una subida de nivel:** cada cofre da exactamente una mejora y respeta la cola de subidas de nivel (test en la Task 3).
5. **Comprar en la Guarida sin oro suficiente o al máximo, o pulsando rápido varias veces:** nunca baja de 0 ni pasa del máximo (test en la Task 2 y en la Task 4).

---

### Task 1: Arreglos previos (gemas y clérigo)

**Files:**
- Modify: `src/game/Pickups.ts`, `src/game/EnemyManager.ts`
- Test: `e2e/pickups-cap.spec.mjs`

**Interfaces:**
- `Pickups.MAX_GEMS = 250`.
- Si al soltar una gema ya hay 250 gemas activas, su xp se suma a la gema más antigua, que pasa a la textura del tamaño que corresponda a su nuevo valor.
- `EnemyManager.update` reconstruye la cuadrícula justo después de `compact()`, antes de que actúen los clérigos.

- [ ] **Step 1: prueba que falla:** `e2e/pickups-cap.spec.mjs`:
  - `dropGems(400, 1)` (nuevo comando de debug: 400 gemas de 1 xp en posiciones al azar a 200–400 px).
  - Comprobar `pickups().length <= 250` y que la suma de xp de las gemas sea 400 (`gemXpTotal()`).
- [ ] **Step 2:** `npm run e2e pickups-cap` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** `npx vitest run && npm run e2e` → PASS.
- [ ] **Step 5:** commit `fix: tope de gemas en el suelo y cuadrícula del clérigo`.

### Task 2: Guardado y mejoras de la Guarida (lógica)

**Files:**
- Create: `src/logic/save.ts`, `src/logic/meta.ts`, `src/platform/storage.ts`
- Modify: `src/logic/attacks.ts` (`computeStats(stage, owned, meta?)`)
- Test: `tests/logic/save.test.ts`, `tests/logic/meta.test.ts`

**Interfaces — Produces:**
```ts
// save.ts
export interface SaveData { v: 1; gold: number; meta: Partial<Record<MetaId, number>>; collection: FormId[]; bestTime: number; wins: number; played: boolean }
export function defaultSave(): SaveData;
export function parseSave(raw: string | null): SaveData;          // nunca lanza; limpia lo que no sirve
export function serializeSave(s: SaveData): string;
export function addRunResult(s: SaveData, r: { gold: number; time: number; won: boolean; forms: FormId[] }): SaveData;   // copia
// meta.ts
export type MetaId = 'vitality' | 'might' | 'agility' | 'greed' | 'wisdom' | 'reach';
export interface MetaDef { id: MetaId; maxLevel: number; baseCost: number }
export const META: Record<MetaId, MetaDef>; export const META_IDS: MetaId[];
export function metaCost(id: MetaId, level: number): number;      // coste del siguiente nivel
export function buyMeta(s: SaveData, id: MetaId): SaveData | null; // null si no hay oro o está al máximo
export interface MetaBonus { maxHp: number; damageMult: number; speedMult: number; goldMult: number; xpMult: number; pickupMult: number }
export function metaBonus(meta: SaveData['meta']): MetaBonus;
// platform/storage.ts
export interface Storage { load(): SaveData; save(s: SaveData): void }
export function createLocalStorage(key?: string): Storage;        // 'dragon-survivor-save'; try/catch en todo
export const storage: Storage;                                     // instancia única que usa el juego
```

**Mejoras de la Guarida:**

| id | Nombre | Niveles | Coste base | Efecto por nivel |
|---|---|---|---|---|
| vitality | Corazón de dragón | 5 | 20 | +10 de vida máxima |
| might | Garras afiladas | 5 | 30 | +6 % de daño |
| agility | Alas ligeras | 3 | 25 | +4 % de velocidad |
| greed | Tesoro | 5 | 20 | +10 % de oro |
| wisdom | Sabiduría antigua | 5 | 25 | +6 % de experiencia |
| reach | Garra larga | 3 | 20 | +10 % de radio de recogida |

- Coste del nivel siguiente: `metaCost(id, level) = round(baseCost × (level + 1)^1.6)`.
- **Fórmulas en `computeStats(stage, owned, meta = NO_BONUS)`:**
  - maxHp = (lo de antes) + `meta.maxHp`
  - damageMult = (lo de antes) × `meta.damageMult`
  - speed = (lo de antes) × `meta.speedMult`
  - pickupRadius = (lo de antes) × `meta.pickupMult`

- [ ] **Step 1: tests que fallan.**
```ts
expect(parseSave(null)).toEqual(defaultSave());
expect(parseSave('{roto')).toEqual(defaultSave());
expect(parseSave(JSON.stringify({ gold: -50, meta: { might: 99, nope: 3 }, collection: ['adult_ice', 'x', 'adult_ice'], played: 'yes' })))
  .toEqual({ ...defaultSave(), gold: 0, meta: { might: 5 }, collection: ['adult_ice'], played: false });
expect(parseSave(serializeSave({ ...defaultSave(), gold: 120, wins: 2 }))).toEqual({ ...defaultSave(), gold: 120, wins: 2 });
const r = addRunResult(defaultSave(), { gold: 40, time: 200, won: false, forms: ['hatchling', 'young_fire'] });
expect(r).toMatchObject({ gold: 40, bestTime: 200, wins: 0, played: true, collection: ['hatchling', 'young_fire'] });
expect(addRunResult(r, { gold: 10, time: 100, won: true, forms: ['young_fire'] })).toMatchObject({ gold: 50, bestTime: 200, wins: 1 });
expect(metaCost('might', 0)).toBe(30); expect(metaCost('might', 1)).toBe(91);
expect(buyMeta({ ...defaultSave(), gold: 29 }, 'might')).toBeNull();
const b = buyMeta({ ...defaultSave(), gold: 100 }, 'might')!; expect(b).toMatchObject({ gold: 70, meta: { might: 1 } });
expect(buyMeta({ ...defaultSave(), gold: 1e6, meta: { agility: 3 } }, 'agility')).toBeNull();
expect(metaBonus({})).toEqual({ maxHp: 0, damageMult: 1, speedMult: 1, goldMult: 1, xpMult: 1, pickupMult: 1 });
expect(metaBonus({ vitality: 2, might: 5 })).toMatchObject({ maxHp: 20, damageMult: 1.3 });
expect(computeStats(0, {}, metaBonus({ vitality: 1, agility: 3 }))).toMatchObject({ maxHp: 110, speed: 70 * 1.12 });
// almacenamiento que lanza error: arranca y guarda sin romper
const broken = createLocalStorage('k', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
expect(broken.load()).toEqual(defaultSave()); expect(() => broken.save(defaultSave())).not.toThrow();
```
  `createLocalStorage(key, backend = globalThis.localStorage)` acepta un segundo parámetro para poder probarlo.
- [ ] **Step 2:** `npx vitest run` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `feat: guardado tolerante y mejoras permanentes`.

### Task 3: Minijefes, jefe final, cofres y victoria

**Files:**
- Create: `src/logic/bosses.ts`, `src/game/Bosses.ts`
- Modify: `src/game/EnemyManager.ts` (campo `boss: BossId | null`, escala del sprite y radio), `src/scenes/GameScene.ts`, `src/game/Hud.ts` (barra de vida del jefe), `src/game/Pickups.ts` (cofre), `src/art/items.ts` y `src/assets/manifest.ts` (`chest`, 16×16, 2 frames), `src/scenes/GameOverScene.ts` (`won`), `src/i18n.ts`
- Test: `tests/logic/bosses.test.ts`, `e2e/bosses.spec.mjs`

**Interfaces — Produces:**
```ts
export type BossId = 'captain' | 'champion' | 'grand_hunter';
export interface BossDef { id: BossId; at: number; hp: number; sprite: 'heavy' | 'lancer' | 'boss'; scale: number; radius: number; speed: number; damage: number; final: boolean }
export const BOSSES: BossDef[];                 // en orden de aparición
export function bossesDue(elapsed: number, spawned: ReadonlySet<BossId>): BossDef[];
```

**Jefes:**

| id | Aparece | Vida | Sprite | Escala | Radio | Velocidad | Daño | Patrones |
|---|---|---|---|---|---|---|---|---|
| captain | 180 s | 900 | heavy | 2 | 20 | 34 | 15 | embestida |
| champion | 360 s | 2800 | lancer | 2 | 22 | 38 | 18 | embestida + golpe en área |
| grand_hunter | 600 s | 9000 | boss | 1 | 34 | 32 | 22 | embestida + golpe en área + llamar 8 escuderos |

**Patrones** (cada 3,5 s el jefe elige uno de los que tiene, en orden rotatorio):
- **Embestida:** parpadea 0,6 s y corre 1 s a 170 px/s hacia donde estaba el dragón.
- **Golpe en área:** marca un círculo rojo de 70 px de radio alrededor del dragón durante 0,9 s y luego hace 25 de daño si el dragón sigue dentro.
- **Llamar escuderos:** aparecen 8 escuderos en anillo a 90 px del jefe.

**Reglas comunes:**
- Los jefes no se recolocan al alejarse ni cuentan para `targetAlive`. Escalan su vida con `hpMult(elapsed)`.
- Al aparecer un jefe, la barra de vida aparece arriba con su nombre `t('boss_<id>')`. Desaparece al morir.
- El minijefe suelta un **cofre**. Al tocarlo, `pendingLevels += 1` y se abre la pantalla de mejora por la cola normal.
- El jefe final al morir:
  - `run.won = true`, +50 de oro y, tras 1,5 s, fin de partida con `won: true`.
  - El título es `t('victory')`.

- [ ] **Step 1: tests que fallan.**
  - **Unit:**
    - `bossesDue(179, new Set())` → `[]`.
    - `bossesDue(180, new Set())` → `[captain]`.
    - `bossesDue(700, new Set(['captain']))` → `[champion, grand_hunter]`.
    - `bossesDue(700, new Set(BOSSES.map((b) => b.id)))` → `[]`.
  - **E2E** (`bosses.spec.mjs`):
    - `setElapsed(179.5)` → en 2 s `bosses()` tiene `captain` y `hud().bossBar.visible`.
    - Matarlo con `damageBoss(1e9)` → `pickups()` tiene un `chest`.
    - Teletransportarse al cofre → `scene()` incluye `LevelUp` una sola vez.
    - **Riesgo 3:** con la pantalla de mejora abierta, `setElapsed(359.9)` → al elegir carta y reanudar, aparece `champion` una sola vez.
    - **Riesgo 4:** dos cofres seguidos (`dropChest()` ×2) dan dos subidas de nivel.
    - `setElapsed(599.5)` → `grand_hunter`; `damageBoss(1e9)` → en 3 s `scene()` incluye `GameOver` y `gameOver().won === true`.
    - Embestida y golpe en área: con el dragón quieto y 1e9 de vida, en 8 s el jefe final ha usado al menos 2 patrones distintos (`bossPatterns()`).
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `npx vitest run && npm run e2e` → PASS.
- [ ] **Step 5:** commit `feat: minijefes, jefe final, cofres y victoria`.

### Task 4: Menú, Guarida, Colección y guardado en partida

**Files:**
- Create: `src/scenes/MenuScene.ts`, `src/scenes/LairScene.ts` (Guarida), `src/scenes/CollectionScene.ts`
- Modify:
  - `src/scenes/BootScene.ts`: va al menú o al juego según `played`.
  - `src/scenes/GameScene.ts`:
    - Aplica `metaBonus` a las estadísticas.
    - Oro y experiencia × `goldMult`/`xpMult`.
    - Guarda la forma en `run.forms` al evolucionar.
  - `src/scenes/GameOverScene.ts`:
    - Llama una sola vez a `storage.save(addRunResult(...))`, usando un id de partida.
    - Añade los botones "Guarida" y "Menú".
  - `src/scenes/PauseScene.ts`: botón "Menú", que da la partida por terminada y guarda el oro conseguido.
  - `src/main.ts`: registrar las escenas.
  - `src/i18n.ts`.
- Test: `e2e/meta.spec.mjs`

**Interfaces:**
- `RunState` gana `id: number` (aleatorio al crear la partida), `forms: FormId[]` (empieza con `['hatchling']`) y `won: boolean`.
- `GameOverData` gana `won: boolean`, `runId: number` y `forms: FormId[]`.
- `GameOverScene` guarda en un `Set` a nivel de módulo los `runId` ya guardados, para que reconstruir la escena no vuelva a sumar (riesgo 2).
- Debug:
  - `save()`: devuelve el guardado actual.
  - `resetSave()`.
  - `setSave(partial)`.
  - `gameOver()`: devuelve los datos de la pantalla.
  - `buttons()`: devuelve los botones visibles de la escena activa, `[{id, x, y, enabled}]`.

**Pantallas** (en horizontal y en vertical, reconstruidas al girar):
- **Menú:**
  - Título "DRAGON SURVIVOR".
  - La cría grande, animada.
  - Botón grande `t('play')`.
  - Botones `t('lair')` y `t('collection')` (con "n/10").
  - Oro arriba a la derecha.
- **Guarida:**
  - Las 6 mejoras en filas: icono generado, nombre, "Nv x/máx", descripción y botón con el coste.
  - El botón está desactivado (gris) si no llega el oro o la mejora está al máximo.
  - Botón `t('back')`.
- **Colección:**
  - Rejilla de las 10 formas.
  - Las conseguidas se ven a color; las que faltan, en negro.
  - Contador "n/10" y botón `t('back')`.

- [ ] **Step 1: prueba que falla** (`e2e/meta.spec.mjs`):
  - **Primera visita:** `resetSave()` y recargar → arranca en `Game`, no en `Menu`.
  - **Fin de la primera partida:**
    - Morir con 12 de oro → `save().gold === 12` y `save().played === true`.
    - Girar a vertical y volver → sigue en 12 (riesgo 2).
    - Pulsar "Menú" → `Menu`.
  - **Recargar** → arranca en `Menu`.
  - **Guarida con 100 de oro:**
    - `setSave({ gold: 100 })`, entrar en Guarida y comprar `might` → `save()` tiene `gold: 70` y `meta.might: 1`.
    - Tres pulsaciones rápidas más en `might` (coste 91) → sigue en 70 y en nivel 1 (riesgo 5).
    - Recargar → se conserva.
  - **Colección:**
    - Con `setSave({ collection: ['hatchling', 'young_ice'] })` → la Colección muestra "2/10" (`collectionCount()`).
    - Jugar, evolucionar a `young_fire` con `setLevel(5)` y morir → `save().collection` incluye `young_fire`.
  - **Bonus de la Guarida:** con `meta.vitality: 2`, una partida nueva empieza con 120 de vida máxima.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `npx vitest run && npm run e2e` → PASS.
- [ ] **Step 5:** commit `feat: menú, Guarida, Colección y guardado`.

### Task 5: Cierre

- [ ] **Step 1:** actualizar `smoke.spec`, `hud.spec`, `overlay-rotate.spec` y cualquier spec que diera por hecho que el juego arranca en `Game`. Para que sigan probando lo mismo, deben usar `?debug=1&play=1`, que salta el menú.
- [ ] **Step 2:** `npx vitest run && npm run e2e && node scripts/check-size.mjs` → PASS.
- [ ] **Step 3:** capturas de menú, Guarida, Colección, barra del jefe y victoria en `e2e/out/` para revisión visual.
- [ ] **Step 4:** commit `test: el juego arranca en el menú; capturas de las pantallas nuevas`.
