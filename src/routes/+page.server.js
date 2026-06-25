import { categories } from '$server/services/questions.js';

export function load() {
  return { categories };
}
