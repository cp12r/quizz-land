import { browser } from '$app/environment';

export function connectRoom(roomId, handlers = {}) {
  if (!browser) return null;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);
  const pending = [];

  function send(type, payload = {}) {
    const message = JSON.stringify({ type, payload: { roomId, ...payload } });
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      pending.push(message);
    }
  }

  ws.addEventListener('open', () => {
    while (pending.length) ws.send(pending.shift());
  });

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    handlers[message.type]?.(message.payload);
  });
  ws.addEventListener('error', () => {
    handlers.socket_error?.({ message: 'Connexion temps reel impossible.' });
  });
  ws.addEventListener('close', () => {
    handlers.socket_close?.({ message: 'Connexion temps reel fermee.' });
  });
  ws.sendJson = send;
  return ws;
}
