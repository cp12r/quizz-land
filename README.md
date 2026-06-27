# Quizz Land

Application SvelteKit SSR de quiz multijoueur en temps réel.

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

Le serveur personnalisé `server/index.js` sert le build SvelteKit et expose le WebSocket sur `/ws`.

## Render.com

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `PORT`, `PUBLIC_APP_URL`, `ROOM_RETENTION_HOURS`, `RESULT_RETENTION_MINUTES`

Les salons actifs sont persistés dans `data/rooms.json` pendant 12 heures par défaut.
Les salons terminés restent disponibles 30 minutes pour afficher ou exporter les résultats, puis sont purgés automatiquement au prochain accès serveur.
