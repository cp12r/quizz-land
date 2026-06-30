import { config } from '../config.js';
import { log } from './logger.js';
import { existsSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';

const difficulties = new Set(['easy', 'medium', 'hard']);
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
const maxQuestionsPerPack = 500;
const mediaRoot = '/assets/quiz';
const imageExtensions = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']);
const audioExtensions = new Set(['.aac', '.m4a', '.mp3', '.ogg', '.wav', '.webm']);

function cleanString(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function hasDangerousKeys(item) {
  return Object.keys(item || {}).some((key) => dangerousKeys.has(key));
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function normalizeAssetPath(value) {
  const path = cleanString(value, 600).replaceAll('\\', '/');
  if (!path) return '';
  if (isExternalUrl(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

function isExistingStaticAsset(path) {
  const relative = path.replace(/^\/+/, '');
  const absolute = normalize(join(process.cwd(), 'static', relative));
  const staticRoot = normalize(join(process.cwd(), 'static'));
  return absolute.startsWith(`${staticRoot}${sep}`) && existsSync(absolute);
}

function isSafeMedia(value, kind) {
  if (!value) return true;
  if (isExternalUrl(value)) return kind === 'image' && config.ALLOW_EXTERNAL_IMAGES;
  if (value.includes('..') || value.includes('\\')) return false;

  const path = normalizeAssetPath(value);
  const expectedRoot = `${mediaRoot}/${kind === 'image' ? 'images' : 'audio'}/`;
  const extensions = kind === 'image' ? imageExtensions : audioExtensions;
  if (!path.startsWith(expectedRoot)) return false;
  if (!extensions.has(extname(path).toLowerCase())) return false;
  if (!isExistingStaticAsset(path)) return false;

  return true;
}

export function validateQuestion(item, index = 0) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || hasDangerousKeys(item)) return null;

  const answers = Array.isArray(item.answers) ? item.answers : Array.isArray(item.choices) ? item.choices : null;
  const correctIndex = Number(item.correctIndex ?? item.correct ?? item.answerIndex);
  const image = normalizeAssetPath(item.image ?? item.imageUrl);
  const audio = normalizeAssetPath(item.audio ?? item.audioUrl ?? item.sound ?? item.soundUrl);
  const explanation = cleanString(item.explanation, config.MAX_EXPLANATION_LENGTH);
  const difficulty = cleanString(item.difficulty, 16);

  if (!Array.isArray(answers) || answers.length < 2 || answers.length > 4) return null;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= answers.length) return null;
  if (!isSafeMedia(image, 'image') || !isSafeMedia(audio, 'audio')) return null;

  const normalized = {
    id: cleanString(item.id, 80) || `question-${index + 1}`,
    category: cleanString(item.category, 32).toLowerCase(),
    text: cleanString(item.text ?? item.question, config.MAX_QUESTION_TEXT_LENGTH),
    answers: answers.map((answer) => cleanString(answer, config.MAX_ANSWER_LENGTH)),
    correctIndex
  };

  if (!normalized.id || !normalized.category || (!normalized.text && !image && !audio) || normalized.answers.some((answer) => !answer)) {
    return null;
  }

  if (difficulty && difficulties.has(difficulty)) normalized.difficulty = difficulty;
  if (explanation) normalized.explanation = explanation;
  if (image) normalized.image = image;
  if (audio) normalized.audio = audio;

  const imageAlt = cleanString(item.imageAlt ?? item.alt, 140);
  if (imageAlt) normalized.imageAlt = imageAlt;
  const audioLabel = cleanString(item.audioLabel ?? item.soundLabel, 140);
  if (audioLabel) normalized.audioLabel = audioLabel;

  return normalized;
}

export function validateQuestionPack(input = [], label = 'questions') {
  const source = Array.isArray(input) ? input.slice(0, maxQuestionsPerPack) : [];
  const questions = [];
  let invalid = Array.isArray(input) ? Math.max(0, input.length - source.length) : 1;

  source.forEach((item, index) => {
    const question = validateQuestion(item, index);
    if (question) questions.push(question);
    else invalid += 1;
  });

  if (invalid > 0) {
    log('warn', 'question pack sanitized', { pack: label, valid: questions.length, invalid });
  }

  return { questions, invalid };
}
