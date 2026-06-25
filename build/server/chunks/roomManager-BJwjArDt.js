import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { p as pickQuestions } from './questions-036w9Ron.js';

const root = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const dataFile = join(root, "data", "rooms.json");
const rooms = /* @__PURE__ */ new Map();
let hydrated = false;
function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
function publicRoom(room) {
  return {
    ...room,
    questions: room.questions.map(({ correctIndex, ...question }) => question)
  };
}
async function persist() {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify([...rooms.values()], null, 2));
}
async function hydrateRooms() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await readFile(dataFile, "utf8");
    const saved = JSON.parse(raw);
    const cutoff = Date.now() - Number(process.env.ROOM_RETENTION_DAYS || 7) * 24 * 60 * 60 * 1e3;
    for (const room of saved) {
      if (new Date(room.createdAt).getTime() > cutoff) rooms.set(room.id, room);
    }
  } catch {
    await persist();
  }
}
async function createRoom(config = {}) {
  await hydrateRooms();
  const id = roomCode();
  const questionCount = Number(config.questionCount || 8);
  const room = {
    id,
    name: config.name?.trim() || `Room ${id}`,
    hostId: null,
    status: "waiting",
    currentQuestion: -1,
    roundEndsAt: null,
    config: {
      categories: config.categories?.length ? config.categories : ["culture", "science", "web"],
      questionCount,
      timePerQuestion: Number(config.timePerQuestion || 30),
      bonusTimer: Boolean(config.bonusTimer)
    },
    players: [],
    answers: [],
    questions: pickQuestions(config.categories, questionCount),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  rooms.set(id, room);
  await persist();
  return publicRoom(room);
}
async function getRoom(id, reveal = false) {
  await hydrateRooms();
  const room = rooms.get(id);
  if (!room) return null;
  return reveal ? room : publicRoom(room);
}
async function joinRoom(roomId, playerName, playerId = crypto.randomUUID()) {
  await hydrateRooms();
  const room = rooms.get(roomId);
  if (!room) return null;
  let player = room.players.find((item) => item.id === playerId);
  if (!player) {
    player = { id: playerId, name: playerName || "Joueur", score: 0, ready: true, connected: true };
    room.players.push(player);
    room.hostId ||= player.id;
  } else {
    player.connected = true;
    player.name = playerName || player.name;
  }
  await persist();
  return { room: publicRoom(room), player };
}
async function submitAnswer(roomId, playerId, answerIndex) {
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing") return null;
  const question = room.questions[room.currentQuestion];
  const already = room.answers.find((answer) => answer.playerId === playerId && answer.questionId === question.id);
  if (already) return publicRoom(room);
  const correct = Number(answerIndex) === question.correctIndex;
  const remaining = Math.max(0, room.roundEndsAt - Date.now());
  const points = correct ? 100 + Math.round(remaining / 1e3) : 0;
  room.answers.push({ playerId, questionId: question.id, answerIndex: Number(answerIndex), correct, points, ms: Date.now() });
  const player = room.players.find((item) => item.id === playerId);
  if (player) player.score += points;
  await persist();
  return publicRoom(room);
}
function getResults(room) {
  return [...room.players].sort((a, b) => b.score - a.score);
}

export { getResults as a, createRoom as c, getRoom as g, joinRoom as j, submitAnswer as s };
//# sourceMappingURL=roomManager-BJwjArDt.js.map
