# Prompts para generar los assets con ChatGPT

Los prompts están en inglés porque los generadores de imágenes suelen hacerles más caso. Puedes pegarlos tal cual.

## Antes de empezar

- **ChatGPT no hace pixel art exacto.** Genera imágenes grandes (por ejemplo 1024×1024) con "píxeles" de tamaño irregular, frames que no encajan en una cuadrícula y a veces con el fondo sin transparencia. Casi siempre tendrás que retocar el resultado.
- **Flujo recomendado:**
  1. Genera el personaje con ChatGPT.
  2. Ábrelo en un editor de pixel art: Aseprite (de pago), Piskel o Pixelorama (gratis, funcionan en el navegador).
  3. Redúcelo al tamaño exacto con escalado "vecino más cercano" (*nearest neighbor*) y limpia los píxeles sueltos.
  4. Monta los frames en una fila con el tamaño de la tabla de `docs/ASSETS.md`.
- **Para que todos los dibujos tengan el mismo estilo,** genera primero el dragón cría, y en cada prompt siguiente adjunta esa imagen y escribe "same art style as the attached image".
- **Truco útil:** haz una captura del juego actual y adjúntala. Los dibujos generados por código ya tienen las proporciones y colores correctos, así que sirven de referencia.

## Bloque de estilo (pégalo al final de cada prompt)

```
Style: clean 16-bit pixel art, limited palette (max 16 colors), 1px dark outline, simple top-left lighting, no anti-aliasing, no blur, no text, no watermark. Side view, character facing RIGHT. Transparent background. Each frame the same size, evenly spaced on a single horizontal row, character centered in each frame with feet at the same height.
```

## Dragones (10 formas, 6 frames de vuelo cada una)

**Cría** (`hatchling`, el primero que debes hacer):
```
A pixel art sprite sheet of a cute baby dragon flying, 6 frames of a wing-flap loop in one horizontal row. Chubby green body, cream belly, big round eye, tiny horns, small stubby wings, short tail. Friendly and readable at small size (32x32 pixels per frame). [STYLE BLOCK]
```

**Joven** (cambia `ELEMENT` por fire, ice o lightning):
```
A pixel art sprite sheet of a young ELEMENT dragon flying, 6 frames of a wing-flap loop in one horizontal row. Same character as the attached baby dragon but older: longer neck, bigger membrane wings, two horns, tail tip shaped like ELEMENT_TIP. Colors: ELEMENT_COLORS. 32x32 pixels per frame. [STYLE BLOCK]
```

**Adulto:**
```
A pixel art sprite sheet of an adult ELEMENT dragon flying, 6 frames of a wing-flap loop in one horizontal row. Same design as the attached young dragon but bigger and fiercer: spikes along the back, larger wings with 3 fingers, longer horns. Colors: ELEMENT_COLORS. 48x48 pixels per frame. [STYLE BLOCK]
```

**Legendario:**
```
A pixel art sprite sheet of a legendary ELEMENT dragon flying, 6 frames of a wing-flap loop in one horizontal row. Same design as the attached adult dragon but majestic: a small crown of horns, five back spikes, huge wings, glowing ELEMENT accents. Colors: ELEMENT_COLORS. 64x64 pixels per frame. [STYLE BLOCK]
```

Valores para rellenar:

| Elemento | ELEMENT_COLORS | ELEMENT_TIP |
|---|---|---|
| fire | red body, golden belly, dark red wings with orange membrane | a flame |
| ice | light blue body, white belly, deep blue wings with pale cyan membrane, white crystal horns | an ice crystal |
| lightning | dark purple body, yellow belly, violet wings, yellow horns and glowing yellow eyes | a lightning bolt |

## Cazadragones (4 frames de andar)

```
A pixel art sprite sheet of a cartoon medieval DESCRIPTION walking, 4-frame walk cycle in one horizontal row, small chibi proportions (big head, short body), facing right. SIZE x SIZE pixels per frame. [STYLE BLOCK]
```

| Archivo | DESCRIPTION | SIZE |
|---|---|---|
| squire | young squire in a blue tunic and steel helmet, small sword and round wooden shield | 24 |
| archer | archer in a green hood and leather armor holding a wooden bow, quiver on the back | 24 |
| lancer | knight in a full great helm with a red plume, red tunic, holding a long lance pointing forward | 32 |
| netter | hunter in a brown cap and leather vest carrying a rope net | 24 |
| heavy | big heavy knight in dark plate armor, horned helmet, carrying a tall tower shield | 32 |
| cleric | priest in a white hood and robe with gold trim, holding a wooden staff with a glowing orb | 24 |
| boss | the Great Dragon Hunter: huge armored knight with a gold crown on the helmet, red cape and an enormous greatsword | 96 |

## Efectos y proyectiles

```
A pixel art sprite sheet of OBJECT, FRAMES frames in one horizontal row, SIZE x SIZE pixels per frame, for a top-down action game. [STYLE BLOCK]
```

| Archivo | OBJECT | FRAMES | SIZE |
|---|---|---|---|
| spit | a small green slime spit ball | 2 | 8 |
| fire_orb | a small spinning fireball with a yellow core | 2 | 12 |
| fire_zone | a patch of burning ground with flickering flames, seen from slightly above | 4 | 32 |
| ice_shard | a sharp ice crystal shard pointing right | 2 | 8 |
| lightning_bolt | an electric spark burst | 3 | 16 |
| arrow | a wooden arrow flying right | 1 | 8 |
| net | a round rope net, seen from above | 1 | 16 |

## Recogibles

```
Pixel art game pickups on a transparent background, one horizontal row: a small green gem (6x6), a medium blue gem (8x8), a large purple gem (10x10), and a gold coin in 2 frames (front and edge-on, 8x8). Shiny highlight, 1px dark outline. [STYLE BLOCK]
```

## Iconos de mejoras (16×16, uno por archivo)

```
A pixel art game icon, 16x16 pixels, of SYMBOL on a dark rounded square tinted COLOR. Readable at tiny size, bold shapes, no text. [STYLE BLOCK]
```

COLOR: purple para los ataques neutrales y las estadísticas, orange-red para fuego, light blue para hielo, yellow para rayo. Los símbolos, de uno en uno, están en la tabla "Ataques y estadísticas" de `docs/ASSETS.md` (gota, cola, ala, escamas, imán…).

## Suelo

```
A seamless tileable pixel art grass texture, 32x32 pixels, top-down view, soft green meadow with subtle color variation and a few grass blades, no flowers, no objects, tiles perfectly with itself on all four edges.
```

## Problemas habituales y cómo pedir que los arregle

- **Los frames salen con tamaños distintos:** "Redraw it so every frame is exactly the same size, on an invisible grid of N equal columns."
- **Sale mirando a la izquierda:** "Mirror it so the character faces right."
- **Fondo blanco en vez de transparente:** "Same image with a fully transparent background, no white."
- **Los frames no forman una animación:** "Make the 6 frames a smooth loop: frame 1 wings fully up, frame 4 wings fully down, then back up."
- **Demasiado detalle para el tamaño:** "Simplify it so it reads clearly at 32x32 pixels: fewer colors, bigger shapes."
