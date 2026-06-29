# Audit serveur QuizzLand

## Etat actuel

Le serveur Node lance SvelteKit via `server/index.js` et ouvre un WebSocket `/ws`.

Les rooms sont gardees en memoire dans une `Map` et sauvegardees dans `data/rooms.json`. Les resultats finis sont archives dans `data/results.json`.

Le gameplay existant reste base sur les statuts `waiting`, `playing`, `closing`, `finished`. Le front depend encore de messages WebSocket historiques: `room_state`, `question_start`, `answer_submitted`, `round_end`, `timer_tick`.

## Points faibles trouves

- `server/index.js` contient encore la boucle timer, les sockets, les broadcasts et la fermeture de rooms dans le meme fichier.
- Le protocole WebSocket accepte encore des payloads peu schemas; les erreurs sont capturees, mais les messages ne sont pas tous valides champ par champ.
- Les broadcasts envoient souvent `room_state` complet. C'est simple, mais couteux quand une room grossit.
- Le timer global parcourt les rooms connectees toutes les secondes. Avec beaucoup de rooms, ce point devient un cout fixe.
- `results.json` n'a pas encore la meme ecriture atomique que `rooms.json`.
- Le nombre max de joueurs est configure pour les logs/config, mais pas encore applique comme refus strict dans `joinRoom`.
- Les actions host reposent sur `hostId`; il n'y a pas encore de `hostToken`.

## Risques de crash

- JSON de questions invalide: reduit par validation au chargement, les questions invalides sont ignorees.
- `data/rooms.json` corrompu: reduit par fallback backup et restauration.
- Payload WebSocket invalide: capture dans `server/index.js`, log court, reponse `Message invalide`.
- Timer de round: encore centralise dans `server/index.js`; une erreur est loggee et la boucle continue.

## Risques de perte de donnees

- `rooms.json` est maintenant ecrit via backup, fichier temporaire et rename atomique.
- La persistance est debounced; une coupure process peut perdre les toutes dernieres actions non flushees.
- `results.json` reste plus fragile que `rooms.json`.
- En environnement multi-instance Render, chaque instance aurait son propre disque/memoire. Redis ou Postgres devient necessaire avant scaling horizontal.

## Risques de triche

- Le score est calcule cote serveur dans `submitAnswer`.
- Un joueur peut encore envoyer des actions avec un `playerId` connu s'il le vole.
- L'host est verifie par `hostId`, mais pas protege par token secret.
- Les answers privees ne sont pas loggees, et `publicRoom` retire `correctIndex` des questions envoyees.

## Risques de ralentissement

- Broadcast complet de room apres plusieurs actions.
- `timer_tick` toutes les secondes pour chaque room active.
- Sauvegarde disque encore appelee depuis beaucoup d'actions, meme si elle est maintenant debounced.
- Validation des questions custom faite a l'import/config de room, pas a chaque round.

## Priorites

P0:
- Ajouter validation stricte des messages WebSocket par type.
- Ajouter `hostToken` pour les actions host.
- Appliquer `MAX_PLAYERS_PER_ROOM` dans `joinRoom`.
- Donner a `results.json` la meme persistance atomique que `rooms.json`.

P1:
- Sortir WebSocket, timers et persistence dans des modules separes.
- Remplacer une partie des `room_state` complets par des events cibles.
- Ajouter heartbeat ping/pong.
- Ajouter rate limiting WebSocket par socket et par room.

P2:
- Ajouter `/health` et stats protegees.
- Preparer une interface Redis/Postgres.
- Ajouter un load test automatisable.

## Decisions prises

- Pas de dependance de validation ajoutee. Le schema requis est court, une validation maison evite du poids et du cout runtime.
- Validation des questions au chargement ou a l'import du pack, jamais pendant un round.
- Les champs inconnus des questions sont ignores.
- Les images externes sont refusees par defaut.
- Les logs restent humains par defaut et passent en JSON uniquement avec `LOG_JSON=true`.
- `NO_COLOR=true` coupe les couleurs ANSI.

## Modifie

- Logger serveur dedie: `server/lib/logger.js`.
- Config serveur: `server/config.js`.
- Validation questions: `server/lib/questionValidator.js`.
- Re-export logger cote SvelteKit: `src/server/services/logger.js`.
- Validation branchee dans `src/server/services/questions.js`.
- Lecture/ecriture robuste de `data/rooms.json` dans `src/server/services/roomManager.js`.
- Logs courts ajoutes sur creation room, join, start, finish, delete, persistence et erreurs WebSocket.
- Variables ajoutees dans `.env` et `.env.example`.

## Reste a faire

- Refactor complet en `RoomManager`, `GameEngine`, `PersistenceManager`, `RateLimiter`, `CleanupScheduler`.
- Validation exhaustive du protocole WebSocket.
- Tests automatises de bout en bout.
- Persistance externe avant multi-instance.
- Migration des anciens statuts vers `lobby`, `question`, `reveal`, `scoreboard`, `finished` si le front est adapte.

## Limites connues

- Le gameplay visible n'a pas ete change.
- Le protocole WebSocket historique reste compatible, donc pas encore optimal.
- La persistance debounced privilegie la fluidite; elle n'est pas un journal transactionnel.
- Les logs ne contiennent pas les payloads complets, donc certains debugs demanderont une reproduction locale.

## Tests effectues

- `npm run build`: OK.
- Creation room via `createRoom`: OK.
- Join de deux joueurs via `joinRoom`: OK.
- Demarrage via `startGame`: OK.
- Partie complete via `submitAnswer` et `advanceRound`: OK.
- Questions invalides ignorees sans crash via `validateQuestionPack`: OK.
- `rooms.json` corrompu restaure depuis `rooms.backup.json` dans un dossier temporaire: OK.
- Logs ANSI visibles dans la console locale; Render les affichera en mode texte couleur si le terminal accepte ANSI.

