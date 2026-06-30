export const siteMeta = {
  name: 'Quizz Land',
  title: 'Quizz Land - Quiz entre potes, sans compte',
  description:
    'Crée un salon de quiz, invite tes potes et lance la partie en quelques secondes. Aucun compte, juste un lien et un classement.',
  keywords:
    'quiz multijoueur, quiz entre amis, salon quiz, quiz sans compte, questions personnalisées, classement en direct, jeu de soirée',
  locale: 'fr_FR',
  lang: 'fr',
  themeColor: '#e53935',
  defaultImage: '/brand/og-default.png'
};

export function pageTitle(title) {
  return title ? `${title} | ${siteMeta.name}` : siteMeta.title;
}

export function absoluteUrl(path = '/', origin = '') {
  if (!origin) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function cleanCanonicalUrl(url) {
  const next = new URL(url);
  next.hash = '';
  next.search = '';
  return next.toString();
}

export function roomMeta(room) {
  const questionCount = room?.config?.questionCount || room?.questions?.length || 0;
  const theme = room?.config?.themeName || 'quiz';
  const mode = room?.config?.modeName || room?.config?.mode?.name || 'Quiz';
  const status = {
    waiting: 'Salon ouvert',
    playing: `Question ${(room?.currentQuestion ?? 0) + 1}/${Math.max(questionCount, 1)}`,
    finished: 'Classement final',
    closing: 'Salon fermé'
  }[room?.status] || 'Partie prête';

  return {
    title: pageTitle(`${room?.name || 'Salon quiz'} - ${status}`),
    description: `${room?.name || 'Un salon Quizz Land'} t’attend: ${questionCount} questions, ${room?.config?.timePerQuestion || 30}s par question, thème ${theme}. Rejoins la partie avec le lien.`,
    label: `${mode} · ${questionCount} questions · ${status}`
  };
}

export function resultsMeta(room, results = []) {
  const winner = results[0];
  const playerCount = results.length || room?.players?.length || 0;
  return {
    title: pageTitle(winner ? `${winner.name} gagne le quiz` : 'Classement final'),
    description: winner
      ? `${winner.name} termine premier sur ${room?.name || 'Quizz Land'} avec ${winner.score} points. ${playerCount} joueur${playerCount > 1 ? 's' : ''} au classement.`
      : `Classement final du salon ${room?.id || ''} sur Quizz Land.`
  };
}
