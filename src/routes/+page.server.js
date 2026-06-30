import { categories, gameModes, quizThemes } from '$server/services/questions.js';
import { absoluteUrl, cleanCanonicalUrl, siteMeta } from '$lib/config/site.js';

export function load({ url }) {
  return {
    categories,
    modes: gameModes,
    themes: quizThemes,
    canonicalUrl: cleanCanonicalUrl(url),
    ogImage: absoluteUrl(siteMeta.defaultImage, url.origin)
  };
}
