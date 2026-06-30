import { categories, gameModes, quizThemes } from '$server/services/questions.js';

export function load() {
  return { categories, modes: gameModes, themes: quizThemes };
}
