# Plataforma (Playgama Bridge) y anuncios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the game pass Playgama/CrazyGames moderation and earn from ads: Bridge SDK init, cloud-capable storage, platform language/audio/pause, `game_ready`, interstitials at natural pauses, rewarded revive (once per run) and rewarded double gold, plus the checklist items the game fails today.

**Architecture:** One adapter module `src/platform/bridge.ts` owns every `bridge.*` call; the rest of the game talks to it. `src/platform/storage.ts` keeps its sync `load()/save()` interface but becomes an in-memory cache filled once at startup by `bridge.storage.get(['save'])` and written through with `bridge.storage.set`. A pure `rewardedResult(states)` decides whether a rewarded ad paid out. A pure `cardLayout(w, h, n)` lays out choice cards for any screen, square included.

**Tech Stack:** `@playgama/bridge` 2.4.4 (npm, Vite plugin in `local` mode so the archive is self-contained), `@fontsource/silkscreen` (font bundled), Phaser 4, Vitest, Playwright.

**Spec:** user said "sigue" after the dragons PR; the agreed goal from the start is publishing on Playgama/CrazyGames for ad revenue. Binding rules: Bridge "Required steps" (api page) and Game Requirements 1.x/2.x read on 2026-11-22.

## Global Constraints

- Bridge script is the first script in `<head>`, loaded normally; `bridge.initialize()` resolves before Phaser starts. No `bridge.*` call before that.
- No `localStorage` anywhere in game code (Required step 4). Read all keys once at startup; write only on meaningful changes.
- No external resources (1.2.5): the font ships in the build.
- No Esc key (1.5.2). Pause stays on P and the pause button.
- Interstitial only at natural pauses: leaving the game-over screen, quitting a run from pause (2.1.3). No own timers.
- Rewarded: button text says an ad will play and the reward; reward only on state `rewarded`; revive at most once per run; hidden when `isRewardedSupported` is false (2.2.x, Required step 8).
- Game muted and paused while the platform says so (pause/audio events), and starts muted when `isAudioEnabled` is false.
- Square 1:1 window: choice cards fit, no overlapping text (1.6.4, 1.6.8).

## Review Focus

1. Ad closed early / failed: no reward, game continues (revive declined path ends the run normally).
2. Platform pause arriving while a level-up or pause menu is open: resuming must not unpause a menu-paused game.
3. Storage `get` rejecting or returning garbage: game starts with a default save.
4. Revive offered twice in one run (second death must go straight to game over).
5. Double gold pressed twice or after rotating the game-over screen: gold added once.

---

### Task 1: Bridge adapter, init order, storage, language, font, Esc

**Files:** create `src/platform/bridge.ts`, `public/playgama-bridge-config.json`; modify `vite.config.ts`, `index.html`, `src/main.ts`, `src/platform/storage.ts`, `src/scenes/{Game,Pause,Lair,Collection}Scene.ts`, `docs/CREDITS.md`; tests `tests/logic/storage.test.ts`.

**Interfaces — Produces:**
- `platform.init(): Promise<void>`; `platform.language: string`; `platform.audioEnabled: boolean`; `platform.onAudio(cb)`, `platform.onPause(cb)`; `platform.gameReady()` (idempotent); `platform.message(name)`; `platform.interstitial(placement)`; `platform.rewardedSupported: boolean`; `platform.rewarded(placement): Promise<boolean>`; `platform.storageGet(key): Promise<string|null>`; `platform.storageSet(key, value): void`.
- `createCachedStorage(initial: string | null, write: (s: string) => void): Storage` in `storage.ts`; `initStorage(): Promise<void>`.

- [ ] Tests: cached storage parses the initial string, returns defaults for null/garbage, writes serialized JSON on save and `load()` returns the saved value without re-reading.
- [ ] Implement; main.ts: `await platform.init()` → `setLanguage(platform.language)` → `await initStorage()` → font → Phaser. Remove every `keydown-ESC`.
- [ ] e2e: existing suite (saves survive reload through the Bridge mock), plus an assertion that no `localStorage` key `dragon-survivor-save` is written.

### Task 2: Audio/pause from the platform, game_ready, level messages

**Files:** `src/audio/index.ts` (`setPlatformMuted(b)`, effective mute = user || platform), `src/main.ts` (pause → `game.pause()`/`resume()` + audio suspend, only resuming what the platform paused), `src/scenes/{Menu,Game,Pause}Scene.ts` (`game_ready` once after loading screen hides; `level_started/failed/completed/paused/resumed`).

- [ ] Test (unit): audio effective-mute truth table.
- [ ] e2e: debug `platformPause(true)` stops the run clock and suspends audio; `platformPause(false)` resumes; a menu-paused game stays paused.

### Task 3: Ads

**Files:** create `src/logic/ads.ts` (`rewardedResult(states: string[]): 'rewarded'|'declined'|'pending'`), `src/scenes/ReviveScene.ts`; modify `GameScene.endRun`, `GameOverScene`, `PauseScene` quit, `i18n.ts`, `main.ts` scene list.

- Revive: first death of a run with rewarded supported → pause Game, launch `Revive` overlay: "Revivir (ver anuncio)" / "No, gracias". Rewarded → resume with 50% max HP, enemies within 100 px pushed 60 px, 2 s invulnerability. Declined/failed → normal game over. `run.revived` blocks a second offer.
- Double gold: on the game-over screen when run gold > 0 and rewarded supported: "Oro x2 (ver anuncio)". On reward adds the run's gold again once (guard per runId) and updates the label.
- Interstitial `game_over` when leaving the game-over screen (again/lair/menu) and `quit` when quitting from pause.
- [ ] Unit tests for `rewardedResult` (rewarded then closed → rewarded; closed alone → declined; failed → declined; loading/opened → pending).
- [ ] e2e with debug ad mocks (`adMock('rewarded'|'closed'|'failed')`): revive grants HP once; declined ends run; double gold adds once; no reward on closed.

### Task 4: Square-safe choice cards

**Files:** create `src/logic/cardLayout.ts` (`cardLayout(w, h, n): {mode:'row'|'list'|'grid', cards:{x,y,w,h}[]}`), use it in `LevelUpScene`.
- Row when row width per card ≥ 90; else list when list height per card ≥ 60; else grid of 3 columns.
- [ ] Tests: 584×270 n=5 → row; 270×584 n=5 → list; 270×270 n=5 → grid, n=3 → list; every card inside the screen, no two overlap, every card ≥ 70 px wide.
- [ ] e2e screenshot of the picker at 600×600.

### Task 5: Archive + checklist pass

- [ ] `npm run build`, check `dist/index.html` has the Bridge script first in head and `dist/playgama-bridge-config.json` exists; zip `dist` to `release/dragon-survivor.zip`.
- [ ] Walk the Game Requirements by number; list what could not be checked here (real devices, real ads).
- [ ] Final reviewer, fixes, artifact, PR.
