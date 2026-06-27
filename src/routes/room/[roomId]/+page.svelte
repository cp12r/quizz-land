<script>
  import { onDestroy, onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';
  import PlayerList from '$lib/components/PlayerList.svelte';
  import QuestionCard from '$lib/components/QuestionCard.svelte';
  import TimerCircle from '$lib/components/TimerCircle.svelte';
  import { getPlayerId } from '$lib/stores/user.js';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';
  import { connectRoom } from '$lib/utils/ws.js';

  export let data;

  let room = data.room;
  let player = null;
  let playerName = '';
  let joined = false;
  let joining = false;
  let connectionError = '';
  let selected = null;
  let answerFeedback = null;
  let remaining = room.config.timePerQuestion;
  let copied = false;
  let finishing = false;
  let ws;

  let startCountdownSeconds = 0;
  let countdownActive = false;
  let countdownRemaining = 0;
  let countdownTimer = null;

  $: currentQuestion = room.status === 'playing' ? room.questions[room.currentQuestion] : null;
  $: shareUrl = typeof location === 'undefined' ? '' : `${location.origin}/room/${room.id}`;
  $: isHost = player && room.hostId === player.id;
  $: answeredCount = room.answers?.length || 0;
  $: title = pageTitle(`${room.name} - Salon quiz`);
  $: description = `Rejoins le salon ${room.name} sur ${siteMeta.name} et réponds au quiz en direct, sans compte.`;
  $: progressText =
    room.status === 'playing'
      ? `${room.currentQuestion + 1}/${room.questions.length}`
      : `${room.questions.length} questions`;

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

  function updateRoom(next, options = {}) {
    if (!next) return;
    const previousStatus = room.status;
    const previousQuestion = room.currentQuestion;
    const changedRound = previousQuestion !== next.currentQuestion || previousStatus !== next.status;

    room = next;
    if (options.resetSelection || changedRound) {
      selected = null;
      answerFeedback = null;
      remaining = room.config.timePerQuestion;
    }

    if (room.status !== 'waiting') clearCountdown();

    if (previousStatus === 'waiting' && room.status === 'playing') {
      playSound('start');
    } else if (changedRound && room.status === 'playing') {
      playSound('transition');
    }

    if (room.status === 'finished' && !finishing) {
      finishing = true;
      playSound('reveal');
      setTimeout(() => {
        location.href = `/results/${room.id}`;
      }, 700);
    }
  }

  function safeSend(type, payload) {
    if (!ws) return;
    ws.sendJson(type, payload);
  }

  function startCountdownThenStart() {
    if (!player || countdownActive) return;

    if (!startCountdownSeconds || startCountdownSeconds <= 0) {
      safeSend('start_game', { playerId: player.id });
      return;
    }

    countdownActive = true;
    countdownRemaining = startCountdownSeconds;
    playSound('ui');

    countdownTimer = setInterval(() => {
      countdownRemaining -= 1;
      if (countdownRemaining > 0 && countdownRemaining <= 3) playSound('ui');

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
    playSound('ui');
    safeSend('join_room', { playerId: getPlayerId(), name: getDisplayName() });
  }

  function start() {
    startCountdownThenStart();
  }

  function answer(index) {
    if (!player || selected !== null) return;
    selected = index;
    answerFeedback = null;
    playSound('select');
    safeSend('submit_answer', { playerId: player.id, answerIndex: index });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    copied = true;
    playSound('ui');
    setTimeout(() => {
      copied = false;
    }, 1400);
  }

  onMount(() => {
    initSound();
    playerName = localStorage.getItem('quizz-player-name') || '';
    applyChillClass();
    applyTheme(room.config.themeId);

    ws = connectRoom(room.id, {
      room_state: (payload) => updateRoom(payload),
      question_start: (payload) => updateRoom(payload, { resetSelection: true }),
      round_end: (payload) => updateRoom(payload, { resetSelection: true }),
      answer_submitted: (payload) => updateRoom(payload),
      answer_feedback: (payload) => {
        answerFeedback = payload;
        playSound(payload.correct ? 'correct' : 'wrong');
      },
      timer_tick: (payload) => (remaining = payload.remaining),
      user_joined: (payload) => {
        if (joined && payload.id !== player?.id) playSound('join');
      },
      player_joined: (payload) => {
        player = payload.player;
        updateRoom(payload.room);
        joined = true;
        joining = false;
        connectionError = '';
        playSound('join');
      },
      error: (payload) => {
        joining = false;
        connectionError = payload.message;
        playSound('wrong');
      },
      socket_error: (payload) => {
        joining = false;
        connectionError = payload.message;
      },
      socket_close: () => {
        if (joining) {
          joining = false;
          connectionError = 'Connexion temps réel fermée avant de rejoindre.';
        }
      }
    });

    return () => ws?.close();
  });

  onDestroy(() => {
    clearCountdown();
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex,follow" />
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>

<main class="page">
  <section class="shell room">
    <header class="top">
      <div class="title">
        <span class="brand-mark mono">QL</span>
        <div>
          <p class="mono">{room.id}</p>
          <h1>{room.name}</h1>
        </div>
      </div>
      <div class="top-actions">
        <button
          type="button"
          class="icon-button"
          on:click={toggleSound}
          aria-label={$soundMuted ? 'Activer le son' : 'Couper le son'}
          aria-pressed={!$soundMuted}
        >
          {$soundMuted ? 'Son coupé' : 'Son activé'}
        </button>
        <Button variant="secondary" onclick={copyLink}>{copied ? 'Lien copié' : 'Copier le lien'}</Button>
      </div>
    </header>

    {#if !joined}
      <form class="card join" on:submit|preventDefault={join} aria-describedby="join-status">
        <div class="panel-head">
          <p class="mono">Entrée</p>
          <h2>Entre dans le salon</h2>
        </div>
        <label class="field">
          <span>Pseudo</span>
          <input bind:value={playerName} maxlength="24" placeholder="Ton nom" autocomplete="nickname" />
        </label>
        {#if connectionError}<p id="join-status" class="error" role="alert">{connectionError}</p>{/if}
        <Button type="submit" disabled={joining}>
          {joining ? 'Connexion…' : 'Rejoindre'}
        </Button>
      </form>
    {:else if room.status === 'waiting'}
      <section class="grid">
        <div class="card lobby">
          <div class="lobby-header">
            <div class="panel-head">
              <p class="mono">Salon</p>
              <h2>Avant-partie</h2>
            </div>

            {#if countdownActive}
              <p class="countdown-pill" role="status" aria-live="polite">
                <span class="mono">{countdownRemaining}s</span>
              </p>
            {/if}
          </div>

          <div class="room-code">
            <span class="mono">{room.id}</span>
            <button type="button" on:click={copyLink}>{copied ? 'Copié' : 'Copier'}</button>
          </div>

          <div class="config-row">
            <span>{progressText}</span>
            <span>{room.config.timePerQuestion}s</span>
            <span>{room.config.themeName}</span>
          </div>

          {#if isHost}
            <div class="host-panel">
              <label class="field countdown">
                <span>Décompte <b class="mono">{startCountdownSeconds}s</b></span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  bind:value={startCountdownSeconds}
                  aria-label="Décompte avant lancement"
                />
              </label>
            </div>
          {/if}

          <div class="actions">
            <Button disabled={!isHost || room.players.length < 1 || countdownActive} onclick={start}>
              {countdownActive ? 'Attente…' : 'Lancer la partie'}
            </Button>

            <Button variant="secondary" onclick={copyLink}>Inviter</Button>
          </div>
        </div>

        <PlayerList players={room.players} hostId={room.hostId} title="Dans le salon" />
      </section>
    {:else}
      <section class="grid">
        <div class="play">
          <div class="hud">
            <div>
              <span class="mono">Question {progressText}</span>
              <strong>{answeredCount}/{room.players.length} réponses</strong>
            </div>
            <TimerCircle {remaining} total={room.config.timePerQuestion} />
          </div>

          {#if remaining <= 3 && remaining > 0}
            <div class="suspense mono" role="status" aria-live="polite">Résultat imminent</div>
          {/if}

          <QuestionCard question={currentQuestion} {selected} feedback={answerFeedback} locked={selected !== null} onAnswer={answer} />
        </div>

        <PlayerList players={room.players} hostId={room.hostId} maskScores title="Classement en direct" />
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
  .hud,
  .title,
  .top-actions,
  .lobby-header,
  .actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .top,
  .hud,
  .lobby-header {
    justify-content: space-between;
  }

  .title p,
  .title h1,
  .panel-head p,
  .panel-head h2 {
    margin: 0;
  }

  .brand-mark {
    display: grid;
    width: 52px;
    aspect-ratio: 1;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 14px;
    background: var(--color-ink);
    color: white;
    font-weight: 900;
    box-shadow: var(--shadow-soft);
  }

  .title p,
  .panel-head p {
    color: var(--color-accent);
    font-weight: 900;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.8rem;
  }

  .icon-button {
    min-height: 42px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: var(--color-ink);
    padding: 0 14px;
    font-weight: 900;
    box-shadow: var(--shadow-soft);
  }

  .join,
  .lobby {
    display: grid;
    gap: 18px;
    padding: 24px;
  }

  .join {
    width: min(520px, 100%);
    margin: 0 auto;
  }

  .error {
    margin: 0;
    color: var(--color-danger);
    font-weight: 900;
  }

  .countdown-pill {
    display: grid;
    min-width: 70px;
    min-height: 48px;
    place-items: center;
    margin: 0;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    box-shadow: var(--shadow-soft);
    animation: pulse-ring 900ms ease-out infinite;
  }

  .room-code {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    border: 1px dashed rgba(21, 19, 31, 0.22);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.68);
    padding: 14px;
  }

  .room-code span {
    font-size: 1.9rem;
    font-weight: 900;
  }

  .room-code button {
    min-height: 38px;
    border: 0;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    padding: 0 14px;
    font-weight: 900;
  }

  .config-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .config-row span {
    display: grid;
    min-height: 44px;
    place-items: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.66);
    color: var(--color-muted);
    font-weight: 900;
    text-align: center;
  }

  .host-panel {
    display: grid;
    gap: 10px;
  }

  .actions {
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

  .hud {
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-card);
    background: rgba(255, 255, 255, 0.70);
    padding: 14px 16px;
    box-shadow: var(--shadow-soft);
  }

  .hud > div {
    display: grid;
    gap: 4px;
  }

  .hud span {
    color: var(--color-accent);
    font-weight: 900;
  }

  .hud strong {
    color: var(--color-muted);
  }

  .suspense {
    justify-self: start;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
    animation: pulse-ring 800ms ease-out infinite;
  }

  @media (max-width: 860px) {
    .grid,
    .top {
      grid-template-columns: 1fr;
      display: grid;
    }

    .top-actions,
    .actions {
      width: 100%;
    }

    .icon-button {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .title {
      align-items: start;
    }

    .brand-mark {
      width: 46px;
      border-radius: 12px;
    }

    h1 {
      font-size: 1.6rem;
    }

    .join,
    .lobby {
      padding: 18px;
    }

    .lobby-header,
    .hud,
    .config-row {
      grid-template-columns: 1fr;
      display: grid;
    }
  }
</style>
