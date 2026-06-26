import { createServer } from 'node:http';
import { handler } from '../build/handler.js';
import { WebSocket, WebSocketServer } from 'ws';
import { advanceRound, getRoom, joinRoom, startGame, submitAnswer } from '../src/server/services/roomManager.js';
import { log } from '../src/server/services/logger.js';

const port = Number(process.env.PORT || 3000);
const server = createServer(handler);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map();

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

setInterval(async () => {
  const roomIds = new Set([...clients.values()].map((client) => client.roomId));
  for (const roomId of roomIds) {
    const room = await getRoom(roomId);
    if (!room || room.status !== 'playing') continue;
    const remaining = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
    broadcast(roomId, 'timer_tick', { remaining });
    if (remaining === 0) {
      const next = await advanceRound(roomId);
      broadcast(roomId, 'round_end', next);
      broadcast(roomId, 'room_state', next);
    }
  }
}, 1000);

wss.on('connection', (ws) => {
  ws.on('message', async (raw) => {
    try {
      const { type, payload } = JSON.parse(raw.toString());
      if (type === 'join_room') {
        const joined = await joinRoom(payload.roomId, payload.name, payload.playerId);
        if (!joined) return send(ws, 'error', { message: 'Room introuvable.' });
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
      if (type === 'submit_answer') {
        const room = await submitAnswer(payload.roomId, payload.playerId, payload.answerIndex);
        if (room) broadcast(payload.roomId, 'answer_submitted', room);
        await syncRoom(payload.roomId);
      }
    } catch (error) {
      log('error', 'websocket_message_failed', { error: error.message });
      send(ws, 'error', { message: 'Message invalide.' });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

server.listen(port, () => {
  log('info', 'server_started', { port });
});
