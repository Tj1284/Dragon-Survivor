type Dict = Record<string, string>;

const es: Dict = {
  again: 'Otra vez', game_over: 'Fin de la partida', time: 'Tiempo', level_n: 'Nivel {n}', gold: 'Oro', form: 'Forma',
  resume: 'Continuar', paused: 'Pausa',
  choose_upgrade: 'Elige una mejora', choose_element: '¡Elige tu elemento!', lvl_short: 'Nv {n}', new: '¡Nuevo!',
  gold_label: '¡Evolución!',
  fallback: 'Banquete', fallback_d: 'Recupera un 30% de vida y +5 de oro',
  el_fire: 'Fuego', el_fire_d: 'Deja zonas ardiendo',
  el_ice: 'Hielo', el_ice_d: 'Ralentiza y congela',
  el_lightning: 'Rayo', el_lightning_d: 'Salta entre enemigos',
  // attacks
  up_spit: 'Escupitajo', up_spit_d: 'Más daño y más proyectiles',
  up_tail_swipe: 'Coletazo', up_tail_swipe_d: 'Golpea en arco hacia donde miras',
  up_roar: 'Rugido', up_roar_d: 'Empuja y daña a los cercanos',
  up_fire_breath: 'Aliento de fuego', up_fire_breath_d: 'Bolas que dejan suelo ardiendo',
  up_fire_orbit: 'Orbes de fuego', up_fire_orbit_d: 'Orbes que giran a tu alrededor',
  up_meteor: 'Meteoro', up_meteor_d: 'Cae sobre un enemigo y explota',
  up_ice_breath: 'Aliento de hielo', up_ice_breath_d: 'Fragmentos que ralentizan y congelan',
  up_frost_shards: 'Fragmentos de escarcha', up_frost_shards_d: 'Fragmentos en todas direcciones',
  up_frost_aura: 'Aura gélida', up_frost_aura_d: 'Ralentiza y daña a los cercanos',
  up_lightning_breath: 'Aliento de rayo', up_lightning_breath_d: 'Rayo que salta entre enemigos',
  up_thunder_strike: 'Relámpago', up_thunder_strike_d: 'Cae un rayo sobre un enemigo',
  up_static_field: 'Campo estático', up_static_field_d: 'Descargas a los enemigos cercanos',
  // stats
  up_fury: 'Furia', up_fury_d: '+10% de daño',
  up_thick_scales: 'Escamas gruesas', up_thick_scales_d: '+20 de vida máxima',
  up_quick_breath: 'Aliento rápido', up_quick_breath_d: '-8% de recarga',
  up_swift_wings: 'Alas veloces', up_swift_wings_d: '+8% de velocidad',
  up_regen: 'Regeneración', up_regen_d: '+0,5 de vida por segundo',
  up_armor: 'Armadura', up_armor_d: '-1 de daño recibido',
  up_magnet: 'Imán', up_magnet_d: '+20% de radio de recogida',
  // gold evolutions
  gold_tail_swipe: 'Terremoto', gold_tail_swipe_d: 'Onda completa que empuja',
  gold_roar: 'Rugido atronador', gold_roar_d: 'Además aturde 1 segundo',
  gold_fire_breath: 'Infierno', gold_fire_breath_d: 'Zonas más grandes y duraderas',
  gold_fire_orbit: 'Anillo solar', gold_fire_orbit_d: '8 orbes, más lejos y más rápido',
  gold_meteor: 'Lluvia de meteoros', gold_meteor_d: 'Caen tres a la vez',
  gold_ice_breath: 'Ventisca', gold_ice_breath_d: 'Abanico enorme que atraviesa',
  gold_frost_shards: 'Lanzas glaciales', gold_frost_shards_d: 'Atraviesan y congelan',
  gold_frost_aura: 'Cero absoluto', gold_frost_aura_d: 'Congela a quien entra',
  gold_lightning_breath: 'Tormenta en cadena', gold_lightning_breath_d: 'El doble de saltos',
  gold_thunder_strike: 'Juicio del trueno', gold_thunder_strike_d: 'Caen cinco rayos',
  gold_static_field: 'Dinamo', gold_static_field_d: 'Más daño cuanto más te mueves',
};

const en: Dict = {
  again: 'Again', game_over: 'Game over', time: 'Time', level_n: 'Level {n}', gold: 'Gold', form: 'Form',
  resume: 'Resume', paused: 'Paused',
  choose_upgrade: 'Choose an upgrade', choose_element: 'Choose your element!', lvl_short: 'Lv {n}', new: 'New!',
  gold_label: 'Evolution!',
  fallback: 'Feast', fallback_d: 'Heal 30% and +5 gold',
  el_fire: 'Fire', el_fire_d: 'Leaves burning zones',
  el_ice: 'Ice', el_ice_d: 'Slows and freezes',
  el_lightning: 'Lightning', el_lightning_d: 'Chains between enemies',
  up_spit: 'Spit', up_spit_d: 'More damage and more shots',
  up_tail_swipe: 'Tail swipe', up_tail_swipe_d: 'Hits in an arc where you face',
  up_roar: 'Roar', up_roar_d: 'Pushes and hurts nearby enemies',
  up_fire_breath: 'Fire breath', up_fire_breath_d: 'Fireballs that leave burning ground',
  up_fire_orbit: 'Fire orbs', up_fire_orbit_d: 'Orbs circle around you',
  up_meteor: 'Meteor', up_meteor_d: 'Falls on an enemy and explodes',
  up_ice_breath: 'Ice breath', up_ice_breath_d: 'Shards that slow and freeze',
  up_frost_shards: 'Frost shards', up_frost_shards_d: 'Shards in every direction',
  up_frost_aura: 'Frost aura', up_frost_aura_d: 'Slows and hurts nearby enemies',
  up_lightning_breath: 'Lightning breath', up_lightning_breath_d: 'A bolt that jumps between enemies',
  up_thunder_strike: 'Thunder strike', up_thunder_strike_d: 'Lightning falls on an enemy',
  up_static_field: 'Static field', up_static_field_d: 'Zaps nearby enemies',
  up_fury: 'Fury', up_fury_d: '+10% damage',
  up_thick_scales: 'Thick scales', up_thick_scales_d: '+20 max health',
  up_quick_breath: 'Quick breath', up_quick_breath_d: '-8% cooldown',
  up_swift_wings: 'Swift wings', up_swift_wings_d: '+8% speed',
  up_regen: 'Regeneration', up_regen_d: '+0.5 health per second',
  up_armor: 'Armor', up_armor_d: '-1 damage taken',
  up_magnet: 'Magnet', up_magnet_d: '+20% pickup range',
  gold_tail_swipe: 'Earthquake', gold_tail_swipe_d: 'A full shockwave that pushes',
  gold_roar: 'Thunderous roar', gold_roar_d: 'Also stuns for 1 second',
  gold_fire_breath: 'Inferno', gold_fire_breath_d: 'Bigger, longer burning zones',
  gold_fire_orbit: 'Solar ring', gold_fire_orbit_d: '8 orbs, wider and faster',
  gold_meteor: 'Meteor shower', gold_meteor_d: 'Three fall at once',
  gold_ice_breath: 'Blizzard', gold_ice_breath_d: 'A huge fan that pierces',
  gold_frost_shards: 'Glacial lances', gold_frost_shards_d: 'They pierce and freeze',
  gold_frost_aura: 'Absolute zero', gold_frost_aura_d: 'Freezes whoever walks in',
  gold_lightning_breath: 'Chain storm', gold_lightning_breath_d: 'Twice the jumps',
  gold_thunder_strike: 'Thunder judgment', gold_thunder_strike_d: 'Five bolts fall',
  gold_static_field: 'Dynamo', gold_static_field_d: 'More damage the more you move',
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
