export const siteMeta = {
  name: 'Quizz Land',
  title: 'Quizz Land - Quiz multijoueur sans compte',
  description:
    'Crée un salon de quiz multijoueur, invite tes amis et joue en direct sans créer de compte. Questions personnalisées, thèmes visuels et scores en temps réel.',
  keywords:
    'quiz multijoueur, quiz entre amis, salon quiz, quiz sans compte, questions personnalisées, classement en direct, jeu de soirée',
  locale: 'fr_FR'
};

export function pageTitle(title) {
  return title ? `${title} | ${siteMeta.name}` : siteMeta.title;
}
