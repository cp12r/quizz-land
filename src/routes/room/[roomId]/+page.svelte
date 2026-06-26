<script>
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import PlayerList from '$lib/components/PlayerList.svelte';
  import QuestionCard from '$lib/components/QuestionCard.svelte';
  import TimerCircle from '$lib/components/TimerCircle.svelte';
  import { connectRoom } from '$lib/utils/ws.js';
  import { getPlayerId } from '$lib/stores/user.js';

  export let data;

  let room = data.room;
  let player = null;

  let playerName = '';
  let joined = false;
  let joining = false;
  let connectionError = '';

  let selected = null;
  let remaining = room.config.timePerQuestion;

  let ws;

  // Host: délai avant lancement (pour laisser le temps à tout le monde en vocal discord)
  let startCountdownSeconds = 0;
  let countdownActive = false;
  let countdownRemaining = 0;
  let countdownTimer = null;

  $: currentQuestion = room.status === 'playing' ? room.questions[room.currentQuestion] : null;
  $: shareUrl = typeof location === 'undefined' ? '' : `${location.origin}/room/${room.id}`;
  $: isHost = player && room.hostId === player.id;

  function getDisplayName() {
    return (playerName || '').trim() || 'Joueur';
  }

  function applyChillClass() {
    const enabled = localStorage.getItem('quizz-chill') === 'true';
    document.documentElement.classList.toggle('chill', enabled);
  }

  function clearCountdown() {
    countdownActive = false;
    countdownRemaining = 0;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function handleRoomState(next) {
    room = next;
    selected = null;

    // On stop le countdown dès qu'on quitte l'état waiting.
    if (room.status !== 'waiting') clearCountdown();

    if (room.status === 'finished') location.href = `/results/${room.id}`;
  }

  function safeSend(type, payload) {
    if (!ws) return;
    ws.sendJson(type, payload);
  }

  function startCountdownThenStart() {
    if (!player) return;
    if (countdownActive) return;

    // Pas de countdown => démarrage direct
    if (!startCountdownSeconds || startCountdownSeconds <= 0) {
      safeSend('start_game', { playerId: player.id });
      return;
    }

    countdownActive = true;
    countdownRemaining = startCountdownSeconds;

    // Laisse le temps de “brancher” tout le monde, surtout en voc Discord.
    countdownTimer = setInterval(() => {
      countdownRemaining -= 1;

      if (countdownRemaining <= 0) {
        clearCountdown();
        safeSend('start_game', { playerId: player.id });
      }
    }, 1000);
  }

  function join() {
    joining = true;
    connectionError = '';

    localStorage.setItem('quizz-player-name', getDisplayName());
    safeSend('join_room', { playerId: getPlayerId(), name: getDisplayName() });
  }

  function start() {
    startCountdownThenStart();
  }

  function answer(index) {
    selected = index;
    safeSend('submit_answer', { playerId: player.id, answerIndex: index });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
  }

  onMount(() => {
    playerName = localStorage.getItem('quizz-player-name') || '';
    applyChillClass();

    ws = connectRoom(room.id, {
      room_state: handleRoomState,
      question_start: handleRoomState,
      round_end: handleRoomState,
      timer_tick: (payload) => (remaining = payload.remaining),
      player_joined: (payload) => {
        player = payload.player;
        room = payload.room;
        joined = true;
        joining = false;
        connectionError = '';
      },
      error: (payload) => {
        joining = false;
        connectionError = payload.message;
      },
      socket_error: (payload) => {
        joining = false;
        connectionError = payload.message;
      },
      socket_close: () => {
        if (joining) {
          joining = false;
          connectionError = 'Connexion temps reel fermee avant de rejoindre.';
        }
      }
    });

    return () => ws?.close();
  });

  onDestroy(() => {
    clearCountdown();
  });
</script>

<main class="page">
  <section class="shell room">
    <header class="top">
      <div class="title">
        <p class="mono">{room.id}</p>
        <h1>{room.name}</h1>
      </div>
      <Button variant="secondary" onclick={copyLink}>Copier le lien</Button>
    </header>

    {#if !joined}
      <form class="card join" on:submit|preventDefault={join}>
        <label class="field">
          <span>Pseudo</span>
          <input bind:value={playerName} maxlength="24" placeholder="Ton nom" />
        </label>
        {#if connectionError}<p class="error">{connectionError}</p>{/if}
        <Button type="submit" disabled={joining}>
          {joining ? 'Connexion...' : 'Rejoindre'}
        </Button>
      </form>
    {:else if room.status === 'waiting'}
      <section class="grid">
        <div class="card lobby">
          <div class="lobby-header">
            <div>
              <h2>Salon d attente</h2>
              <p>Partage le lien et lance quand tout le monde est pret.</p>
            </div>

            {#if countdownActive}
              <p class="badge">
                <span class="badge-label">Demarrage</span>
                <span class="badge-value mono">{countdownRemaining}s</span>
              </p>
            {/if}
          </div>

          {#if isHost}
            <div class="host-panel">
              <label class="field countdown">
                <span>
                  Countdown avant lancement:&nbsp;<b class="mono">{startCountdownSeconds}s</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  bind:value={startCountdownSeconds}
                  aria-label="Countdown avant lancement"
                />
              </label>

              <p class="host-hint">
                Astuce : en vocal Discord, mets 2–3s pour que tout le monde suive.
              </p>
            </div>
          {/if}

          <div class="actions">
            <Button
              disabled={!isHost || room.players.length < 1 || countdownActive}
              onclick={start}
            >
              {countdownActive ? 'Attente...' : 'Lancer'}
            </Button>

            <Button variant="secondary" onclick={copyLink}>Copier le lien</Button>
          </div>
        </div>

        <PlayerList players={room.players} hostId={room.hostId} />
      </section>
    {:else}
      <section class="grid">
        <div class="play">
          <div class="hud">
            <span class="mono">
              Question {room.currentQuestion + 1}/{room.questions.length}
            </span>
            <TimerCircle {remaining} total={room.config.timePerQuestion} />
          </div>

          <QuestionCard
            question={currentQuestion}
            {selected}
            locked={selected !== null}
            onAnswer={answer}
          />
        </div>

        <PlayerList players={room.players} hostId={room.hostId} />
      </section>
    {/if}
  </section>
</main>

<style>
  .room {
    display: grid;
    gap: 24px;
  }

  .top,
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .title p,
  .title h1 {
    margin: 0;
  }

  .top p {
    color: var(--color-accent);
    font-weight: 700;
  }

  .join,
  .lobby {
    display: grid;
    gap: 16px;
    padding: 24px;
  }

  .lobby-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  h2 {
    margin: 0;
  }

  .error {
    margin: 0;
    color: var(--color-danger);
    font-weight: 700;
  }

  .countdown span {
    color: var(--gray-600);
    font-size: 14px;
    font-weight: 700;
  }

  .host-panel {
    display: grid;
    gap: 10px;
  }

  .host-hint {
    margin: 0;
    color: var(--gray-600);
    font-weight: 700;
    font-size: 13px;
  }

  .badge {
    margin: 0;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: baseline;
    border: 1px solid var(--gray-200);
    background: var(--gray-50);
    padding: 10px 12px;
    border-radius: 999px;
    box-shadow: var(--shadow-card);
  }

  .badge-label {
    color: var(--gray-600);
    font-weight: 800;
    font-size: 13px;
  }

  .badge-value {
    color: var(--color-blue);
    font-weight: 900;
    font-size: 14px;
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 24px;
    align-items: start;
  }

  .play {
    display: grid;
    gap: 16px;
  }

  @media (max-width: 820px) {
    .grid,
    .top {
      grid-template-columns: 1fr;
      display: grid;
    }

    .lobby-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
