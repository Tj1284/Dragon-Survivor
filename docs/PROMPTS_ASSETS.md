# Prompts para generar los sprites con ChatGPT

Los prompts están en inglés porque los generadores de imágenes les hacen más caso. Cópialos tal cual: cada uno ya lleva el bloque de estilo incluido.

## Antes de empezar

- **ChatGPT no hace pixel art exacto.** Genera imágenes grandes con "píxeles" de tamaño irregular, frames que no encajan en una cuadrícula y a veces fondo blanco. Casi siempre hay que retocar.
- **Flujo recomendado:**
  1. Genera el sprite con ChatGPT **adjuntando una imagen de referencia** (ver abajo).
  2. Ábrelo en un editor de pixel art: Piskel o Pixelorama (gratis, en el navegador) o Aseprite.
  3. Redúcelo al tamaño exacto con escalado "vecino más cercano" (*nearest neighbor*) y limpia los píxeles sueltos.
  4. Monta los frames en una sola fila, sin separación, con el tamaño total de la tabla.
  5. Guárdalo en `art/` con el nombre exacto y súbelo (o pásamelo en un zip). Si el tamaño no cuadra, una prueba automática lo detecta y te lo digo.
- **Referencia para que todo tenga el mismo estilo:** adjunta siempre tu `art/dragons/young_fire.png` (o el joven del mismo elemento) y deja la frase "same art style as the attached image" que ya llevan los prompts.
- **Sube de forma en forma:** para el adulto adjunta el joven del mismo elemento; para el legendario, el adulto. Así el dragón "crece" en vez de cambiar de diseño.
- **Lo que no hace falta dibujar:** el destello al recibir daño, la muerte, la transición de evolución, el aura de partículas y los alientos. Los hace el código.

## Dragones: 16 formas, 6 frames de vuelo cada una

Ya están las 16. Si rehaces alguna, usa estos tamaños; `tools/slice_sprites.py` recorta y reduce la imagen de ChatGPT al tamaño exacto. Orden recomendado (lo que más se ve antes): jóvenes nuevos → adultos → legendarios.

| Archivo | Frame | Tamaño total del PNG |
|---|---|---|
| `young_*` | 32×32 | 192×32 |
| `adult_*` | 48×48 | 288×48 |
| `legendary_*` | 96×96 | 576×96 |
| `young_poison`, `young_shadow` | 40×40 | 240×40 |

### Jóvenes nuevos (veneno y sombra)

`art/dragons/young_poison.png`
```
Pixel art sprite sheet of a young POISON dragon flying, same character design and same art style as the attached image (a young dragon), only recolored and with poison details. 6 frames of a wing-flap loop in one single horizontal row, frame 1 wings up, frame 4 wings down, smooth loop. Purple body, acid-green belly and wing membranes, small green venom drops on the horns, tail tip shaped like a dripping drop. Each frame exactly 32x32 pixels, total image 192x32. Clean 16-bit pixel art, max 16 colors, 1px dark outline, no anti-aliasing, no blur, no text. Side view facing RIGHT, transparent background, character centered with the body at the same height in every frame.
```

`art/dragons/young_shadow.png`
```
Pixel art sprite sheet of a young SHADOW dragon flying, same character design and same art style as the attached image (a young dragon), only recolored and with shadow details. 6 frames of a wing-flap loop in one single horizontal row, frame 1 wings up, frame 4 wings down, smooth loop. Very dark slate-grey body, dark violet belly, black wings with deep crimson membranes, glowing magenta eyes, wisps of dark smoke on the tail tip. Each frame exactly 32x32 pixels, total image 192x32. Clean 16-bit pixel art, max 16 colors, 1px dark outline, no anti-aliasing, no blur, no text. Side view facing RIGHT, transparent background, character centered with the body at the same height in every frame.
```

### Adultos (adjunta el joven del mismo elemento)

Cambia `COLORES` y `DETALLES` por la fila de la tabla de abajo.

`art/dragons/adult_ELEMENTO.png`
```
Pixel art sprite sheet of an ADULT dragon flying, the same dragon as the attached image but grown up: bigger and fiercer, longer neck, three spikes along the back, large membrane wings with 3 fingers, longer horns. Same art style and same colors as the attached image: COLORES. DETALLES. 6 frames of a wing-flap loop in one single horizontal row, frame 1 wings up, frame 4 wings down, smooth loop. Each frame exactly 48x48 pixels, total image 288x48. Clean 16-bit pixel art, max 16 colors, 1px dark outline, no anti-aliasing, no blur, no text. Side view facing RIGHT, transparent background, character centered with the body at the same height in every frame.
```

### Legendarios (adjunta el adulto del mismo elemento)

`art/dragons/legendary_ELEMENTO.png`
```
Pixel art sprite sheet of a LEGENDARY dragon flying, the same dragon as the attached image but majestic and ancient: a crown of horns, five back spikes, huge wings, glowing accents and a small aura. Same art style and same colors as the attached image: COLORES. DETALLES. 6 frames of a wing-flap loop in one single horizontal row, frame 1 wings up, frame 4 wings down, smooth loop. Each frame exactly 96x96 pixels, total image 576x96. Clean 16-bit pixel art, max 16 colors, 1px dark outline, no anti-aliasing, no blur, no text. Side view facing RIGHT, transparent background, character centered with the body at the same height in every frame.
```

| ELEMENTO | COLORES | DETALLES |
|---|---|---|
| fire | red body, golden-yellow belly, dark red wings with orange membranes | a flame on the tail tip, embers around the horns |
| ice | light blue body, white belly, deep blue wings with pale cyan membranes, white crystal horns | an ice crystal on the tail tip, frost on the wings |
| lightning | golden-yellow body, cream belly, yellow wings with dark navy stripes, cream horns | a lightning bolt on the tail tip, small sparks |
| poison | purple body, acid-green belly and membranes | dripping venom from the jaws, a drop-shaped tail tip, toxic bubbles |
| shadow | very dark slate-grey body, dark violet belly, black wings with crimson membranes, glowing magenta eyes | dark smoke wisps trailing from the wings and tail |

## Cazadragones (4 frames de andar)

Ya tienes el escudero. Adjunta `art/enemies/squire.png` como referencia de estilo.

```
Pixel art sprite sheet of a cartoon medieval DESCRIPTION walking, same art style as the attached image. 4-frame walk cycle in one single horizontal row, chibi proportions (big head, short body), facing RIGHT. Each frame exactly SIZExSIZE pixels, total image TOTAL. Clean 16-bit pixel art, max 16 colors, 1px dark outline, no anti-aliasing, no text, transparent background, feet at the same height in every frame.
```

| Archivo | DESCRIPTION | SIZE | TOTAL |
|---|---|---|---|
| `art/enemies/archer.png` | archer in a green hood and leather armor holding a wooden bow, quiver on the back | 24 | 96x24 |
| `art/enemies/lancer.png` | knight in a full great helm with a red plume, red tunic, holding a long lance pointing forward | 32 | 128x32 |
| `art/enemies/netter.png` | hunter in a brown cap and leather vest carrying a rope net | 24 | 96x24 |
| `art/enemies/heavy.png` | big heavy knight in dark plate armor, horned helmet, carrying a tall tower shield | 32 | 128x32 |
| `art/enemies/cleric.png` | priest in a white hood and robe with gold trim, holding a wooden staff with a glowing orb | 24 | 96x24 |
| `art/enemies/boss.png` | the Great Dragon Hunter: huge armored knight with a gold crown on the helmet, red cape and an enormous greatsword | 96 | 384x96 |

## Proyectiles

```
Pixel art sprite sheet of OBJECT, FRAMES frames in one single horizontal row, each frame exactly SIZExSIZE pixels, for a top-down action game, pointing RIGHT when it has a direction. Clean 16-bit pixel art, 1px dark outline, no anti-aliasing, no text, transparent background.
```

| Archivo | OBJECT | FRAMES | SIZE |
|---|---|---|---|
| `art/fx/spit.png` | a small green slime spit ball | 2 | 8 |
| `art/fx/fire_orb.png` | a small spinning fireball with a yellow core | 2 | 12 |
| `art/fx/fire_zone.png` | a patch of burning ground with flickering flames, seen from slightly above | 4 | 32 |
| `art/fx/ice_shard.png` | a sharp ice crystal shard | 2 | 8 |
| `art/fx/lightning_bolt.png` | an electric spark burst | 3 | 16 |
| `art/fx/poison_glob.png` | a glob of bubbling acid-green venom | 2 | 8 |
| `art/fx/spine.png` | a thin purple spine with a green venom tip | 1 | 8 |
| `art/fx/shadow_bolt.png` | a wisp of dark purple shadow with a magenta core and a smoky tail | 2 | 10 |
| `art/fx/arrow.png` | a wooden arrow | 1 | 8 |
| `art/fx/net.png` | a round rope net, seen from above | 1 | 16 |

## Iconos de mejoras (16×16, uno por archivo)

```
A pixel art game icon, exactly 16x16 pixels, of SYMBOL on a dark rounded square with a COLOR border. Bold simple shapes readable at tiny size, 1px dark outline, no text, transparent background outside the square.
```

COLOR: purple (neutrales y estadísticas), orange-red (fuego), light blue (hielo), yellow (rayo), acid green (veneno), crimson (sombra).

| Archivo | SYMBOL |
|---|---|
| `art/icons/poison_breath.png` | a dragon head breathing green venom drops |
| `art/icons/toxic_cloud.png` | a green poison cloud with a skull-shaped hole |
| `art/icons/venom_spines.png` | a burst of purple spines in a circle |
| `art/icons/shadow_breath.png` | a dragon head breathing a dark purple wisp |
| `art/icons/reaper.png` | a dark scythe with a crimson edge |
| `art/icons/void_rift.png` | a swirling black and magenta vortex |

Los símbolos de los iconos antiguos están en la tabla "Ataques y estadísticas" de `docs/ASSETS.md`.

## Suelo

```
A seamless tileable pixel art grass texture, exactly 64x64 pixels, top-down view, soft green meadow with subtle color variation and a few grass blades, no flowers, no objects, tiles perfectly with itself on all four edges.
```

## Problemas habituales y cómo pedir que los arregle

- **Frames de tamaños distintos:** "Redraw it so every frame is exactly the same size, on an invisible grid of N equal columns."
- **Mira a la izquierda:** "Mirror it so the character faces right."
- **Fondo blanco:** "Same image with a fully transparent background, no white."
- **No es una animación:** "Make the 6 frames a smooth loop: frame 1 wings fully up, frame 4 wings fully down, then back up."
- **Demasiado detalle:** "Simplify it so it reads clearly at 32x32 pixels: fewer colors, bigger shapes."
- **Cambia el diseño del dragón entre formas:** "Keep exactly the same head shape, eye and colors as the attached image; only make it bigger and add the new details."
