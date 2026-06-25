export function log(level, message, meta = {}) {
  if (process.env.NODE_ENV === 'production' && level === 'debug') return;
  const line = JSON.stringify({ at: new Date().toISOString(), level, message, ...meta });
  console[level === 'error' ? 'error' : 'info'](line);
}
