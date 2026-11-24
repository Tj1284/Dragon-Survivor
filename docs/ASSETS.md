# Guía de assets

Esta guía explica cómo preparar cada dibujo del juego para que el código lo cargue directamente.

## Reglas para todos los archivos

- **Formato:** PNG con fondo transparente.
- **Estilo:** pixel art. El juego lo escala sin suavizado, así que dibuja a tamaño real (1 píxel del archivo = 1 píxel del juego).
- **Spritesheets:** todos los frames de una animación en **una sola fila horizontal**, del mismo tamaño y **sin separación** entre ellos. Ejemplo: el ciclo de vuelo de la cría son 6 frames de 32×32, así que el PNG mide 192×32.
- **Dirección:** los personajes **miran a la derecha**. El juego los voltea solo cuando van a la izquierda.
- **Centrado:** cada personaje centrado en su frame, con el cuerpo a la misma altura en todos los frames, para que no "salte" al animarse.
- **Animaciones que NO hace falta dibujar:** el destello al recibir daño, la muerte, la transición de evolución y el aliento ya los hace el código.
- **Velocidad:** las animaciones se reproducen a 8 frames por segundo, en bucle.

## Cómo sustituir un provisional

1. Guarda el PNG con el **nombre y la ruta exactos** de las tablas de abajo, dentro de la carpeta `art/` del proyecto.
2. Recarga el juego. Si el archivo existe, se usa el tuyo; si no, sigue saliendo el rectángulo de colores provisional.
3. Si un dibujo sale cortado o descolocado, revisa que el tamaño total del PNG sea exactamente el de la tabla.

No hace falta tocar código. Si quieres cambiar el tamaño de un frame o el número de frames, dímelo y lo ajusto en el manifiesto (`src/assets/manifest.ts`).

## Lista completa

### Dragones (ciclo de vuelo)

Cría = `hatchling`, joven = `young_*`, adulto = `adult_*`, legendario = `legendary_*`. fire = fuego, ice = hielo, lightning = rayo, poison = veneno, shadow = sombra.

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/dragons/hatchling.png` | 32×32 | 6 | 192×32 |
| `art/dragons/young_fire.png` | 32×32 | 6 | 192×32 |
| `art/dragons/young_ice.png` | 32×32 | 6 | 192×32 |
| `art/dragons/young_lightning.png` | 32×32 | 6 | 192×32 |
| `art/dragons/young_poison.png` | 40×40 | 6 | 240×40 |
| `art/dragons/young_shadow.png` | 40×40 | 6 | 240×40 |
| `art/dragons/adult_fire.png` | 48×48 | 6 | 288×48 |
| `art/dragons/adult_ice.png` | 48×48 | 6 | 288×48 |
| `art/dragons/adult_lightning.png` | 48×48 | 6 | 288×48 |
| `art/dragons/adult_poison.png` | 48×48 | 6 | 288×48 |
| `art/dragons/adult_shadow.png` | 48×48 | 6 | 288×48 |
| `art/dragons/legendary_fire.png` | 96×96 | 6 | 576×96 |
| `art/dragons/legendary_ice.png` | 96×96 | 6 | 576×96 |
| `art/dragons/legendary_lightning.png` | 96×96 | 6 | 576×96 |
| `art/dragons/legendary_poison.png` | 96×96 | 6 | 576×96 |
| `art/dragons/legendary_shadow.png` | 96×96 | 6 | 576×96 |

### Enemigos (ciclo de andar)

squire = escudero, archer = arquero, lancer = lancero, netter = lanzarredes, heavy = caballero pesado, cleric = clérigo, boss = Gran Cazadragones (se usará en el Plan 2).

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/enemies/squire.png` | 24×24 | 4 | 96×24 |
| `art/enemies/archer.png` | 24×24 | 4 | 96×24 |
| `art/enemies/lancer.png` | 32×32 | 4 | 128×32 |
| `art/enemies/netter.png` | 24×24 | 4 | 96×24 |
| `art/enemies/heavy.png` | 32×32 | 4 | 128×32 |
| `art/enemies/cleric.png` | 24×24 | 4 | 96×24 |
| `art/enemies/boss.png` | 96×96 | 4 | 384×96 |

### Efectos y proyectiles

spit = escupitajo de la cría, fire_zone = zona ardiendo, ice_shard = fragmento de hielo, lightning_bolt = chispa de rayo, arrow = flecha, net = red, fire_orb = orbe de fuego, poison_glob = bola de veneno, spine = púa venenosa, shadow_bolt = espíritu de sombra.

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/fx/spit.png` | 8×8 | 2 | 16×8 |
| `art/fx/fire_zone.png` | 32×32 | 4 | 128×32 |
| `art/fx/ice_shard.png` | 8×8 | 2 | 16×8 |
| `art/fx/lightning_bolt.png` | 16×16 | 3 | 48×16 |
| `art/fx/arrow.png` | 8×8 | 1 | 8×8 |
| `art/fx/net.png` | 16×16 | 1 | 16×16 |
| `art/fx/fire_orb.png` | 12×12 | 2 | 24×12 |
| `art/fx/poison_glob.png` | 8×8 | 2 | 16×8 |
| `art/fx/spine.png` | 8×8 | 1 | 8×8 |
| `art/fx/shadow_bolt.png` | 10×10 | 2 | 20×10 |

### Recogibles

gem_s/m/l = gemas de experiencia pequeña, mediana y grande; gold = moneda de oro.

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/pickups/gem_s.png` | 6×6 | 1 | 6×6 |
| `art/pickups/gem_m.png` | 8×8 | 1 | 8×8 |
| `art/pickups/gem_l.png` | 10×10 | 1 | 10×10 |
| `art/pickups/gold.png` | 8×8 | 2 | 16×8 |
| `art/pickups/chest.png` | 16×16 | 2 | 32×16 |

### Iconos de ataques y estadísticas

El nombre de cada icono es el del ataque o la estadística (ver la tabla de más abajo).

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/icons/spit.png` | 16×16 | 1 | 16×16 |
| `art/icons/tail_swipe.png` | 16×16 | 1 | 16×16 |
| `art/icons/roar.png` | 16×16 | 1 | 16×16 |
| `art/icons/fire_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/fire_orbit.png` | 16×16 | 1 | 16×16 |
| `art/icons/meteor.png` | 16×16 | 1 | 16×16 |
| `art/icons/ice_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/frost_shards.png` | 16×16 | 1 | 16×16 |
| `art/icons/frost_aura.png` | 16×16 | 1 | 16×16 |
| `art/icons/lightning_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/thunder_strike.png` | 16×16 | 1 | 16×16 |
| `art/icons/static_field.png` | 16×16 | 1 | 16×16 |
| `art/icons/poison_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/toxic_cloud.png` | 16×16 | 1 | 16×16 |
| `art/icons/venom_spines.png` | 16×16 | 1 | 16×16 |
| `art/icons/shadow_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/reaper.png` | 16×16 | 1 | 16×16 |
| `art/icons/void_rift.png` | 16×16 | 1 | 16×16 |
| `art/icons/fury.png` | 16×16 | 1 | 16×16 |
| `art/icons/thick_scales.png` | 16×16 | 1 | 16×16 |
| `art/icons/quick_breath.png` | 16×16 | 1 | 16×16 |
| `art/icons/swift_wings.png` | 16×16 | 1 | 16×16 |
| `art/icons/regen.png` | 16×16 | 1 | 16×16 |
| `art/icons/armor.png` | 16×16 | 1 | 16×16 |
| `art/icons/magnet.png` | 16×16 | 1 | 16×16 |

### Suelo

Un tile que se repite en todas direcciones: tiene que encajar consigo mismo por los cuatro bordes.

| Archivo | Frame | Frames | Tamaño total del PNG |
|---|---|---|---|
| `art/tiles/ground.png` | 64×64 | 1 | 64×64 |

### Interfaz (menú, botones, paneles e iconos)

Estos no tienen sustituto dibujado por código: si falta alguno, el juego vuelve a los botones y rectángulos planos. `tools/slice_ui.py` los genera a partir de las imágenes de ChatGPT.

| Archivo | Frame | Frames | Tamaño total del PNG | Qué es |
|---|---|---|---|---|
| `art/ui/logo.png` | 240×40 | 1 | 240×40 | Logo del título |
| `art/ui/bg.png` | 600×270 | 1 | 600×270 | Fondo del menú y las pantallas |
| `art/ui/icons.png` | 16×16 | 12 | 192×16 | Moneda, pausa, play, sonido, silencio, guarida, libro, atrás, candado, corazón, espadas, reloj |
| `art/ui/panel.png` | 48×48 | 1 | 48×48 | Panel que se estira |
| `art/ui/button.png` | 48×16 | 3 | 144×16 | Botón en gris (normal, encima, pulsado); el juego lo tiñe de cada color |
| `art/ui/card.png` | 48×64 | 2 | 96×64 | Carta normal y dorada |

## Ataques y estadísticas (para los iconos)

| Icono | Qué es | Elemento |
|---|---|---|
| spit | Escupitajo: el ataque inicial de la cría | neutral |
| tail_swipe | Coletazo: golpe en arco | neutral |
| roar | Rugido: empuja a los cercanos | neutral |
| fire_breath | Aliento de fuego: bolas que dejan suelo ardiendo | fuego |
| fire_orbit | Orbes de fuego que giran a tu alrededor | fuego |
| meteor | Meteoro que cae y explota | fuego |
| ice_breath | Aliento de hielo: abanico de fragmentos | hielo |
| frost_shards | Fragmentos de escarcha en todas direcciones | hielo |
| frost_aura | Aura gélida: ralentiza a los cercanos | hielo |
| lightning_breath | Aliento de rayo: salta entre enemigos | rayo |
| thunder_strike | Relámpago que cae sobre un enemigo | rayo |
| static_field | Campo estático: descargas cercanas | rayo |
| poison_breath | Aliento venenoso: bolas que envenenan | veneno |
| toxic_cloud | Nube tóxica que envenena a quien la cruza | veneno |
| venom_spines | Púas venenosas en anillo | veneno |
| shadow_breath | Aliento de sombra: espíritus que persiguen | sombra |
| reaper | Guadaña: barrido que remata a los débiles | sombra |
| void_rift | Grieta del vacío: atrae y estalla | sombra |
| fury | Furia: más daño | estadística |
| thick_scales | Escamas gruesas: más vida | estadística |
| quick_breath | Aliento rápido: menos recarga | estadística |
| swift_wings | Alas veloces: más velocidad | estadística |
| regen | Regeneración | estadística |
| armor | Armadura: menos daño recibido | estadística |
| magnet | Imán: recoges desde más lejos | estadística |

## Prioridad sugerida

1. `hatchling` y `squire`: con eso ya ves la primera partida con dibujos tuyos.
2. El suelo y las gemas.
3. Las formas jóvenes y adultas de los tres elementos.
4. El resto de enemigos.
5. Las formas legendarias, los efectos y los iconos.
