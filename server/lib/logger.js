import { config } from '../config.js';

const levels = { error: 0, warn: 1, success: 2, info: 3, debug: 4 };
const icons = { info: '🔵', warn: '🟡', error: '🔴', success: '🟢', debug: '⚪' };
const messageIcons = [
  [/^game started$/, '🟣'],
  [/^game finished$/, '🏁'],
  [/^cleanup /, '🧹'],
  [/^rooms persisted$/, '💾'],
  [/^ws error$/, '🔴'],
  [/^rate limit$/, '🟡']
];
const colors = {
  info: '\x1b[34m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  success: '\x1b[32m',
  debug: '\x1b[90m',
  reset: '\x1b[0m'
};
const sensitiveKeys = new Set(['token', 'hosttoken', 'authorization', 'password', 'secret', 'payload']);

function useColor() {
  if (String(process.env.NO_COLOR).toLowerCase() === 'true') return false;
  return config.LOG_COLOR;
}

function shouldLog(level) {
  const current = levels[config.LOG_LEVEL] ?? levels.info;
  return (levels[level] ?? levels.info) <= current;
}

function safeValue(key, value) {
  const normalized = String(key).toLowerCase();
  if (sensitiveKeys.has(normalized) || normalized.includes('token')) return '[redacted]';
  if (normalized === 'ip') return '[redacted]';
  if (typeof value === 'string') return value.length > 160 ? `${value.slice(0, 157)}...` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value == null) return value;
  return '[object]';
}

function sanitize(meta = {}) {
  return Object.fromEntries(
    Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, safeValue(key, value)])
  );
}

function humanize(message) {
  return String(message).replaceAll('_', ' ');
}

function iconFor(level, message) {
  const text = humanize(message);
  return messageIcons.find(([pattern]) => pattern.test(text))?.[1] || icons[level];
}

function metaText(meta) {
  const parts = [];
  const roomId = meta.roomId || meta.room;
  if (roomId) parts.push(roomId);

  for (const [key, value] of Object.entries(meta)) {
    if (['roomId', 'room', 'error'].includes(key)) continue;
    parts.push(`${key}=${value}`);
  }

  if (meta.error) parts.push(meta.error);
  return parts.length ? ` · ${parts.join(' · ')}` : '';
}

export function log(level, message, meta = {}) {
  const safeLevel = levels[level] === undefined ? 'info' : level;
  if (!shouldLog(safeLevel)) return;

  const cleanMeta = sanitize(meta);
  if (config.LOG_JSON) {
    const line = { at: new Date().toISOString(), level: safeLevel, message: humanize(message), ...cleanMeta };
    console[safeLevel === 'error' ? 'error' : 'info'](JSON.stringify(line));
    return;
  }

  const line = `${iconFor(safeLevel, message)} ${humanize(message)}${metaText(cleanMeta)}`;
  const output = useColor() ? `${colors[safeLevel]}${line}${colors.reset}` : line;
  console[safeLevel === 'error' ? 'error' : 'info'](output);
}

export const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  success: (message, meta) => log('success', message, meta),
  debug: (message, meta) => log('debug', message, meta)
};
