import { copyFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { config as serverConfig } from '../../../server/config.js';
import {
  normalizeCategory,
  normalizeGameMode,
  normalizeQuestions,
  normalizeTheme,
  pickQuestions,
  questions as questionBank
} from './questions.js';
import { log } from './logger.js';

const dataFile = join(process.cwd(), 'data', 'rooms.json');
const backupFile = join(process.cwd(), 'data', 'rooms.backup.json');
const resultsFile = join(process.cwd(), 'data', 'results.json');
const roomState = globalThis.__QUIZZ_LAND_ROOM_STATE__ ||= {
  rooms: new Map(),
  writeQueue: Promise.resolve(),
  resultWriteQueue: Promise.resolve(),
  hydrated: false,
  hydrateQueue: null,
  persistTimer: null,
  lastPersistLogAt: 0,
  lastPersistRoomCount: null
};
const rooms = roomState.rooms;
const DEFAULT_CATEGORIES = ['culture', 'science', 'web'];
const QUESTION_MAX = 50;
const TIME_MIN_SECONDS = 10;
const TIME_MAX_SECONDS = 120;
const ALL_ANSWERED_DELAY_MS = 5000;
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

async function readJsonArray(file) {
  const raw = await readFile(file, 'utf8');
  const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
  return Array.isArray(parsed) ? parsed : [];
}

async function restoreRoomsBackup() {
  const saved = await readJsonArray(backupFile);
  await mkdir(dirname(dataFile), { recursive: true });
  const tmpFile = `${dataFile}.restore-${process.pid}-${Date.now()}.tmp`;
  await writeFile(tmpFile, JSON.stringify(saved, null, 2));
  await rename(tmpFile, dataFile);
  log('success', 'rooms restored from backup', { count: saved.length });
  return saved;
}

async function readRoomsFromDisk() {
  try {
    return await readJsonArray(dataFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('info', 'rooms storage missing');
      return [];
    }

    log('warn', 'rooms storage corrupted', { error: error.message });
    try {
      return await restoreRoomsBackup();
    } catch (backupError) {
      log('error', 'rooms backup restore failed', { error: backupError.message });
      return [];
    }
  }
}

async function writeRoomsAtomically() {
  await mkdir(dirname(dataFile), { recursive: true });

  try {
    await copyFile(dataFile, backupFile);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const tmpFile = `${dataFile}.${process.pid}-${Date.now()}.tmp`;
  try {
    await writeFile(tmpFile, JSON.stringify([...rooms.values()], null, 2));
    await rename(tmpFile, dataFile);
    const now = Date.now();
    const shouldLog = rooms.size !== roomState.lastPersistRoomCount || now - roomState.lastPersistLogAt > 30_000;
    log(shouldLog ? 'success' : 'debug', 'rooms persisted', { activeRooms: rooms.size });
    roomState.lastPersistLogAt = now;
    roomState.lastPersistRoomCount = rooms.size;
  } catch (error) {
    try {
      await unlink(tmpFile);
    } catch {
      // temp cleanup best effort
    }
    throw error;
  }
}

async function flushPersist() {
  roomState.persistTimer = null;

  roomState.writeQueue = roomState.writeQueue.catch((error) => {
    log('error', 'rooms storage write queue recovered', { error: error.message });
  }).then(writeRoomsAtomically);

  try {
    await roomState.writeQueue;
  } catch (error) {
    log('error', 'rooms storage write failed', { error: error.message });
  }
}

async function persist() {
  if (roomState.persistTimer) clearTimeout(roomState.persistTimer);
  roomState.persistTimer = setTimeout(() => {
    flushPersist();
  }, serverConfig.PERSIST_DEBOUNCE_MS);
}

async function readResultSnapshots() {
  try {
    const raw = await readFile(resultsFile, 'utf8');
    const saved = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log('error', 'results_storage_read_failed', { error: error.message });
    }
    return [];
  }
}

async function persistResultSnapshots(snapshots) {
  roomState.resultWriteQueue = roomState.resultWriteQueue.catch((error) => {
    log('error', 'results_storage_write_queue_recovered', { error: error.message });
  }).then(async () => {
    await mkdir(dirname(resultsFile), { recursive: true });
    await writeFile(resultsFile, JSON.stringify(snapshots, null, 2));
  });
  return roomState.resultWriteQueue;
}

async function archiveResult(room) {
  const snapshots = await readResultSnapshots();
  const now = Date.now();
  const retention = resultRetentionMs();
  const snapshot = {
    id: room.id,
    room: publicRoom(room),
    results: getResults(room),
    createdAt: room.createdAt,
    finishedAt: room.finishedAt || new Date().toISOString(),
    deleteAfter: room.deleteAfter || new Date(now + retention).toISOString()
  };
  const freshSnapshots = snapshots.filter((item) => {
    if (item.id === room.id) return false;
    const deleteAfter = new Date(item.deleteAfter || item.finishedAt || item.createdAt).getTime();
    return deleteAfter > now;
  });

  freshSnapshots.push(snapshot);
  await persistResultSnapshots(freshSnapshots);
  return snapshot;
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

function sourceQuestionCount(selectedCategories, customQuestions = []) {
  const categories = normalizedRoomCategories(selectedCategories);
  const normalizedCustom = normalizeQuestions(customQuestions);
  const standardCount = categories.length
    ? questionBank.filter((question) => categories.includes(question.category)).length
    : 0;
  const sourceCount = standardCount + normalizedCustom.length;
  return sourceCount || questionBank.length;
}

function maxQuestionCount(selectedCategories, customQuestions = []) {
  const categories = normalizedRoomCategories(selectedCategories);
  if (categories.length) return QUESTION_MAX;
  return Math.max(1, sourceQuestionCount(categories, customQuestions));
}

function minQuestionCount(selectedCategories) {
  return normalizedRoomCategories(selectedCategories).length ? 5 : 1;
}

function clampQuestionCount(value, selectedCategories, customQuestions = []) {
  const min = minQuestionCount(selectedCategories);
  const max = Math.max(min, maxQuestionCount(selectedCategories, customQuestions));
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

function shuffleQuestionAnswers(question) {
  const answers = question.answers.map((answer, index) => ({ answer, index }));
  const shuffled = answers.sort(() => Math.random() - 0.5);
  return {
    ...question,
    answers: shuffled.map((item) => item.answer),
    correctIndex: shuffled.findIndex((item) => item.index === question.correctIndex)
  };
}

function applyModeToQuestions(questions, mode) {
  if (!mode.shuffleAnswers) return questions;
  return questions.map(shuffleQuestionAnswers);
}

function scoreMultiplier(room) {
  const multiplier = Number(room.config?.mode?.scoreMultiplier || 1);
  return Number.isFinite(multiplier) ? Math.max(0.5, Math.min(2, multiplier)) : 1;
}

function applyQuestionConfig(room, requestedQuestionCount) {
  const customQuestions = roomCustomQuestions(room);
  const categories = normalizedRoomCategories(room.config.categories);
  const mode = normalizeGameMode(room.config.modeId);
  const questionCount = clampQuestionCount(requestedQuestionCount, categories, customQuestions);
  const pickedQuestions = applyModeToQuestions(pickRoomQuestions(categories, questionCount, customQuestions), mode);
  const max = maxQuestionCount(categories, customQuestions);
  const min = minQuestionCount(categories);

  room.customQuestions = customQuestions;
  room.questions = pickedQuestions;
  room.config.questionCount = pickedQuestions.length;
  room.config.requestedQuestionCount = questionCount;
  room.config.availableQuestionCount = max;
  room.config.minQuestionCount = min;
}

function activePlayerCount(room) {
  return room.players.filter((player) => player.connected !== false).length;
}

function connectedPlayers(room) {
  return room.players.filter((player) => player.connected !== false);
}

function clampTimePerQuestion(value) {
  const requested = Number(value);
  const normalized = Number.isFinite(requested) ? Math.round(requested) : 30;
  return Math.min(TIME_MAX_SECONDS, Math.max(TIME_MIN_SECONDS, normalized));
}

function normalizeAnswerIndex(value, question) {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index >= question.answers.length) return null;
  return index;
}

function hasEveryActivePlayerAnswered(room, questionId) {
  const activePlayerIds = new Set(connectedPlayers(room).map((player) => player.id));
  const answeredPlayerIds = new Set(
    room.answers
      .filter((answer) => answer.questionId === questionId)
      .filter((answer) => activePlayerIds.has(answer.playerId))
      .map((answer) => answer.playerId)
  );

  return activePlayerIds.size > 0 && answeredPlayerIds.size >= activePlayerIds.size;
}

export async function hydrateRooms(force = false) {
  if (roomState.hydrated && !force) return;
  if (roomState.hydrateQueue) return roomState.hydrateQueue;

  roomState.hydrateQueue = (async () => {
    const saved = await readRoomsFromDisk();
    rooms.clear();

    for (const room of saved) {
      if (shouldKeepRoom(room)) rooms.set(room.id, room);
    }

    roomState.hydrated = true;
    await persist();
  })().finally(() => {
    roomState.hydrateQueue = null;
  });

  return roomState.hydrateQueue;
}

async function ensureRoomLoaded(id) {
  await hydrateRooms();
  if (!rooms.has(id)) await hydrateRooms(true);
  return rooms.get(id);
}

export async function createRoom(config = {}) {
  await hydrateRooms();
  let id = roomCode();
  while (rooms.has(id)) id = roomCode();
  const customQuestions = normalizeQuestions(config.customQuestions);
  const mode = normalizeGameMode(config.modeId);
  const modeCategories = Array.isArray(mode.categories) ? mode.categories : null;
  const selectedCategories = Array.isArray(config.categories)
    ? config.categories.map(normalizeCategory).filter(Boolean)
    : modeCategories || DEFAULT_CATEGORIES;
  const effectiveCategories = modeCategories || (selectedCategories.length || customQuestions.length ? selectedCategories : DEFAULT_CATEGORIES);
  const customOnly = effectiveCategories.length === 0 && customQuestions.length > 0;
  const questionCount = customOnly
    ? customQuestions.length
    : clampQuestionCount(config.questionCount || mode.questionCount || 8, effectiveCategories, customQuestions);
  const theme = normalizeTheme(config.themeId);
  const pickedQuestions = applyModeToQuestions(pickRoomQuestions(effectiveCategories, questionCount, customQuestions), mode);
  const max = maxQuestionCount(effectiveCategories, customQuestions);
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
      categories: effectiveCategories,
      questionCount: pickedQuestions.length,
      requestedQuestionCount: questionCount,
      availableQuestionCount: max,
      minQuestionCount: minQuestionCount(effectiveCategories),
      timePerQuestion: clampTimePerQuestion(config.timePerQuestion || mode.timePerQuestion || 30),
      bonusTimer: config.bonusTimer === undefined ? Boolean(mode.bonusTimer) : Boolean(config.bonusTimer),
      themeId: theme.id,
      themeName: theme.name,
      modeId: mode.id,
      modeName: mode.name,
      mode: {
        id: mode.id,
        name: mode.name,
        label: mode.label,
        scoreMultiplier: mode.scoreMultiplier,
        shuffleAnswers: mode.shuffleAnswers
      },
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
  log('success', 'room created', { roomId: id, maxPlayers: serverConfig.MAX_PLAYERS_PER_ROOM });
  return publicRoom(room);
}

export async function getRoom(id, reveal = false) {
  const room = await ensureRoomLoaded(id);
  if (!room) return null;
  return reveal ? room : publicRoom(room);
}

export async function getResultSnapshot(id) {
  const snapshots = await readResultSnapshots();
  const now = Date.now();
  const snapshot = snapshots.find((item) => item.id === id);

  if (!snapshot) return null;
  const deleteAfter = new Date(snapshot.deleteAfter || snapshot.finishedAt || snapshot.createdAt).getTime();
  if (deleteAfter <= now) return null;

  return snapshot;
}

export async function joinRoom(roomId, playerName, playerId = crypto.randomUUID()) {
  const room = await ensureRoomLoaded(roomId);
  if (!room || room.status === 'closing' || room.status === 'finished') return null;
  let player = room.players.find((item) => item.id === playerId);

  if (!player) {
    if (room.status !== 'waiting') return null;
    if (connectedPlayers(room).length >= serverConfig.MAX_PLAYERS_PER_ROOM) return null;
  } else if (player.connected === false && room.status === 'waiting' && connectedPlayers(room).length >= serverConfig.MAX_PLAYERS_PER_ROOM) {
    return null;
  }

  if (!player) {
    player = { id: playerId, name: playerName || 'Joueur', score: 0, ready: true, connected: true };
    room.players.push(player);
    room.hostId ||= player.id;
  } else {
    player.connected = true;
    player.name = playerName || player.name;
  }
  await persist();
  log('info', 'player joined', { roomId, total: room.players.length });
  return { room: publicRoom(room), player };
}

export async function markPlayerDisconnected(roomId, playerId) {
  const room = await ensureRoomLoaded(roomId);
  if (!room || !playerId) return null;
  const player = room.players.find((item) => item.id === playerId);
  if (!player) return publicRoom(room);

  player.connected = false;
  if (room.hostId === playerId) {
    room.hostId = connectedPlayers(room)[0]?.id || room.hostId;
  }
  const question = room.status === 'playing' ? room.questions[room.currentQuestion] : null;
  if (question && hasEveryActivePlayerAnswered(room, question.id)) {
    const nextDeadline = Date.now() + ALL_ANSWERED_DELAY_MS;
    room.roundEndsAt = room.roundEndsAt ? Math.min(room.roundEndsAt, nextDeadline) : nextDeadline;
  }
  await persist();
  return publicRoom(room);
}

export async function startGame(roomId, playerId) {
  const room = await ensureRoomLoaded(roomId);
  const livePlayers = room ? connectedPlayers(room) : [];
  if (!room || room.status !== 'waiting' || room.hostId !== playerId || livePlayers.length < 2) return null;
  room.status = 'playing';
  room.currentQuestion = 0;
  room.roundEndsAt = Date.now() + room.config.timePerQuestion * 1000;
  room.answers = [];
  await persist();
  log('info', 'game started', { roomId, questions: room.questions.length });
  return publicRoom(room);
}

export async function updateQuestionCount(roomId, playerId, questionCount) {
  const room = await ensureRoomLoaded(roomId);
  if (!room || room.status !== 'waiting' || room.hostId !== playerId) return null;
  applyQuestionConfig(room, questionCount);
  room.answers = [];
  await persist();
  return publicRoom(room);
}

export async function closeRoom(roomId, reason = 'player_left', delayMs = ROOM_CLOSE_DELAY_MS) {
  const room = await ensureRoomLoaded(roomId);
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
  await ensureRoomLoaded(roomId);
  const deleted = rooms.delete(roomId);
  if (deleted) {
    await persist();
    log('info', 'room deleted', { roomId });
  }
  return deleted;
}

export async function submitAnswer(roomId, playerId, answerIndex) {
  const room = await ensureRoomLoaded(roomId);
  if (!room || room.status !== 'playing') return null;

  const now = Date.now();
  if (!room.roundEndsAt || now > room.roundEndsAt) {
    return { room: publicRoom(room), feedback: null };
  }

  const question = room.questions[room.currentQuestion];
  if (!question) return null;
  const player = room.players.find((item) => item.id === playerId);
  if (!player || player.connected === false) return null;

  const normalizedAnswerIndex = normalizeAnswerIndex(answerIndex, question);
  if (normalizedAnswerIndex === null) return null;

  const already = room.answers.find((answer) => answer.playerId === playerId && answer.questionId === question.id);
  if (already) return { room: publicRoom(room), feedback: null };

  const correct = normalizedAnswerIndex === question.correctIndex;
  const remaining = Math.max(0, room.roundEndsAt - now);
  const basePoints = 100 + Math.round(remaining / 1000);
  const points = correct ? Math.round(basePoints * scoreMultiplier(room)) : 0;
  const feedback = {
    playerId,
    questionId: question.id,
    correct,
    points,
    answerIndex: normalizedAnswerIndex,
    correctIndex: question.correctIndex
  };

  room.answers.push({ ...feedback, ms: now });
  if (player) player.score += points;

  if (hasEveryActivePlayerAnswered(room, question.id)) {
    room.roundEndsAt = now + ALL_ANSWERED_DELAY_MS;
    feedback.allAnswered = true;
    feedback.nextQuestionIn = ALL_ANSWERED_DELAY_MS / 1000;
  }

  await persist();
  return { room: publicRoom(room), feedback };
}

export async function advanceRound(roomId) {
  const room = await ensureRoomLoaded(roomId);
  if (!room) return null;
  if (room.currentQuestion + 1 >= room.questions.length) {
    room.status = 'finished';
    room.roundEndsAt = null;
    room.finishedAt = new Date().toISOString();
    room.deleteAfter = new Date(Date.now() + resultRetentionMs()).toISOString();
    await archiveResult(room);
    const durationMs = Date.now() - new Date(room.createdAt).getTime();
    log('success', 'game finished', { roomId, duration: formatDuration(durationMs) });
  } else {
    room.currentQuestion += 1;
    room.roundEndsAt = Date.now() + room.config.timePerQuestion * 1000;
  }
  room.answers = [];
  await persist();
  return publicRoom(room);
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function getResults(room) {
  return [...room.players].sort((a, b) => b.score - a.score);
}
