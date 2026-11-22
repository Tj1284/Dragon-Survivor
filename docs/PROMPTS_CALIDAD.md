# Prompts para subir la calidad de todo el juego

Este documento sigue a `docs/PROMPTS_ASSETS.md`, que tiene los dragones, enemigos y proyectiles. Aquí está todo lo demás: el menú y las pantallas, los efectos, las animaciones y el escenario.

## Cómo usarlos

- **El juego es pequeño de verdad.** La pantalla mide 270 píxeles por el lado corto (hasta 600 por el largo) y se amplía sin suavizar. Por eso los tamaños de abajo son pequeños: si un dibujo es más grande, se verá enorme o habrá que reducirlo y perderá detalle.
- **Pide siempre fondo transparente** (salvo los fondos de pantalla) y adjunta una captura del juego o uno de tus sprites para mantener el estilo.
- **No hace falta que los frames estén perfectamente alineados.** Con que estén en filas separadas por espacio, `tools/slice_sprites.py` los recorta y los ajusta al tamaño exacto.
- **Nada de esto funciona solo con copiar el PNG.** Los botones, paneles, fondos y efectos nuevos necesitan que yo cambie el código para usarlos. Mándamelos por grupos (por ejemplo, primero todo el menú) y los integro.

### Bloque de estilo (va al final de cada prompt de ChatGPT)

```
Style: clean 16-bit pixel art like a polished SNES/GBA game, limited palette, crisp pixels, no anti-aliasing, no blur, no text, no watermark, no letters. Dark fantasy-but-cute tone matching the attached dragon sprite. Transparent background unless told otherwise.
```

---

## 1. Diseño del menú y las pantallas (Claude Design)

Usa este prompt **en Claude Design** para decidir el aspecto de todas las pantallas antes de dibujar los assets. Lo que salga sirve de plano: luego pides cada pieza a ChatGPT con los prompts de la sección 2.

```
Design the complete UI for "Dragon Survivor", a pixel-art survivors-like browser game (Vampire Survivors style) for mobile and desktop. The player is a baby dragon that evolves into fire, ice, lightning, poison or shadow forms and fights waves of medieval dragon hunters.

Hard constraints:
- Logical resolution is tiny: short side 270 px, long side 270–600 px (landscape 600×270, portrait 270×600, square 270×270). Every screen must work in all three. Show each screen in landscape 600×270 AND portrait 270×600, drawn at 2x so pixels are visible.
- Pixel-art look: the only font is "Silkscreen" at 8 px or 16 px. No gradients, no blur, no rounded vector shapes: everything built from hard pixel edges, 1–2 px borders.
- Thumb-friendly: every button at least 22 px tall, main buttons 30 px.
- No Esc key, no external links.

Palette (keep it): background #1d1b2a, panel #2a2638, text #ffffff and #cfc8e6, gold #f2c230, fire #e8542a, ice #6cc6f0, lightning #f5d742, poison #8fe04a, shadow #c23a6e, buttons purple #5a3f8f.

Screens to design:
1. Main menu: animated title logo, the current best dragon flying in the centre over a parallax background (castle, mountains, sky), buttons Play (big), Lair, Collection, sound toggle; gold counter top-right; best time and wins.
2. Lair (upgrade shop): 6 permanent upgrades (might, vitality, swiftness, magnet, greed, regen) as cards with icon, level pips (0–5), price in gold, buy button; disabled state when not enough gold.
3. Collection: 16 dragon forms in a grid (hatchling + young/adult/legendary × 5 elements), owned in colour with a frame per element, missing ones as dark silhouettes with a lock.
4. In-game HUD: health bar, XP bar with level, timer, gold, 4 attack slots with level number, pause button, boss health bar with name.
5. Level-up: 3 upgrade cards (new attack / level up / gold evolution card that glows), and the 5-element choice.
6. Pause: resume, menu, sound.
7. Revive offer: "Revive (watch an ad)" and "No, thanks".
8. Game over / victory: dragon, time, level, gold, "Gold x2 (watch an ad)", Again, Lair, Menu.

For each screen also list the animations (button press, card entrance, coin count-up, title glow, screen transitions) with durations in ms, and a list of every image asset needed with its exact pixel size.
```

---

## 2. Piezas del menú y la interfaz (ChatGPT)

| Archivo | Tamaño | Qué es |
|---|---|---|
| `art/ui/logo.png` | 240×80 | Título del juego |
| `art/ui/bg_landscape.png` | 600×270 | Fondo del menú en horizontal |
| `art/ui/bg_portrait.png` | 270×600 | Fondo del menú en vertical |
| `art/ui/panel.png` | 48×48 | Marco de panel (se estira por el centro) |
| `art/ui/button.png` | 3 frames de 48×16 | Botón normal, encima y pulsado |
| `art/ui/card.png` | 2 frames de 48×64 | Carta normal y carta dorada |
| `art/ui/icons.png` | 12 frames de 16×16 | Iconos de la interfaz |
| `art/ui/bars.png` | 96×24 | Marcos de las barras de vida y de experiencia |

**Logo**
```
A pixel art game logo that reads "DRAGON SURVIVOR" in chunky fantasy letters, gold with a dark red outline and a small dragon wing behind the text, exactly 240x80 pixels, transparent background. 16-bit, crisp pixels, no anti-aliasing.
```
*(Este es el único prompt en el que sí pides texto. Si las letras salen mal, pide solo el adorno y yo pongo el texto con la fuente del juego.)*

**Fondo del menú** (pide las dos versiones)
```
A pixel art background for a game title screen, exactly 600x270 pixels (landscape), no characters, no text: a night sky with stars and a big moon, distant purple mountains, a dark medieval castle with lit windows on a hill on the right, a meadow in the foreground. Leave the centre fairly empty and darker so a dragon and buttons can sit on top. Opaque background. [STYLE BLOCK]
```
Para la versión vertical, cambia "600x270 pixels (landscape)" por "270x600 pixels (portrait)" y "on the right" por "at the top".

**Panel y botones**
```
Pixel art UI kit for a fantasy game, transparent background, one image with three parts in a row:
1) a square panel frame 48x48: dark stone #2a2638 centre, 2px gold #f2c230 border with small corner rivets; the middle must be plain so it can be stretched;
2) a button 48x16 in three states side by side (normal, hover lighter, pressed darker and 1px lower): purple #5a3f8f with a 1px white highlight on top and a dark bottom edge;
3) a card frame 48x64 in two versions side by side: normal (dark with a thin purple border) and legendary (gold glowing border with tiny sparkles).
[STYLE BLOCK]
```

**Iconos de la interfaz** (12 iconos de 16×16 en una fila)
```
A row of 12 pixel art UI icons, each exactly 16x16 pixels, evenly spaced on a transparent background, in this order: gold coin, pause (two bars), play triangle, speaker on, speaker muted, castle tower (lair), open book (collection), back arrow, padlock, heart, crossed swords, hourglass. Bold readable shapes with a 1px dark outline. [STYLE BLOCK]
```

**Barras**
```
Pixel art HUD bar frames, transparent background, exactly 96x24 pixels total: on top a health bar frame 96x10 (dark metal with a small heart cap on the left), below it an XP bar frame 96x8 (thin purple frame with a small gem cap on the left). Empty insides (the fill is drawn by code). [STYLE BLOCK]
```

---

## 3. Efectos (cada uno en una fila de frames)

Los efectos van **sin contorno negro** y con colores brillantes, para que se vean sobre el césped. Prompt base:

```
Pixel art VFX sprite sheet of EFFECT, exactly FRAMES frames in one single horizontal row, each frame SIZE pixels, transparent background, bright saturated colours with a white-hot core, no outline, the effect grows and fades out over the frames. For a top-down action game. [STYLE BLOCK]
```

| Archivo | EFFECT | FRAMES | SIZE | Dónde se ve |
|---|---|---|---|---|
| `art/fx/hit.png` | a small white-yellow impact spark burst | 5 | 16x16 | Cada golpe |
| `art/fx/death.png` | a puff of grey smoke with little stars, an enemy vanishing | 6 | 24x24 | Muerte de un enemigo |
| `art/fx/explosion.png` | a fiery explosion with debris | 8 | 48x48 | Meteoro, estallidos |
| `art/fx/ice_burst.png` | a burst of ice crystals shattering | 6 | 32x32 | Congelar y romper hielo |
| `art/fx/lightning_strike.png` | a vertical lightning bolt hitting the ground from the top | 5 | 16x64 | Relámpago |
| `art/fx/poison_cloud.png` | a bubbling toxic green cloud, loopable | 6 | 48x48 | Nube tóxica |
| `art/fx/void_rift.png` | a swirling black-and-magenta vortex, loopable | 8 | 64x64 | Grieta del vacío |
| `art/fx/slash.png` | a wide crimson scythe slash arc | 6 | 96x96 | Guadaña |
| `art/fx/tail_swipe.png` | a white curved swoosh arc | 5 | 64x64 | Coletazo |
| `art/fx/roar.png` | an expanding ring shockwave | 6 | 64x64 | Rugido |
| `art/fx/levelup.png` | a golden pillar of light with rising sparkles | 8 | 64x96 | Subir de nivel |
| `art/fx/evolve.png` | a huge radiant explosion of light with rays | 10 | 128x128 | Evolución del dragón |
| `art/fx/gem_pickup.png` | a tiny sparkle twinkle | 4 | 12x12 | Recoger gema |
| `art/fx/chest_open.png` | a wooden treasure chest opening with golden light coming out | 5 | 24x24 | Cofre |

---

## 4. Animaciones de los personajes

Ahora los dragones solo tienen el ciclo de vuelo y los enemigos el de andar. Estas animaciones dan mucha vida. Pide cada una a ChatGPT **adjuntando el sprite actual de ese personaje**:

**Dragón atacando** (una por forma, o empieza solo por las legendarias)
```
Same dragon as the attached sprite sheet, same size per frame and same style: a 4-frame breath attack animation in one horizontal row — head pulls back, then opens the jaws wide and breathes ELEMENT forward, then recovers. Facing right, transparent background. [STYLE BLOCK]
```

**Enemigos recibiendo daño y muriendo**
```
Same character as the attached sprite sheet, same frame size and style: one horizontal row with a 1-frame hurt pose (recoiling backwards) followed by a 4-frame death animation (falls back and fades into a puff of smoke). Facing right, transparent background. [STYLE BLOCK]
```

**El jefe, embestida y golpe al suelo**
```
Same boss as the attached sprite sheet, same 96x96 frame size and style: one row of 4 frames winding up a charge (crouching, sword back, eyes glowing red) and one row of 4 frames slamming the greatsword into the ground with a shockwave. Facing right, transparent background. [STYLE BLOCK]
```

---

## 5. Escenario

Un escenario distinto cada pocos minutos de partida hace que el juego parezca mucho más grande. Cada bioma necesita su suelo de 64×64, que tiene que repetirse sin cortes, y una fila de 8 decoraciones de 32×32.

| Bioma | Cuándo aparece | Suelo | Decoraciones |
|---|---|---|---|
| Pradera | 0:00 | ya lo tienes | flores, setas, rocas, arbustos |
| Bosque otoñal | 3:00 (tras el capitán) | orange-brown forest floor with fallen leaves | trees, stumps, pumpkins, fallen logs |
| Montaña nevada | 6:00 (tras el campeón) | snow with blue shadows and ice cracks | pine trees, snowy rocks, ice crystals, frozen bones |
| Tierra volcánica | 10:00 (jefe final) | dark basalt with glowing lava cracks | lava rocks, obsidian spikes, skull piles, smoking vents |

**Suelo**
```
A seamless tileable pixel art texture, exactly 64x64 pixels, top-down view: DESCRIPTION. Subtle variation, no objects, tiles perfectly with itself on all four edges. Opaque. [STYLE BLOCK]
```

**Decoraciones**
```
A row of 8 pixel art top-down decorations for a BIOME map, each exactly 32x32 pixels, evenly spaced on a transparent background: DECORATIONS (2 variations each). Slight top-down 3/4 view with a soft shadow at the base. [STYLE BLOCK]
```

---

## 6. Cosas que no necesitan dibujos (las hago yo en código)

Para que lo tengas en cuenta y no gastes tiempo pidiéndolas a ChatGPT:

- Botones que se hunden al pulsar, cartas que entran deslizándose y el oro que cuenta hacia arriba.
- Temblor de pantalla, destello y cámara lenta al evolucionar.
- Números de daño con rebote y críticos más grandes.
- Transiciones entre pantallas: fundido o barrido.
- El brillo pulsante del logo y el dragón volando en el menú.

## 7. Orden recomendado

1. **Menú completo** (sección 1 y luego la 2). Es lo primero que ve el jugador y lo que más decide si se queda.
2. **Efectos** de golpe, muerte, explosión, subir de nivel y evolución. Son los que más se notan al jugar.
3. **Biomas.** Dan variedad a partidas largas.
4. **Animaciones de ataque y muerte.** Lucen mucho, pero son las más caras de hacer bien con ChatGPT.
