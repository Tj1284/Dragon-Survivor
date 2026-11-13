/**
 * Silkscreen is a pixel font drawn on an 8 px grid: use it only at 8 px or 16 px and render at resolution 1
 * so every glyph lands on whole game pixels. Monospace keeps the game readable if the font can't load.
 */
export const FONT = '"Silkscreen", monospace';
export const TEXT = { fontFamily: FONT, color: '#ffffff', resolution: 1 } as const;
