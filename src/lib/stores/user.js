import { browser } from '$app/environment';

export function getPlayerId() {
  if (!browser) return null;
  const existing = localStorage.getItem('quizz-player-id');
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem('quizz-player-id', id);
  return id;
}
