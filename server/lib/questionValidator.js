import { config } from '../config.js';
import { log } from './logger.js';

const difficulties = new Set(['easy', 'medium', 'hard']);
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
const maxQuestionsPerPack = 500;

function cleanString(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function hasDangerousKeys(item) {
  return Object.keys(item || {}).some((key) => dangerousKeys.has(key));
}

function isSafeRelativeImage(value) {
  if (!value) return true;
  if (/^https?:\/\//i.test(value)) return config.ALLOW_EXTERNAL_IMAGES;
  if (value.startsWith('/') || value.includes('..') || value.includes('\\')) return false;
  return true;
}

export function validateQuestion(item, index = 0) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || hasDangerousKeys(item)) return null;

  const answers = Array.isArray(item.answers) ? item.answers : Array.isArray(item.choices) ? item.choices : null;
  const correctIndex = Number(item.correctIndex ?? item.correct ?? item.answerIndex);
  const image = cleanString(item.image ?? item.imageUrl, 600);
  const explanation = cleanString(item.explanation, config.MAX_EXPLANATION_LENGTH);
  const difficulty = cleanString(item.difficulty, 16);

  if (!Array.isArray(answers) || answers.length !== 4) return null;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return null;
  if (!isSafeRelativeImage(image)) return null;

  const normalized = {
    id: cleanString(item.id, 80) || `question-${index + 1}`,
    category: cleanString(item.category, 32).toLowerCase(),
    text: cleanString(item.text ?? item.question, config.MAX_QUESTION_TEXT_LENGTH),
    answers: answers.map((answer) => cleanString(answer, config.MAX_ANSWER_LENGTH)),
    correctIndex
  };

  if (!normalized.id || !normalized.category || !normalized.text || normalized.answers.some((answer) => !answer)) {
    return null;
  }

  if (difficulty && difficulties.has(difficulty)) normalized.difficulty = difficulty;
  if (explanation) normalized.explanation = explanation;
  if (image) normalized.image = image;

  const imageAlt = cleanString(item.imageAlt ?? item.alt, 140);
  if (imageAlt) normalized.imageAlt = imageAlt;

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

