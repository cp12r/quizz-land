const ICON_BY_CATEGORY = {
  gaming: 'gaming',
  game: 'gaming',
  jeux: 'gaming',
  cinema: 'cinema',
  film: 'cinema',
  series: 'series',
  serie: 'series',
  musique: 'musique',
  music: 'musique',
  rap: 'rap-fr',
  'rap-fr': 'rap-fr',
  rapfr: 'rap-fr',
  'rap-us': 'rap-us',
  rapus: 'rap-us',
  anime: 'anime',
  manga: 'anime',
  pokemon: 'anime',
  memes: 'memes',
  meme: 'memes',
  discord: 'discord',
  geographie: 'geographie',
  geo: 'geographie',
  science: 'sciences',
  sciences: 'sciences',
  football: 'football',
  foot: 'football',
  histoire: 'histoire',
  sport: 'sport',
  culture: 'culture-gen',
  'culture-gen': 'culture-gen',
  culturegen: 'culture-gen',
  web: 'internet',
  internet: 'internet',
  quiz: 'logo-quiz',
  youtube: 'logo-quiz',
  pieges: 'pieges',
  marvel: 'crown',
  blindtest: 'blindtest',
  duel: 'duel',
  chaos: 'chaos',
  timer: 'timer'
};

const FRAME_BY_CATEGORY = {
  gaming: 'electric',
  game: 'electric',
  jeux: 'electric',
  cinema: 'fire',
  film: 'fire',
  series: 'neon-glitch',
  serie: 'neon-glitch',
  musique: 'love',
  music: 'love',
  rap: 'golden',
  'rap-fr': 'golden',
  rapfr: 'golden',
  'rap-us': 'golden',
  rapus: 'golden',
  anime: 'space',
  manga: 'space',
  pokemon: 'slime',
  memes: 'neon-glitch',
  meme: 'neon-glitch',
  discord: 'neon-glitch',
  geographie: 'ice',
  geo: 'ice',
  science: 'electric',
  sciences: 'electric',
  football: 'slime',
  foot: 'slime',
  histoire: 'royal',
  sport: 'royal',
  culture: 'space',
  'culture-gen': 'space',
  culturegen: 'space',
  web: 'neon-glitch',
  quiz: 'neon-glitch',
  youtube: 'golden',
  pieges: 'halloween',
  marvel: 'royal',
  blindtest: 'love',
  duel: 'fire',
  chaos: 'space',
  timer: 'electric'
};

function normalizeAssetKey(category = '') {
  return String(category)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getSeasonIcon(category) {
  const key = normalizeAssetKey(category);
  const id = ICON_BY_CATEGORY[key] || ICON_BY_CATEGORY[key.replaceAll('-', '')] || 'logo-quiz';
  return `/season-1/icons/${id}.svg`;
}

export function getSeasonFrame(category) {
  const key = normalizeAssetKey(category);
  const id = FRAME_BY_CATEGORY[key] || FRAME_BY_CATEGORY[key.replaceAll('-', '')] || 'neon-glitch';
  return `/season-1/frames/${id}.svg`;
}

export function getSeasonAssetLabel(category) {
  return String(category || 'Quiz');
}
