import { createServer } from 'node:http';
import { handler } from '../build/handler.js';
import { WebSocket, WebSocketServer } from 'ws';
import {
  ROOM_CLOSE_DELAY_MS,
  advanceRound,
  closeRoom,
  deleteRoom,
  getRoom,
  joinRoom,
  startGame,
  submitAnswer,
  updateQuestionCount
} from '../src/server/services/roomManager.js';
import { log } from '../src/server/services/logger.js';

const port = Number(process.env.PORT || 3000);
const server = createServer(handler);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map();
const closingTimers = new Map();

function send(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));
}

function broadcast(roomId, type, payload) {
  for (const [ws, client] of clients) {
    if (client.roomId === roomId) send(ws, type, payload);
  }
}

async function syncRoom(roomId) {
  const room = await getRoom(roomId);
  broadcast(roomId, 'room_state', room);
  return room;
}

function scheduleRoomRemoval(roomId, closesAt) {
  if (closingTimers.has(roomId)) return;

  const delay = Math.max(0, new Date(closesAt).getTime() - Date.now());
  const timer = setTimeout(async () => {
    const room = await getRoom(roomId);
    if (!room || room.status === 'finished') {
      closingTimers.delete(roomId);
      return;
    }

    broadcast(roomId, 'room_closed', { redirectTo: '/' });
    await deleteRoom(roomId);

    for (const [socket, client] of clients) {
      if (client.roomId === roomId) socket.close(1000, 'room_closed');
    }

    closingTimers.delete(roomId);
  }, delay);

  closingTimers.set(roomId, timer);
}

function cancelRoomRemoval(roomId) {
  const timer = closingTimers.get(roomId);
  if (!timer) return;
  clearTimeout(timer);
  closingTimers.delete(roomId);
}

async function closeSmallRoomIfNeeded(client) {
  const stillConnected = [...clients.values()].some(
    (item) => item.roomId === client.roomId && item.playerId === client.playerId
  );
  if (stillConnected) return;

  const room = await getRoom(client.roomId);
  const livePlayerIds = new Set(
    [...clients.values()].filter((item) => item.roomId === client.roomId).map((item) => item.playerId)
  );

  if (!room || room.status === 'finished' || room.status === 'closing') return;
  if (room.players.length !== 2 || livePlayerIds.size !== 1) return;

  const closingRoom = await closeRoom(client.roomId, 'player_left', ROOM_CLOSE_DELAY_MS);
  if (!closingRoom) return;

  broadcast(client.roomId, 'room_closing', {
    room: closingRoom,
    message: 'Un joueur a quitté. Le salon va se fermer.',
    redirectTo: '/'
  });
  broadcast(client.roomId, 'room_state', closingRoom);
  scheduleRoomRemoval(client.roomId, closingRoom.closesAt);
}

setInterval(async () => {
  const roomIds = new Set([...clients.values()].map((client) => client.roomId));
  for (const roomId of roomIds) {
    try {
      const room = await getRoom(roomId);
      if (!room || room.status !== 'playing') continue;
      const remaining = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
      broadcast(roomId, 'timer_tick', { remaining });
      if (remaining === 0) {
        const next = await advanceRound(roomId);
        if (next?.status === 'finished') cancelRoomRemoval(roomId);
        broadcast(roomId, 'round_end', next);
        broadcast(roomId, 'room_state', next);
      }
    } catch (error) {
      log('error', 'room_timer_tick_failed', { roomId, error: error.message });
    }
  }
}, 1000);

wss.on('connection', (ws) => {
  ws.on('message', async (raw) => {
    try {
      const { type, payload } = JSON.parse(raw.toString());
      if (type === 'join_room') {
        const joined = await joinRoom(payload.roomId, payload.name, payload.playerId);
        if (!joined) return send(ws, 'error', { message: 'Salon introuvable.' });
        clients.set(ws, { roomId: payload.roomId, playerId: joined.player.id });
        send(ws, 'player_joined', joined);
        broadcast(payload.roomId, 'user_joined', joined.player);
        await syncRoom(payload.roomId);
      }
      if (type === 'start_game') {
        const room = await startGame(payload.roomId, payload.playerId);
        if (room) broadcast(payload.roomId, 'question_start', room);
        await syncRoom(payload.roomId);
      }
      if (type === 'update_question_count') {
        const room = await updateQuestionCount(payload.roomId, payload.playerId, payload.questionCount);
        if (!room) return send(ws, 'error', { message: 'Nombre de questions non modifiable.' });
        broadcast(payload.roomId, 'question_count_updated', room);
        await syncRoom(payload.roomId);
      }
      if (type === 'submit_answer') {
        const result = await submitAnswer(payload.roomId, payload.playerId, payload.answerIndex);
        if (result) {
          if (result.feedback) send(ws, 'answer_feedback', result.feedback);
          broadcast(payload.roomId, 'answer_submitted', result.room);
        }
        await syncRoom(payload.roomId);
      }
    } catch (error) {
      log('error', 'websocket_message_failed', { error: error.message });
      send(ws, 'error', { message: 'Message invalide.' });
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    if (client) {
      closeSmallRoomIfNeeded(client).catch((error) => {
        log('error', 'room_close_on_leave_failed', { roomId: client.roomId, error: error.message });
      });
    }
  });
});

server.listen(port, () => {
  log('info', 'server_started', { port });
});
