export interface CardRect { x: number; y: number; w: number; h: number }
export interface CardLayout { mode: 'row' | 'list' | 'grid'; cards: CardRect[] }

const TOP = 34;      // below the screen title
const GAP = 8;
const MIN_ROW_W = 90;
const MIN_LIST_H = 44;

/**
 * Where the choice cards go: a row on wide screens, a list on tall ones, and a 3-column grid when
 * neither fits (square windows), so text never overlaps or gets cut (Playgama 1.6.4, 1.6.8).
 */
export function cardLayout(w: number, h: number, n: number): CardLayout {
  const rowW = Math.min(140, (w - 24 - (n - 1) * GAP) / n);
  if (rowW >= MIN_ROW_W) {
    const ch = Math.min(170, h - 60);
    return { mode: 'row', cards: Array.from({ length: n }, (_, i) => ({ x: w / 2 + (i - (n - 1) / 2) * (rowW + GAP), y: h / 2 + 12, w: rowW, h: ch })) };
  }
  const listH = Math.min(90, (h - 60 - (n - 1) * GAP) / n);
  if (listH >= MIN_LIST_H) {
    return { mode: 'list', cards: Array.from({ length: n }, (_, i) => ({ x: w / 2, y: 40 + listH / 2 + i * (listH + GAP), w: w - 32, h: listH })) };
  }
  const cols = Math.min(n, 3), rows = Math.ceil(n / cols);
  const cw = (w - 24 - (cols - 1) * GAP) / cols;
  const ch = (h - TOP - 18 - (rows - 1) * GAP) / rows;
  const cards: CardRect[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i - r * cols;
    cards.push({ x: w / 2 + (c - (inRow - 1) / 2) * (cw + GAP), y: TOP + 6 + ch / 2 + r * (ch + GAP), w: cw, h: ch });
  }
  return { mode: 'grid', cards };
}
