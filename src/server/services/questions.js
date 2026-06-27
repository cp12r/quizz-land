export const quizThemes = [
  { id: 'neon', name: 'Néon Pop', className: 'theme-neon' },
  { id: 'candy', name: 'Bonbon', className: 'theme-candy' },
  { id: 'arcade', name: 'Arcade', className: 'theme-arcade' },
  { id: 'studio', name: 'Studio', className: 'theme-studio' }
];

export const categories = ['culture', 'science', 'web', 'cinéma', 'sport'];

export const questions = [
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

export function normalizeQuestions(input = []) {
  const source = Array.isArray(input) ? input : [];

  return source
    .slice(0, 80)
    .map((item, index) => {
      const answers = Array.isArray(item.answers)
        ? item.answers
        : Array.isArray(item.choices)
          ? item.choices
          : [];
      const cleanAnswers = answers.map((answer) => cleanString(answer)).filter(Boolean).slice(0, 6);
      const correctIndex = Number(item.correctIndex ?? item.correct ?? item.answerIndex);
      const category = normalizeCategory(item.category || 'perso').slice(0, 32) || 'perso';
      const text = cleanString(item.text ?? item.question).slice(0, 220);
      const image = cleanString(item.image ?? item.imageUrl).slice(0, 600);
      const imageAlt = cleanString(item.imageAlt ?? item.alt).slice(0, 140);

      if (!text || cleanAnswers.length < 2 || !Number.isInteger(correctIndex)) return null;
      if (correctIndex < 0 || correctIndex >= cleanAnswers.length) return null;

      return {
        id: cleanString(item.id, `custom-${index + 1}`).slice(0, 80),
        category,
        text,
        answers: cleanAnswers,
        correctIndex,
        ...(image ? { image } : {}),
        ...(imageAlt ? { imageAlt } : {})
      };
    })
    .filter(Boolean);
}

export function pickQuestions(selectedCategories = categories, count = 10, customQuestions = []) {
  const hasExplicitCategories = Array.isArray(selectedCategories);
  const wanted = hasExplicitCategories ? selectedCategories.map(normalizeCategory).filter(Boolean) : categories;
  const normalizedCustom = normalizeQuestions(customQuestions);
  const standardPool = wanted.length ? questions.filter((question) => wanted.includes(question.category)) : [];
  const source = [...standardPool, ...normalizedCustom];
  const fallback = source.length ? source : questions;
  const customOnly = hasExplicitCategories && wanted.length === 0 && normalizedCustom.length > 0;
  const limit = customOnly ? normalizedCustom.length : Math.max(1, Math.min(Number(count) || 10, fallback.length));

  return [...fallback].sort(() => Math.random() - 0.5).slice(0, limit);
}
