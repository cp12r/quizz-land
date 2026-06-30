import { validateQuestionPack } from '../../../server/lib/questionValidator.js';

export const quizThemes = [
  {
    id: 'neon',
    name: 'Néon Pop',
    label: 'Rose électrique + cyan',
    className: 'theme-neon',
    icon: '/season-1/icons/theme-neon.svg',
    colors: ['#ff4f79', '#39d5ff'],
    motion: 'float',
    badge: 'Live'
  },
  {
    id: 'candy',
    name: 'Candy Rush',
    label: 'Corail + miel',
    className: 'theme-candy',
    icon: '/season-1/icons/theme-candy.svg',
    colors: ['#ff5a5f', '#ffd54a'],
    motion: 'bounce',
    badge: 'Fun'
  },
  {
    id: 'arcade',
    name: 'Arcade Volt',
    label: 'Vert laser + bleu',
    className: 'theme-arcade',
    icon: '/season-1/icons/theme-arcade.svg',
    colors: ['#36d27c', '#39d5ff'],
    motion: 'glitch',
    badge: 'Boost'
  },
  {
    id: 'studio',
    name: 'Studio Dark',
    label: 'Graphite + rouge',
    className: 'theme-studio',
    icon: '/season-1/icons/theme-studio.svg',
    colors: ['#e6e8ef', '#e53935'],
    motion: 'pulse',
    badge: 'Focus'
  }
];

export const categories = ['culture', 'science', 'web', 'cinéma', 'sport'];

export const gameModes = [
  {
    id: 'classic',
    name: 'Classic Quiz',
    label: 'Quiz net, rapide, efficace',
    questionCount: 8,
    timePerQuestion: 30,
    bonusTimer: true,
    scoreMultiplier: 1,
    categories: null,
    shuffleAnswers: false
  },
  {
    id: 'chaos',
    name: 'Chaos Mode',
    label: 'Questions pièges et rythme nerveux',
    questionCount: 12,
    timePerQuestion: 15,
    bonusTimer: true,
    scoreMultiplier: 1.15,
    categories: null,
    shuffleAnswers: true
  },
  {
    id: 'world-cup-2026',
    name: 'World Cup 2026',
    label: 'Ambiance stade et clutch',
    questionCount: 10,
    timePerQuestion: 25,
    bonusTimer: true,
    scoreMultiplier: 1.2,
    categories: ['sport'],
    shuffleAnswers: false
  },
  {
    id: 'blindtest',
    name: 'Blindtest',
    label: 'Prêt pour les sons',
    questionCount: 8,
    timePerQuestion: 20,
    bonusTimer: true,
    scoreMultiplier: 1.1,
    categories: ['culture', 'web'],
    shuffleAnswers: true
  },
  {
    id: 'duel',
    name: 'Duel',
    label: 'Face-a-face express',
    questionCount: 7,
    timePerQuestion: 18,
    bonusTimer: true,
    scoreMultiplier: 1.25,
    categories: null,
    shuffleAnswers: false
  }
];

const rawQuestions = [
  {
    id: 'q1',
    category: 'culture',
    text: 'Quelle ville est surnommée la Ville Lumière ?',
    answers: ['Lyon', 'Paris', 'Bruxelles', 'Genève'],
    correctIndex: 1
  },
  {
    id: 'q2',
    category: 'science',
    text: 'Quelle planète est la plus proche du Soleil ?',
    answers: ['Venus', 'Mars', 'Mercure', 'Jupiter'],
    correctIndex: 2
  },
  {
    id: 'q3',
    category: 'web',
    text: 'Quel protocole sécurise les connexions web modernes ?',
    answers: ['FTP', 'HTTPS', 'SMTP', 'DNS'],
    correctIndex: 1
  },
  {
    id: 'q4',
    category: 'cinéma',
    text: 'Qui a réalisé Jurassic Park ?',
    answers: ['James Cameron', 'Steven Spielberg', 'Ridley Scott', 'Sofia Coppola'],
    correctIndex: 1
  },
  {
    id: 'q5',
    category: 'sport',
    text: 'Combien de joueurs une équipe de football aligne-t-elle au coup d’envoi ?',
    answers: ['9', '10', '11', '12'],
    correctIndex: 2
  },
  {
    id: 'q6',
    category: 'science',
    text: 'Quelle unité mesure la résistance électrique ?',
    answers: ['Volt', 'Watt', 'Ohm', 'Ampere'],
    correctIndex: 2
  },
  {
    id: 'q7',
    category: 'web',
    text: 'Quel outil est utilise par SvelteKit pour le build local ?',
    answers: ['Webpack', 'Vite', 'Parcel', 'Rollup CLI'],
    correctIndex: 1
  },
  {
    id: 'q8',
    category: 'culture',
    text: 'Dans quel pays se trouve Kyoto ?',
    answers: ['Chine', 'Corée du Sud', 'Japon', 'Thaïlande'],
    correctIndex: 2
  },
  {
    id: 'q9',
    category: 'cinéma',
    text: 'Quel film met en scène le personnage de Neo ?',
    answers: ['Inception', 'The Matrix', 'Tron', 'Blade Runner'],
    correctIndex: 1
  },
  {
    id: 'q10',
    category: 'sport',
    text: 'Quel tournoi de tennis se joue sur gazon à Londres ?',
    answers: ['Roland-Garros', 'US Open', 'Wimbledon', 'Open d’Australie'],
    correctIndex: 2
  },
  {
    id: 'q11',
    category: 'web',
    text: 'Que signifie CSS ?',
    answers: ['Creative Style System', 'Cascading Style Sheets', 'Computer Style Script', 'Client Server Sheet'],
    correctIndex: 1
  },
  {
    id: 'q12',
    category: 'culture',
    text: 'Quel instrument est associé à Miles Davis ?',
    answers: ['Trompette', 'Piano', 'Batterie', 'Saxophone'],
    correctIndex: 0
  }
];

export const { questions } = validateQuestionPack(rawQuestions, 'builtin');

function cleanString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

export function normalizeCategory(value) {
  const category = cleanString(value).toLowerCase();
  return category === 'cinema' ? 'cinéma' : category;
}

export function normalizeTheme(themeId) {
  return quizThemes.find((theme) => theme.id === themeId) || quizThemes[0];
}

export function normalizeGameMode(modeId) {
  return gameModes.find((mode) => mode.id === modeId) || gameModes[0];
}

export function normalizeQuestions(input = []) {
  const source = Array.isArray(input) ? input.slice(0, 80) : [];
  const prepared = source.map((item, index) => ({
    ...item,
    id: cleanString(item?.id, `custom-${index + 1}`),
    category: normalizeCategory(item?.category || 'perso')
  }));
  return validateQuestionPack(prepared, 'custom').questions.map((question) => ({
    ...question,
    category: normalizeCategory(question.category)
  }));
}

function withUniqueQuestionIds(items) {
  const seen = new Map();

  return items.map((question, index) => {
    const count = seen.get(question.id) || 0;
    seen.set(question.id, count + 1);

    if (count === 0) return question;
    return { ...question, id: `${question.id}-repeat-${index + 1}` };
  });
}

export function pickQuestions(selectedCategories = categories, count = 10, customQuestions = []) {
  const hasExplicitCategories = Array.isArray(selectedCategories);
  const wanted = hasExplicitCategories ? selectedCategories.map(normalizeCategory).filter(Boolean) : categories;
  const normalizedCustom = normalizeQuestions(customQuestions);
  const standardPool = wanted.length ? questions.filter((question) => wanted.includes(question.category)) : [];
  const source = [...standardPool, ...normalizedCustom];
  const fallback = source.length ? source : questions;
  const customOnly = hasExplicitCategories && wanted.length === 0 && normalizedCustom.length > 0;
  const limit = customOnly ? normalizedCustom.length : Math.max(1, Number(count) || 10);

  if (limit <= fallback.length) {
    return withUniqueQuestionIds([...fallback].sort(() => Math.random() - 0.5).slice(0, limit));
  }

  const picked = [];
  while (picked.length < limit) {
    const cycle = [...fallback].sort(() => Math.random() - 0.5);
    for (const question of cycle) {
      if (picked.length >= limit) break;
      picked.push(question);
    }
  }

  return withUniqueQuestionIds(picked);
}
