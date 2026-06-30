const mediaCache = new Map();

export function questionMedia(question) {
  return {
    image: question?.image || '',
    imageFallback: question?.imageFallback || '',
    audio: question?.audio || '',
    audioStart: Number(question?.audioStart || 0),
    audioDuration: Number(question?.audioDuration || 8),
    imageAlt: question?.imageAlt || question?.text || 'Illustration de la question',
    audioLabel: question?.audioLabel || 'Extrait audio de la question'
  };
}

export function preloadQuestionMedia(question) {
  const media = questionMedia(question);
  const jobs = [];

  if (media.image && !mediaCache.has(media.image)) {
    mediaCache.set(media.image, 'loading');
    jobs.push(new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        mediaCache.set(media.image, 'ready');
        resolve(true);
      };
      image.onerror = () => {
        mediaCache.set(media.image, 'failed');
        resolve(false);
      };
      image.decoding = 'async';
      image.src = media.image;
    }));
  }

  if (media.imageFallback && !mediaCache.has(media.imageFallback)) {
    mediaCache.set(media.imageFallback, 'loading');
    jobs.push(new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        mediaCache.set(media.imageFallback, 'ready');
        resolve(true);
      };
      image.onerror = () => {
        mediaCache.set(media.imageFallback, 'failed');
        resolve(false);
      };
      image.decoding = 'async';
      image.src = media.imageFallback;
    }));
  }

  if (media.audio && !mediaCache.has(media.audio)) {
    mediaCache.set(media.audio, 'loading');
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.oncanplaythrough = () => mediaCache.set(media.audio, 'ready');
    audio.onerror = () => mediaCache.set(media.audio, 'failed');
    audio.src = media.audio;
    audio.load();
  }

  return Promise.allSettled(jobs);
}

export function preloadUpcomingQuestionMedia(questions = [], currentIndex = 0, lookahead = 2) {
  if (typeof window === 'undefined') return;
  const start = Math.max(0, currentIndex);
  const end = Math.min(questions.length, start + lookahead + 1);
  questions.slice(start, end).forEach((question) => preloadQuestionMedia(question));
}
