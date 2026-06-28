import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { normalizeCategory, normalizeQuestions, normalizeTheme, pickQuestions, questions as questionBank } from './questions.js';
import { log } from './logger.js';

const dataFile = join(process.cwd(), 'data', 'rooms.json');
const tempDataFile = `${dataFile}.tmp`;
const rooms = new Map();
let writeQueue = Promise.resolve();
const DEFAULT_CATEGORIES = ['culture', 'science', 'web'];
export const ROOM_CLOSE_DELAY_MS = 4800;

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function resultRetentionMs() {
  return Number(process.env.RESULT_RETENTION_MINUTES || 30) * 60 * 1000;
}

function activeRetentionMs() {
  return Number(process.env.ROOM_RETENTION_HOURS || 12) * 60 * 60 * 1000;
}

function publicRoom(room) {
  const { customQuestions, ...safeRoom } = room;
  return {
    ...safeRoom,
    answers: (safeRoom.answers || []).map(({ playerId, questionId, ms }) => ({ playerId, questionId, ms })),
    questions: safeRoom.questions.map(({ correctIndex, ...question }) => question)
  };
}

function shouldKeepRoom(room, now = Date.now()) {
  if (room.status === 'closing') {
    const deleteAfter = new Date(room.deleteAfter || room.closesAt || room.createdAt).getTime();
    return deleteAfter > now;
  }

  if (room.status === 'finished') {
    const finishedAt = new Date(room.finishedAt || room.createdAt).getTime();
    return finishedAt > now - resultRetentionMs();
  }

  return new Date(room.createdAt).getTime() > now - activeRetentionMs();
}

async function persist() {
  writeQueue = writeQueue.then(async () => {
    await mkdir(dirname(dataFile), { recursive: true });
    await writeFile(tempDataFile, JSON.stringify([...rooms.values()], null, 2));
    await rename(tempDataFile, dataFile);
  });
  return writeQueue;
}

function normalizedRoomCategories(categories = DEFAULT_CATEGORIES) {
  return Array.isArray(categories) ? categories.map(normalizeCategory).filter(Boolean) : DEFAULT_CATEGORIES;
}

function roomCustomQuestions(room) {
  const stored = normalizeQuestions(room.customQuestions);
  if (stored.length) return stored;
  if (!room.config?.categories?.length && room.config?.customQuestionCount) return normalizeQuestions(room.questions);
  return [];
}

function availableQuestionCount(selectedCategories, customQuestions = []) {
  const categories = normalizedRoomCategories(selectedCategories);
  const normalizedCustom = normalizeQuestions(customQuestions);
  const standardCount = categories.length
    ? questionBank.filter((question) => categories.includes(question.category)).length
    : 0;
  const sourceCount = standardCount + normalizedCustom.length;
  return sourceCount || questionBank.length;
}

function minQuestionCount(selectedCategories, available) {
  return normalizedRoomCategories(selectedCategories).length ? Math.min(5, available) : 1;
}

function clampQuestionCount(value, selectedCategories, customQuestions = []) {
  const available = availableQuestionCount(selectedCategories, customQuestions);
  const min = minQuestionCount(selectedCategories, available);
  const max = Math.max(min, Math.min(50, available));
  const requested = Number(value);
  const normalized = Number.isFinite(requested) ? Math.round(requested) : min;
  return Math.min(max, Math.max(min, normalized));
}

function pickRoomQuestions(selectedCategories, count, customQuestions = []) {
  const categories = normalizedRoomCategories(selectedCategories);
  const normalizedCustom = normalizeQuestions(customQuestions);

  if (!categories.length && normalizedCustom.length) {
    return [...normalizedCustom].sort(() => Math.random() - 0.5).slice(0, count);
  }

  return pickQuestions(categories, count, normalizedCustom);
}

function applyQuestionConfig(room, requestedQuestionCount) {
  const customQuestions = roomCustomQuestions(room);
  const categories = normalizedRoomCategories(room.config.categories);
  const questionCount = clampQuestionCount(requestedQuestionCount, categories, customQuestions);
  const pickedQuestions = pickRoomQuestions(categories, questionCount, customQuestions);
  const available = availableQuestionCount(categories, customQuestions);
  const min = minQuestionCount(categories, available);

  room.customQuestions = customQuestions;
  room.questions = pickedQuestions;
  room.config.questionCount = pickedQuestions.length;
  room.config.requestedQuestionCount = questionCount;
  room.config.availableQuestionCount = Math.min(50, available);
  room.config.minQuestionCount = min;
}

export async function hydrateRooms() {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const saved = JSON.parse(raw);
    rooms.clear();

    for (const room of saved) {
      if (shouldKeepRoom(room)) rooms.set(room.id, room);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log('error', 'rooms_storage_read_failed', { error: error.message });
    }
    rooms.clear();
  }

  await persist();
}

export async function createRoom(config = {}) {
  await hydrateRooms();
  const id = roomCode();
  const customQuestions = normalizeQuestions(config.customQuestions);
  const selectedCategories = Array.isArray(config.categories)
    ? config.categories.map(normalizeCategory).filter(Boolean)
    : DEFAULT_CATEGORIES;
  const customOnly = selectedCategories.length === 0 && customQuestions.length > 0;
  const questionCount = customOnly
    ? customQuestions.length
    : clampQuestionCount(config.questionCount || 8, selectedCategories, customQuestions);
  const theme = normalizeTheme(config.themeId);
  const pickedQuestions = pickRoomQuestions(selectedCategories, questionCount, customQuestions);
  const available = availableQuestionCount(selectedCategories, customQuestions);
  const room = {
    id,
    name: config.name?.trim() || `Salon ${id}`,
    hostId: null,
    status: 'waiting',
    currentQuestion: -1,
    roundEndsAt: null,
    finishedAt: null,
    deleteAfter: null,
    config: {
      categories: selectedCategories,
      questionCount: pickedQuestions.length,
      requestedQuestionCount: questionCount,
      availableQuestionCount: Math.min(50, available),
      minQuestionCount: minQuestionCount(selectedCategories, available),
      timePerQuestion: Number(config.timePerQuestion || 30),
      bonusTimer: Boolean(config.bonusTimer),
      themeId: theme.id,
      themeName: theme.name,
      customQuestionCount: customQuestions.length
    },
    players: [],
    answers: [],
    customQuestions,
    questions: pickedQuestions,
    createdAt: new Date().toISOString()
  };
  rooms.set(id, room);
  await persist();
  return publicRoom(room);
}

export async function getRoom(id, reveal = false) {
  await hydrateRooms();
  const room = rooms.get(id);
  if (!room) return null;
  return reveal ? room : publicRoom(room);
}

export async function joinRoom(roomId, playerName, playerId = crypto.randomUUID()) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room || room.status === 'closing') return null;
  let player = room.players.find((item) => item.id === playerId);
  if (!player) {
    player = { id: playerId, name: playerName || 'Joueur', score: 0, ready: true, connected: true };
    room.players.push(player);
    room.hostId ||= player.id;
  } else {
    player.connected = true;
    player.name = playerName || player.name;
  }
  await persist();
  return { room: publicRoom(room), player };
}

export async function startGame(roomId, playerId) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  const connectedPlayers = room?.players.filter((player) => player.connected !== false) || [];
  if (!room || room.status !== 'waiting' || room.hostId !== playerId || connectedPlayers.length < 2) return null;
  room.status = 'playing';
  room.currentQuestion = 0;
  room.roundEndsAt = Date.now() + room.config.timePerQuestion * 1000;
  room.answers = [];
  await persist();
  return publicRoom(room);
}

export async function updateQuestionCount(roomId, playerId, questionCount) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room || room.status !== 'waiting' || room.hostId !== playerId) return null;
  applyQuestionConfig(room, questionCount);
  room.answers = [];
  await persist();
  return publicRoom(room);
}

export async function closeRoom(roomId, reason = 'player_left', delayMs = ROOM_CLOSE_DELAY_MS) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room || room.status === 'finished') return null;

  const now = Date.now();
  room.status = 'closing';
  room.roundEndsAt = null;
  room.closeReason = reason;
  room.closesAt = room.closesAt || new Date(now + delayMs).toISOString();
  room.deleteAfter = new Date(new Date(room.closesAt).getTime() + 5000).toISOString();
  await persist();
  return publicRoom(room);
}

export async function deleteRoom(roomId) {
  await hydrateRooms();
  const deleted = rooms.delete(roomId);
  if (deleted) await persist();
  return deleted;
}

export async function submitAnswer(roomId, playerId, answerIndex) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return null;

  const now = Date.now();
  if (!room.roundEndsAt || now > room.roundEndsAt) {
    return { room: publicRoom(room), feedback: null };
  }

  const question = room.questions[room.currentQuestion];
  const already = room.answers.find((answer) => answer.playerId === playerId && answer.questionId === question.id);
  if (already) return { room: publicRoom(room), feedback: null };

  const correct = Number(answerIndex) === question.correctIndex;
  const remaining = Math.max(0, room.roundEndsAt - now);
  const points = correct ? 100 + Math.round(remaining / 1000) : 0;
  const feedback = {
    playerId,
    questionId: question.id,
    correct,
    points,
    answerIndex: Number(answerIndex)
  };

  room.answers.push({ ...feedback, ms: now });
  const player = room.players.find((item) => item.id === playerId);
  if (player) player.score += points;

  await persist();
  return { room: publicRoom(room), feedback };
}

export async function advanceRound(roomId) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentQuestion + 1 >= room.questions.length) {
    room.status = 'finished';
    room.roundEndsAt = null;
    room.finishedAt = new Date().toISOString();
    room.deleteAfter = new Date(Date.now() + resultRetentionMs()).toISOString();
  } else {
    room.currentQuestion += 1;
    room.roundEndsAt = Date.now() + room.config.timePerQuestion * 1000;
  }
  room.answers = [];
  await persist();
  return publicRoom(room);
}

export function getResults(room) {
  return [...room.players].sort((a, b) => b.score - a.score);
}
