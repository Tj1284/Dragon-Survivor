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
  choose_upgrade: 'Elige una mejora',
  choose_element: '¡Elige tu elemento!',
  lvl_short: 'Nv {n}',
  new: '¡Nuevo!',
  fallback: 'Banquete',
  fallback_d: 'Recupera un 30% de vida y +5 de oro',
  el_fire: 'Fuego', el_fire_d: 'Deja zonas ardiendo',
  el_ice: 'Hielo', el_ice_d: 'Ralentiza y congela',
  el_lightning: 'Rayo', el_lightning_d: 'Salta entre enemigos',
  up_swift_wings: 'Alas veloces', up_swift_wings_d: '+8% de velocidad',
  up_thick_scales: 'Escamas gruesas', up_thick_scales_d: '+20 de vida máxima',
  up_magnet: 'Imán', up_magnet_d: '+20% de radio de recogida',
  up_fury: 'Furia', up_fury_d: '+10% de daño',
  up_quick_breath: 'Aliento rápido', up_quick_breath_d: '-8% de recarga',
  up_regen: 'Regeneración', up_regen_d: '+0,5 de vida por segundo',
  up_fire_orbit: 'Orbes de fuego', up_fire_orbit_d: 'Orbes que giran a tu alrededor',
  up_ember_trail: 'Brasas', up_ember_trail_d: 'Las zonas de fuego duran más',
  up_wider_flames: 'Llamas amplias', up_wider_flames_d: 'Zonas de fuego más grandes',
  up_searing: 'Abrasador', up_searing_d: '+25% de daño de quemadura',
  up_fire_burst: 'Estallido', up_fire_burst_d: 'Los enemigos pueden explotar al morir',
  up_frost_shards: 'Fragmentos de escarcha', up_frost_shards_d: 'Disparas fragmentos de hielo',
  up_deep_chill: 'Frío intenso', up_deep_chill_d: 'El hielo ralentiza más',
  up_shatter: 'Quebrar', up_shatter_d: 'Más daño a enemigos congelados',
  up_ice_armor: 'Armadura de hielo', up_ice_armor_d: '-1 de daño recibido',
  up_frost_aura: 'Aura gélida', up_frost_aura_d: 'Ralentiza a los enemigos cercanos',
  up_thunder_strike: 'Relámpago', up_thunder_strike_d: 'Cae un rayo sobre un enemigo',
  up_extra_jump: 'Salto extra', up_extra_jump_d: 'El rayo encadena un enemigo más',
  up_static_charge: 'Carga estática', up_static_charge_d: 'El rayo salta más lejos',
  up_overcharge: 'Sobrecarga', up_overcharge_d: 'El rayo pierde menos daño al saltar',
  up_spark_speed: 'Chispa rápida', up_spark_speed_d: 'El rayo recarga antes',
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
  choose_upgrade: 'Choose an upgrade',
  choose_element: 'Choose your element!',
  lvl_short: 'Lv {n}',
  new: 'New!',
  fallback: 'Feast',
  fallback_d: 'Heal 30% and +5 gold',
  el_fire: 'Fire', el_fire_d: 'Leaves burning zones',
  el_ice: 'Ice', el_ice_d: 'Slows and freezes',
  el_lightning: 'Lightning', el_lightning_d: 'Chains between enemies',
  up_swift_wings: 'Swift wings', up_swift_wings_d: '+8% speed',
  up_thick_scales: 'Thick scales', up_thick_scales_d: '+20 max health',
  up_magnet: 'Magnet', up_magnet_d: '+20% pickup range',
  up_fury: 'Fury', up_fury_d: '+10% damage',
  up_quick_breath: 'Quick breath', up_quick_breath_d: '-8% cooldown',
  up_regen: 'Regeneration', up_regen_d: '+0.5 health per second',
  up_fire_orbit: 'Fire orbs', up_fire_orbit_d: 'Orbs circle around you',
  up_ember_trail: 'Embers', up_ember_trail_d: 'Fire zones last longer',
  up_wider_flames: 'Wide flames', up_wider_flames_d: 'Bigger fire zones',
  up_searing: 'Searing', up_searing_d: '+25% burn damage',
  up_fire_burst: 'Burst', up_fire_burst_d: 'Enemies may explode on death',
  up_frost_shards: 'Frost shards', up_frost_shards_d: 'Shoot shards of ice',
  up_deep_chill: 'Deep chill', up_deep_chill_d: 'Ice slows more',
  up_shatter: 'Shatter', up_shatter_d: 'More damage to frozen enemies',
  up_ice_armor: 'Ice armor', up_ice_armor_d: '-1 damage taken',
  up_frost_aura: 'Frost aura', up_frost_aura_d: 'Slows nearby enemies',
  up_thunder_strike: 'Thunder strike', up_thunder_strike_d: 'Lightning hits an enemy',
  up_extra_jump: 'Extra jump', up_extra_jump_d: 'Lightning chains one more enemy',
  up_static_charge: 'Static charge', up_static_charge_d: 'Lightning jumps farther',
  up_overcharge: 'Overcharge', up_overcharge_d: 'Lightning loses less damage per jump',
  up_spark_speed: 'Quick spark', up_spark_speed_d: 'Lightning recharges faster',
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
