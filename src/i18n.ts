type Dict = Record<string, string>;

const es: Dict = {
  again: 'Otra vez',
  game_over: 'Fin de la partida',
  time: 'Tiempo',
  level_n: 'Nivel {n}',
  gold: 'Oro',
  form: 'Forma',
  resume: 'Continuar',
  paused: 'Pausa',
};

const en: Dict = {
  again: 'Again',
  game_over: 'Game over',
  time: 'Time',
  level_n: 'Level {n}',
  gold: 'Gold',
  form: 'Form',
  resume: 'Resume',
  paused: 'Paused',
};

const DICTS: Record<string, Dict> = { es, en };
let current: Dict = es;

/** Accepts codes like 'es', 'es-MX', 'en-US'; anything without a dictionary falls back to English. */
export function setLanguage(lang: string): void {
  const code = lang.toLowerCase().split('-')[0];
  current = DICTS[code] ?? en;
}

export function addStrings(lang: 'es' | 'en', strings: Dict): void {
  Object.assign(DICTS[lang], strings);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = current[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
