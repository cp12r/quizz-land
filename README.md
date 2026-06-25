# Quizz Land

Application SvelteKit SSR de quiz multijoueur temps reel.

## Setup

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

Le serveur custom `server/index.js` sert le build SvelteKit et expose le WebSocket sur `/ws`.

## Render.com

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `PORT`, `PUBLIC_APP_URL`, `ROOM_RETENTION_DAYS`

Les rooms sont persistees dans `data/rooms.json` pendant 7 jours par defaut.
