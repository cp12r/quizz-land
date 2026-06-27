import { browser } from '$app/environment';

const THEME_CLASSES = ['theme-neon', 'theme-candy', 'theme-arcade', 'theme-studio'];

export function applyTheme(themeId = 'neon') {
  if (!browser) return;
  document.documentElement.classList.remove(...THEME_CLASSES);
  const next = `theme-${themeId}`;
  document.documentElement.classList.add(THEME_CLASSES.includes(next) ? next : 'theme-neon');
}
