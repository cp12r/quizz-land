import { browser } from '$app/environment';

export function connectRoom(roomId, handlers = {}) {
  if (!browser) return null;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    handlers[message.type]?.(message.payload);
  });
  ws.sendJson = (type, payload = {}) => ws.send(JSON.stringify({ type, payload: { roomId, ...payload } }));
  return ws;
}
