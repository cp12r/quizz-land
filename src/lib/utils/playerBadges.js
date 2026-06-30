const BADGES = [
  { id: 'rookie', label: 'Rookie', icon: 'R', tone: '#39d5ff' },
  { id: 'supporter', label: 'Supporter', icon: 'S', tone: '#36d27c' },
  { id: 'tryhard', label: 'Déterminé', icon: 'D', tone: '#ffd54a' },
  { id: 'goat', label: 'GOAT', icon: 'G', tone: '#ff5a5f' },
  { id: 'invincible', label: 'Invincible', icon: 'I', tone: '#e6e8ef' },
  { id: 'clutch', label: 'Clutch', icon: 'C', tone: '#7c5cff' },
  { id: 'no-brain', label: 'Instinctif', icon: 'I', tone: '#ff8f3d' },
  { id: 'speed-demon', label: 'Rapide', icon: 'V', tone: '#39d5ff' },
  { id: 'comeback-king', label: 'Retour gagnant', icon: 'R', tone: '#36d27c' },
  { id: 'champion', label: 'Champion', icon: '1', tone: '#ffd54a' }
];

export function getBadgeCatalog() {
  return BADGES;
}

export function getPlayerBadge(player, index = 0, players = []) {
  const score = Number(player?.score || 0);
  const topScore = Math.max(...players.map((item) => Number(item?.score || 0)), 0);
  const playerCount = Math.max(players.length, 1);
  const rankPercent = ((index + 1) / playerCount) * 100;

  if (index === 0 && score >= topScore && score > 0) return byId('champion');
  if (index === 0) return byId('goat');
  if (score === 0) return byId('no-brain');
  if (rankPercent <= 20) return byId('tryhard');
  if (playerCount >= 4 && index === playerCount - 1 && score > 0) return byId('comeback-king');
  if (score >= topScore * 0.85 && score > 0) return byId('clutch');
  if (score >= 500) return byId('speed-demon');
  if (score >= 300) return byId('invincible');
  if (score >= 100) return byId('supporter');
  return byId('rookie');
}

function byId(id) {
  return BADGES.find((badge) => badge.id === id) || BADGES[0];
}
