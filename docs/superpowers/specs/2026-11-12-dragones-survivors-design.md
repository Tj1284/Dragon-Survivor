# Dragones Survivors — Documento de diseño

*Fecha: 2026-11-12 · Nombre provisional del juego (el definitivo está pendiente)*

## 1. Intención y porqué

El objetivo es **ganar dinero con anuncios** publicando en CrazyGames y, después, en otros portales (Playgama, Poki, etc.).

En CrazyGames, el dinero depende de superar su **Basic Launch**: una prueba de 7–21 días, con poco tráfico y **sin anuncios**, en la que el juego se compara con el resto de la plataforma en tres métricas:

1. **Conversión a partida**: cuántos visitantes empiezan a jugar.
2. **Tiempo medio de juego.**
3. **Retención**: cuántos vuelven.

Solo los juegos que superan la prueba pasan a **Full Launch**, donde hay anuncios y reparto de ingresos. Si un juego falla en casi todo, no se puede reenviar salvo como juego nuevo. **Todas las decisiones de diseño se valoran por su efecto en esas tres métricas.**

**Reparto de trabajo:** Claude escribe todo el código. El usuario crea todos los assets gráficos (pixel art 2D y spritesheets).

## 2. El juego en una frase

Un survivors 2D en pixel art donde **eres una cría de dragón** que se come a los cazadragones para crecer y **evoluciona de forma visible durante la partida** hacia uno de tres elementos: fuego, hielo o rayo. Las formas conseguidas se guardan en una colección permanente.

## 3. Objetivos, no-objetivos y anti-objetivos

**Objetivos**
- Superar el Basic Launch de CrazyGames.
- Primera partida inmediata: menos de 5 s desde que carga hasta que te mueves, sin tutorial de texto.
- Partidas de unos 10 minutos con sensación de "otra más".
- Motivos para volver otro día: la colección de dragones y las mejoras permanentes compradas con oro.
- Funcionar bien en móvil (táctil) y en PC (teclado).
- Poder publicarlo en otros portales sin reescribir el juego.

**No-objetivos (en esta versión)**
- Multijugador.
- Compras dentro del juego.
- Más de un mapa o bioma.
- Más de 3 elementos.
- Historia o diálogos.

**Anti-objetivos (cosas que lo harían fracasar aunque funcione)**
- Una carga lenta o una pantalla de menú larga antes de jugar, que hunde la conversión.
- Tirones con muchos enemigos en pantalla en un móvil medio.
- Anuncios intrusivos o fuera de las pausas naturales, que incumplen las normas y molestan al jugador.
- Que las tres ramas se jueguen igual y solo cambie el color.
- Que el juego dependa de que el usuario termine todos los assets para poder probarse. Por eso todo funciona con dibujos provisionales.

## 4. Restricciones

- **Plataforma:** juego HTML5 que corre en un iframe de CrazyGames. Para el Full Launch hace falta la integración completa del SDK (anuncios, eventos de carga y de partida, silenciar el audio durante los anuncios).
- **Anuncios:** los intersticiales solo en pausas naturales (entre partidas). Los rewarded solo cuando el jugador los pide. Durante cualquier anuncio el juego se pausa y se silencia.
- **Tamaño de descarga:** lo más pequeño posible. Objetivo propio: **menos de 10 MB** en total y la primera pantalla jugable en menos de 3 s con conexión normal.
- **Móvil:** orientación horizontal y vertical, joystick virtual y botones de al menos 48 px.
- **Sin enlaces externos ni marcas propias** dentro del juego (requisito habitual de los portales).
- **Idiomas:** inglés y español desde el principio, con poco texto en pantalla. Se lee el idioma de la plataforma. *(Decisión de Claude: la audiencia de CrazyGames es mayoritariamente angloparlante.)*

## 5. Enfoques considerados

| Enfoque | A favor | En contra | Decisión |
|---|---|---|---|
| **A. Phaser 4 + TypeScript + Vite** (Phaser 4 es estable desde abril de 2026; la serie 3 ya no recibe versiones nuevas) | Motor web 2D más usado. Spritesheets, colisiones, cámara, sonido y táctil incluidos. Carga ligera. Mucha documentación | Para cientos de enemigos hay que optimizar a mano (pools de objetos, colisiones por cuadrícula) | **Elegido** |
| B. PixiJS + lógica propia | Más ligero, más control | Colisiones, escenas y entrada desde cero: más trabajo y más fallos, sin beneficio visible | Descartado |
| C. Godot u otro motor con exportación web | Editor visual | Carga más pesada y problemas en Safari de iOS, lo que perjudica la conversión | Descartado |

El usuario pidió "la que permita subir a CrazyGames". Las tres lo permiten, pero A es la que mejor cumple las restricciones de carga y móvil.

**SDK de plataforma:** se crea una **capa de plataforma propia** (`platform/`) con una interfaz mínima: `init`, `gameReady`, `gameplayStart`/`Stop`, `loadingStart`/`Stop`, `showInterstitial`, `showRewarded`, `save`/`load`, `language` y eventos de pausa y audio.
- Implementación principal: **Playgama Bridge**, que soporta `crazy_games` y otros 24 portales con el mismo código y reenvía a CrazyGames los eventos de carga y de partida.
- **Por verificar antes de enviar a CrazyGames:** si CrazyGames acepta Bridge para el Full Launch o exige su SDK directo. Si lo exige, se añade una implementación `crazygames` de la misma interfaz y el juego no cambia.
- Implementación `local` para desarrollo: anuncios simulados y guardado en localStorage.

## 6. Diseño del juego

### 6.1 Bucle de partida
1. **Menú mínimo**: un botón grande de "Jugar", más el acceso a "Guarida" (mejoras permanentes) y "Colección". En la primera visita se salta el menú y se entra **directamente a jugar**.
2. **Partida** de unos 10 min:
   - El dragón se mueve y ataca solo.
   - Los enemigos llegan en oleadas que se endurecen con el tiempo.
   - Los enemigos sueltan **gemas de experiencia** y **oro**.
3. **Subida de nivel**: se pausa y se eligen **1 de 3 mejoras**.
4. **Evolución** en niveles fijos (ver 6.3): una animación corta y vistosa, el sprite cambia y el dragón crece.
5. **Minuto 10: jefe final.** Al derrotarlo, victoria.
6. **Fin de partida** (victoria o muerte):
   - Resumen: tiempo, nivel, forma alcanzada y oro.
   - **Rewarded "Duplicar oro"**.
   - Botones "Otra vez" y "Guarida".
   - El intersticial va al pulsar "Otra vez" o al volver al menú, nunca durante la partida.
7. **Muerte**: una vez por partida se ofrece **rewarded "Revivir"** con la vida completa y una onda que aparta a los enemigos.

### 6.2 Controles
- **PC:** WASD o flechas.
- **Móvil:** joystick virtual que aparece donde tocas, en cualquier punto de la pantalla.
- Sin otros botones durante la partida, salvo la pausa.

### 6.3 Evolución y elementos (lo central del juego)
Cuatro etapas, con 10 formas en total:

```
                ┌─ Joven fuego ─ Adulto fuego ─ Legendario fuego
   Cría ────────┼─ Joven hielo ─ Adulto hielo ─ Legendario hielo
                └─ Joven rayo  ─ Adulto rayo  ─ Legendario rayo
```

- **Cuándo se evoluciona** (valores iniciales, se ajustan al probar): Joven en nivel 5, Adulto en nivel 12, Legendario en nivel 20.
- **Cómo se elige el elemento:** cada mejora tiene una etiqueta de elemento (fuego, hielo, rayo o neutra). Al llegar al nivel 5, el dragón evoluciona al elemento con más mejoras elegidas. En caso de empate, al de la mejora más reciente. Si todas son neutras, se ofrece elegir entre los tres. Una vez elegido, el elemento queda fijo toda la partida. **Antes de evolucionar, las opciones de mejora deben mostrar con claridad a qué elemento empujan.**
- **Cada elemento se juega distinto:**
  - **Fuego:** el aliento deja zonas ardiendo que hacen daño en área con el tiempo.
  - **Hielo:** proyectiles que ralentizan y congelan. Los congelados reciben más daño.
  - **Rayo:** ataques que saltan en cadena entre enemigos cercanos.
- **Cada evolución** aumenta el tamaño, la vida máxima y el radio de recogida, y potencia el ataque base del elemento. El paso a Legendario desbloquea un **ataque definitivo** automático de su elemento, con un tiempo de recarga largo.
- **Colección:** cada forma alcanzada por primera vez se guarda para siempre y se ve en la pantalla "Colección", con siluetas de las que faltan. Es el gancho principal para volver.

### 6.4 Mejoras durante la partida
Pool inicial de unas 18–24 mejoras: unas 5–6 por elemento y unas 6 neutras (velocidad, vida, imán, daño, regeneración, recarga). Cada mejora tiene 3–5 niveles. La lista concreta y los números los fija el constructor y se ajustan probando.

### 6.5 Enemigos (cazadragones, estilo cartoon)
De 6 a 8 tipos que van apareciendo según avanza el tiempo, por ejemplo:
- Escudero: básico, lento, en masa.
- Arquero: dispara desde lejos.
- Lancero: carga en línea recta.
- Lanzarredes: ralentiza al dragón.
- Caballero pesado: tanque.
- Mago o clérigo: cura a los demás o pone escudos.

Más un **jefe final**, el Gran Cazadragones, con 2–3 patrones de ataque legibles. Más adelante puede haber minijefes cada 3 minutos (opcional).

### 6.6 Meta-progresión
- **Oro** que se conserva entre partidas.
- **"Guarida"**: unas 6–8 mejoras permanentes compradas con oro, con coste creciente (vida, daño, velocidad, oro extra, revivir con más vida, una opción extra al elegir mejora…).
- **Guardado** con la capa de plataforma: oro, mejoras, colección, ajustes y mejores marcas.

### 6.7 Sonido
Efectos y música sencilla, que tienen que poder silenciarse. El usuario no ha dicho si hará el sonido. Mientras tanto se usarán sonidos libres de derechos (CC0) como provisionales.

## 7. Assets (los hace el usuario)

**Formato propuesto (propuesta de Claude, a confirmar con el usuario):**
- PNG con transparencia. Spritesheet en **una fila horizontal por animación**, con frames del mismo tamaño y sin separación.
- **Pixel art** escalado por enteros. Resolución lógica del juego **480×270** (16:9), escalada en pantalla sin suavizado.
- Tamaño de frame orientativo: cría 24×24, joven 32×32, adulto 48×48, legendario 64×64. Enemigos 24–32. Jefe 96×96.
- Los sprites miran a la derecha. El código los voltea para la izquierda.

**Lista:**
| Asset | Cantidad | Animación |
|---|---|---|
| Formas del dragón | 10 | Solo ciclo de vuelo, 4–6 frames. El destello de daño, la muerte y la transición de evolución van por código |
| Enemigos | 6–8 | Ciclo de andar, 4 frames |
| Jefe | 1 | Andar más 1–2 poses de ataque |
| Proyectiles y efectos por elemento | 3 juegos | 2–4 frames cada uno |
| Recogibles | Gema de XP (3 tamaños), oro, comida o curación | Estáticos o 2 frames |
| Iconos de mejoras | 25–30 | Estáticos, 16×16 o 24×24 |
| Tiles del suelo y decoración | 1 bioma | Estáticos |
| Miniatura del juego para el portal | Tamaños que pida CrazyGames | — |

**Dibujos provisionales:** el constructor genera formas simples de colores con los mismos tamaños, de modo que cada asset real **se sustituye cambiando solo el archivo**, sin tocar código. Habrá un único archivo `assets manifest` con todas las rutas y tamaños de frame.

## 8. Rendimiento
- Objetivo: **60 fps con 300 enemigos y 200 proyectiles** en un móvil de gama media. Mínimo aceptable: 30 fps estables.
- Pools de objetos para enemigos, proyectiles, gemas y textos de daño, sin crear ni destruir durante la partida.
- Colisiones con cuadrícula espacial en lugar de comprobar todos contra todos.
- Un único atlas de texturas para reducir cambios de textura.

## 9. Éxito
- **Corto plazo:** superar el Basic Launch y entrar en Full Launch.
- **Antes de enviar:** varias personas lo prueban sin explicaciones y empiezan a jugar en menos de 5 s. Las partidas de prueba duran más de 5 min de media.
- **Después:** con los datos del panel de CrazyGames, decidir qué actualizar (más elementos, biomas, minijefes).

## 10. Calendario orientativo
De 4 a 6 semanas hasta el envío a Basic Launch, condicionado sobre todo al ritmo de los assets. El código se desarrolla con provisionales en paralelo.

## 11. Lo que queda a criterio del constructor
- La arquitectura interna (escenas, sistemas, estructura de carpetas).
- Todos los números de equilibrio iniciales: vida, daño, oleadas, costes.
- La lista concreta de mejoras y de mejoras permanentes, respetando las proporciones de 6.4 y 6.6.
- El diseño de la UI, mientras sea legible en móvil y respete "un toque para jugar".
- Las herramientas de prueba y depuración (por ejemplo, un modo para saltar a cualquier etapa de evolución).

## 12. Riesgos (siendo sinceros)
- **Género saturado:** el giro de la evolución por elemento y la sensación al jugar tienen que notarse en el primer minuto, o será un survivors más.
- **Carga de assets:** 10 formas más enemigos es mucho dibujo. Si se retrasa, se puede lanzar con menos enemigos, pero no con menos formas, porque son el gancho.
- **Benchmarks desconocidos:** CrazyGames no publica las cifras exactas que hay que superar.
- **SDK:** falta confirmar si Bridge vale para el Full Launch de CrazyGames (ver 5).
