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

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Environment: `PORT`, `PUBLIC_APP_URL`, `ROOM_RETENTION_HOURS`, `RESULT_RETENTION_MINUTES`

Si Render ne trouve pas une nouvelle dépendance comme `three`, vérifier que `package.json` et `package-lock.json` sont bien commités puis relancer avec **Clear build cache & deploy**.

Les salons actifs sont persistés dans `data/rooms.json` pendant 12 heures par défaut.
Les salons terminés restent disponibles 30 minutes pour afficher ou exporter les résultats, puis sont purgés automatiquement au prochain accès serveur.

## Questions Avec Médias

Les anciens JSON restent valides. Les champs média sont optionnels et ne changent pas la logique de score, de timer, de rooms ou de WebSocket.

Structure publique recommandée :

- Images locales/fallback : `static/assets/quiz/images/...`
- Audio : `static/assets/quiz/audio/...`
- JSON : `quizzland-content/*.json`
- Thèmes UI : `static/season-1/...`

Les catégories enrichies automatiquement utilisent :

- Images CDN gratuites : `https://images.unsplash.com/...`
- Extraits musicaux publics : `https://audio-ssl.itunes.apple.com/...`

Le validateur autorise ces domaines par défaut et garde les SVG locaux comme fallback avec `imageFallback`.

Dans un JSON, référence un fichier public avec un chemin absolu simple ou une image Unsplash CDN :

```json
{
  "id": "cinema-poster-001",
  "category": "cinema",
  "text": "Quel film est associé à cette affiche ?",
  "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  "imageFallback": "/assets/quiz/images/categories/cinema.svg",
  "imageAlt": "Affiche verte avec code numérique",
  "answers": ["Inception", "The Matrix", "Tron", "Blade Runner"],
  "correctIndex": 1,
  "difficulty": "easy"
}
```

Audio :

```json
{
  "id": "blindtest-queen-001",
  "category": "blindtest",
  "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/04/ab/0e/04ab0e10-727e-4825-8189-b67b8450abba/mzaf_11490815668358717707.plus.aac.p.m4a",
  "audioLabel": "Extrait à identifier",
  "audioStart": 0,
  "audioDuration": 8,
  "answers": ["Queen", "Muse", "Oasis", "Nirvana"],
  "correctIndex": 0
}
```

Image seule ou audio seul :

```json
{
  "id": "logos-001",
  "category": "logos",
  "image": "/assets/quiz/images/logos/example.svg",
  "answers": ["Marque A", "Marque B", "Marque C", "Marque D"],
  "correctIndex": 2
}
```

Validation :

- `image` accepte `.avif`, `.gif`, `.jpg`, `.jpeg`, `.png`, `.svg`, `.webp`.
- `audio` accepte `.aac`, `.m4a`, `.mp3`, `.ogg`, `.wav`, `.webm`.
- Les fichiers locaux doivent exister sous `static/assets/quiz/images` ou `static/assets/quiz/audio`.
- Les images CDN sont limitées à `images.unsplash.com` par défaut.
- Les extraits musicaux CDN sont limités à `audio-ssl.itunes.apple.com` par défaut.
- `audioStart` et `audioDuration` permettent de jouer seulement quelques secondes de preview.
- Les chemins avec `..`, antislash ou dossier inattendu sont refusés.
- Si un média ne charge pas dans le navigateur, la partie continue et affiche un fallback.

Pour ajouter un média à un thème existant :

1. Ajoute le fichier dans `static/assets/quiz/images/<categorie>/` ou `static/assets/quiz/audio/<categorie>/`.
2. Référence ce chemin dans la question JSON avec `image` ou `audio`.
3. Ajoute `imageAlt` ou `audioLabel` pour un libellé propre.
4. Lance `npm run check` puis `npm run build`.
