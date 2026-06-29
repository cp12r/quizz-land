function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_COLOR: boolEnv('LOG_COLOR', true),
  LOG_JSON: boolEnv('LOG_JSON', false),
  MAX_PLAYERS_PER_ROOM: numberEnv('MAX_PLAYERS_PER_ROOM', 4),
  MAX_QUESTION_TEXT_LENGTH: numberEnv('MAX_QUESTION_TEXT_LENGTH', 300),
  MAX_ANSWER_LENGTH: numberEnv('MAX_ANSWER_LENGTH', 120),
  MAX_EXPLANATION_LENGTH: numberEnv('MAX_EXPLANATION_LENGTH', 400),
  ALLOW_EXTERNAL_IMAGES: boolEnv('ALLOW_EXTERNAL_IMAGES', false),
  PERSIST_DEBOUNCE_MS: numberEnv('PERSIST_DEBOUNCE_MS', 750)
};
