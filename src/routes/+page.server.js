import { categories, quizThemes } from '$server/services/questions.js';

export function load() {
  return { categories, themes: quizThemes };
}
