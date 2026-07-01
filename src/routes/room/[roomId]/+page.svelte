<script>
  import { onDestroy, onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { roomMeta, siteMeta } from '$lib/config/site.js';
  import AnswerImpactEffect from '$lib/components/AnswerImpactEffect.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import PlayerList from '$lib/components/PlayerList.svelte';
  import QuestionCard from '$lib/components/QuestionCard.svelte';
  import RoomOrb3D from '$lib/components/RoomOrb3D.svelte';
  import SceneBackground3D from '$lib/components/SceneBackground3D.svelte';
  import TimerCircle from '$lib/components/TimerCircle.svelte';
  import TimerRing3D from '$lib/components/TimerRing3D.svelte';
  import { getPlayerId } from '$lib/stores/user.js';
  import { getSeasonIcon } from '$lib/utils/seasonAssets.js';
  import { preloadUpcomingQuestionMedia } from '$lib/utils/questionMedia.js';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';
  import { connectRoom } from '$lib/utils/ws.js';

  export let data;

  const CLOSE_FALLBACK_MS = 4800;
  const WAITING_LINES = [
    'Pose les verres, le quiz chauffe.',
    'Un dernier joueur et ça part.',
    'La room est prête, manque juste la bande.',
    'Prépare ton meilleur mauvais choix.'
  ];
  const ROUND_LINES = [
    'Les cerveaux transpirent.',
    'Les reponses arrivent.',
    'Ca sent le clutch.',
    'Quelqu un prepare une masterclass.'
  ];

  let room = data.room;
  let player = null;
  let playerName = '';
  let joined = false;
  let joining = false;
  let questionCountUpdating = false;
  let connectionError = '';
  let selected = null;
  let answerFeedback = null;
  let remaining = room.config.timePerQuestion;
  let copied = false;
  let finishing = false;
  let roomClosing = room.status === 'closing';
  let closeRedirectTo = '/';
  let closingProgress = 0;
  let closingCountdown = 5;
  let closingTimer = null;
  let ws;
  let notices = [];
  let noticeId = 1;
  let seenAnswerKeys = new Set();
  let timerWarningKey = '';

  let startCountdownSeconds = 0;
  let countdownActive = false;
  let countdownRemaining = 0;
  let countdownTimer = null;

  $: currentQuestion = room.status === 'playing' ? room.questions[room.currentQuestion] : null;
  $: currentQuestionIcon = currentQuestion ? getSeasonIcon(currentQuestion.category) : '';
  $: canonicalUrl = data.canonicalUrl || `${data.origin}/room/${room.id}`;
  $: ogImage = `${data.origin}/og/room/${room.id}.svg`;
  $: shareUrl = canonicalUrl;
  $: isHost = player && room.hostId === player.id;
  $: activePlayers = (room.players || []).filter((item) => item.connected !== false);
  $: activePlayerIds = new Set(activePlayers.map((item) => item.id));
  $: activePlayerCount = activePlayers.length;
  $: answeredCount = new Set(
    (room.answers || [])
      .filter((answer) => activePlayerIds.has(answer.playerId))
      .map((answer) => answer.playerId)
  ).size;
  $: canStart = Boolean(isHost && activePlayerCount >= 2 && !countdownActive);
  $: lobbyQuestionCount = Number(room.config.requestedQuestionCount || room.config.questionCount || room.questions.length || 1);
  $: lobbyQuestionMin = Number(room.config.minQuestionCount || 1);
  $: lobbyQuestionMax = Number(
    room.config.availableQuestionCount || Math.max(lobbyQuestionCount, room.questions.length || 1)
  );
  $: canDecreaseQuestions = Boolean(isHost && !questionCountUpdating && lobbyQuestionCount > lobbyQuestionMin);
  $: canIncreaseQuestions = Boolean(isHost && !questionCountUpdating && lobbyQuestionCount < lobbyQuestionMax);
  $: allAnswered = Boolean(room.status === 'playing' && activePlayerCount > 0 && answeredCount >= activePlayerCount);
  $: lobbyReady = activePlayerCount >= 2;
  $: answerProgress = activePlayerCount ? Math.min(100, Math.round((answeredCount / activePlayerCount) * 100)) : 0;
  $: waitingLine = WAITING_LINES[(room.id?.charCodeAt(0) || activePlayerCount) % WAITING_LINES.length];
  $: roundLine = ROUND_LINES[Math.max(0, room.currentQuestion) % ROUND_LINES.length];
  $: meta = roomMeta(room);
  $: title = meta.title;
  $: description = meta.description;
  $: progressText =
    room.status === 'playing'
      ? `${room.currentQuestion + 1}/${room.questions.length}`
      : `${room.questions.length} questions`;
  $: customOnly = !room.config.categories?.length && room.config.customQuestionCount > 0;
  $: mixLabel = customOnly
    ? `${room.config.customQuestionCount} question${room.config.customQuestionCount > 1 ? 's' : ''} perso`
    : `${room.config.categories?.length || 0} sujet${(room.config.categories?.length || 0) > 1 ? 's' : ''}`;
  $: lobbyStatus = activePlayerCount < 2 ? 'En attente de joueurs' : 'Prêt à jouer';

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

  function clearClosingTimer() {
    if (closingTimer) {
      clearInterval(closingTimer);
      closingTimer = null;
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function addNotice(title, detail = '', tone = 'info') {
    const id = noticeId++;
    notices = [{ id, title, detail, tone }, ...notices].slice(0, 4);
    setTimeout(() => {
      notices = notices.filter((notice) => notice.id !== id);
    }, 4200);
  }

  function addAnswerNotice(nextRoom) {
    const latest = [...(nextRoom.answers || [])].sort((a, b) => (b.ms || 0) - (a.ms || 0))[0];
    if (!latest) return;

    const key = `${latest.playerId}:${latest.questionId}`;
    if (seenAnswerKeys.has(key)) return;
    seenAnswerKeys.add(key);

    const author = nextRoom.players.find((item) => item.id === latest.playerId);
    const title = latest.playerId === player?.id ? 'Ta réponse est notée' : `${author?.name || 'Un joueur'} a répondu`;
    const nextActiveIds = new Set((nextRoom.players || []).filter((item) => item.connected !== false).map((item) => item.id));
    const activeAnswerCount = new Set(
      (nextRoom.answers || [])
        .filter((answer) => nextActiveIds.has(answer.playerId))
        .map((answer) => answer.playerId)
    ).size;
    addNotice(title, `${activeAnswerCount}/${nextActiveIds.size} réponses`, 'answer');
  }

  function getRemainingSeconds(nextRoom) {
    if (!nextRoom?.roundEndsAt) return nextRoom?.config?.timePerQuestion || 0;
    return Math.max(0, Math.ceil((nextRoom.roundEndsAt - Date.now()) / 1000));
  }

  function getSortedResults(nextRoom) {
    return [...(nextRoom.players || [])].sort((a, b) => b.score - a.score);
  }

  function saveResultBackup(nextRoom) {
    if (typeof sessionStorage === 'undefined') return;

    const backup = {
      room: { ...nextRoom, questions: undefined },
      results: getSortedResults(nextRoom),
      savedAt: new Date().toISOString()
    };

    sessionStorage.setItem(`quizz-results-${nextRoom.id}`, JSON.stringify(backup));
  }

  function beginRoomClosing(payload = {}) {
    const nextRoom = payload.room || payload;
    const target = payload.redirectTo || '/';
    const closesAt = new Date(nextRoom?.closesAt || Date.now() + CLOSE_FALLBACK_MS).getTime();
    const startedAt = Date.now();
    const duration = Math.max(1, closesAt - startedAt);

    roomClosing = true;
    closeRedirectTo = target;
    if (nextRoom?.id) updateRoom(nextRoom);
    clearCountdown();
    clearClosingTimer();
    addNotice('Salon fermé', payload.message || "Retour à l'accueil en cours", 'warning');
    playSound('wrong');

    function tick() {
      const remainingMs = Math.max(0, closesAt - Date.now());
      closingCountdown = Math.max(0, Math.ceil(remainingMs / 1000));
      closingProgress = clamp(1 - remainingMs / duration, 0, 1);

      if (remainingMs <= 0) {
        clearClosingTimer();
        location.href = closeRedirectTo;
      }
    }

    tick();
    closingTimer = setInterval(tick, 100);
  }

  function handleTimerTick(payload) {
    remaining = payload.remaining;
    if (room.status !== 'playing' || !currentQuestion) return;

    const key = `${room.currentQuestion}:${payload.remaining}`;
    if (payload.remaining <= 5 && payload.remaining > 0 && timerWarningKey !== key) {
      timerWarningKey = key;
      playSound('timer-low');
      if (payload.remaining === 5 || payload.remaining === 3) {
        addNotice('Dernières secondes', `${payload.remaining} secondes restantes`, 'warning');
      }
    }
  }

  function setLobbyQuestionCount(delta) {
    if (!player || !isHost || questionCountUpdating || room.status !== 'waiting') return;
    const nextCount = clamp(lobbyQuestionCount + delta, lobbyQuestionMin, lobbyQuestionMax);
    if (nextCount === lobbyQuestionCount) return;

    questionCountUpdating = true;
    clearCountdown();
    playSound('ui');
    safeSend('update_question_count', { playerId: player.id, questionCount: nextCount });
  }

  function updateRoom(next, options = {}) {
    if (!next) return;
    const previousStatus = room.status;
    const previousQuestion = room.currentQuestion;
    const previousRoundEndsAt = room.roundEndsAt;
    const previousAnsweredCount = room.answers?.length || 0;
    const changedRound = previousQuestion !== next.currentQuestion || previousStatus !== next.status;
    const roundDeadlineChanged = previousRoundEndsAt !== next.roundEndsAt;
    const nextAnsweredCount = next.answers?.length || 0;
    const expectedAnswers = next.players?.length || 0;
    const everyoneAnsweredNow = Boolean(
      next.status === 'playing' &&
      !changedRound &&
      roundDeadlineChanged &&
      expectedAnswers > 0 &&
      previousAnsweredCount < expectedAnswers &&
      nextAnsweredCount >= expectedAnswers
    );

    room = next;
    preloadUpcomingQuestionMedia(room.questions, room.currentQuestion, 2);
    if (options.resetSelection || changedRound) {
      selected = null;
      answerFeedback = null;
      remaining = room.config.timePerQuestion;
      timerWarningKey = '';
    } else if (roundDeadlineChanged && room.status === 'playing') {
      remaining = getRemainingSeconds(room);
    }

    if (room.status !== 'waiting') clearCountdown();

    if (room.status === 'closing' && !roomClosing) {
      beginRoomClosing({ room, redirectTo: '/' });
    }

    if (previousStatus === 'waiting' && room.status === 'playing') {
      playSound('start');
      addNotice('Partie lancée', `Question 1/${room.questions.length}`, 'start');
    } else if (changedRound && room.status === 'playing') {
      playSound('transition');
      addNotice(`Nouvelle manche`, `Question ${room.currentQuestion + 1}/${room.questions.length}`, 'round');
    }

    if (everyoneAnsweredNow) {
      playSound('ui');
      addNotice('Tout le monde a répondu', 'Reveal dans 5s', 'round');
    }

    if (room.status === 'finished' && !finishing) {
      finishing = true;
      roomClosing = false;
      clearClosingTimer();
      saveResultBackup(room);
      playSound('reveal');
      addNotice('Classement final', 'Les scores arrivent', 'finish');
      setTimeout(() => {
        location.assign(`/results/${room.id}`);
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
    addNotice('Lien copié', 'Invitation prête à partager', 'info');
    playSound('ui');
    setTimeout(() => {
      copied = false;
    }, 1400);
  }

  async function shareRoom() {
    const payload = {
      title: title || 'Quizz Land',
      text: `${room.name} t'attend sur Quizz Land (${room.id}).`,
      url: shareUrl
    };

    if (navigator.share) {
      await navigator.share(payload).catch(() => {});
      playSound('ui');
      return;
    }

    await copyLink();
  }

  onMount(() => {
    initSound();
    playerName = localStorage.getItem('quizz-player-name') || '';
    applyChillClass();
    applyTheme(room.config.themeId);
    preloadUpcomingQuestionMedia(room.questions, Math.max(0, room.currentQuestion), 2);

    ws = connectRoom(room.id, {
      room_state: (payload) => updateRoom(payload),
      question_start: (payload) => updateRoom(payload, { resetSelection: true }),
      round_end: (payload) => updateRoom(payload, { resetSelection: true }),
      answer_submitted: (payload) => {
        addAnswerNotice(payload);
        updateRoom(payload);
      },
      answer_feedback: (payload) => {
        answerFeedback = payload;
        addNotice(payload.correct ? `+${payload.points} points` : 'Réponse verrouillée', payload.correct ? 'Bien joué' : 'Pas cette fois', payload.correct ? 'success' : 'warning');
        playSound(payload.correct ? 'correct' : 'wrong');
      },
      question_count_updated: (payload) => {
        questionCountUpdating = false;
        updateRoom(payload);
        addNotice('Nombre de questions prêt', `${payload.config.questionCount} questions`, 'info');
      },
      room_closing: beginRoomClosing,
      room_closed: (payload) => {
        if (finishing || room.status === 'finished') return;
        closeRedirectTo = payload.redirectTo || '/';
        location.href = closeRedirectTo;
      },
      timer_tick: handleTimerTick,
      user_joined: (payload) => {
        if (joined && payload.id !== player?.id) {
        addNotice(`${payload.name} est entré`, `${activePlayerCount + 1} joueurs connectés`, 'join');
          playSound('join');
        }
      },
      player_joined: (payload) => {
        player = payload.player;
        updateRoom(payload.room);
        joined = true;
        joining = false;
        connectionError = '';
        addNotice('Salon rejoint', 'Tu es dedans', 'success');
        playSound('join');
      },
      error: (payload) => {
        joining = false;
        questionCountUpdating = false;
        connectionError = payload.message;
        playSound('wrong');
      },
      socket_error: (payload) => {
        joining = false;
        questionCountUpdating = false;
        connectionError = payload.message;
      },
      socket_close: () => {
        questionCountUpdating = false;
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
    clearClosingTimer();
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex,follow" />
  <meta name="theme-color" content={siteMeta.themeColor} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:secure_url" content={ogImage} />
  <meta property="og:image:type" content="image/svg+xml" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={`Aperçu du salon ${room.name} sur ${siteMeta.name}`} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<main class="page room-page" class:closing={roomClosing || room.status === 'closing'}>
  <SceneBackground3D variant={room.status === 'playing' ? 'game' : 'lobby'} intensity={0.36} />

  <section class="shell room">
    <header class="top">
      <div class="title">
        <span class="brand-mark mono">QL</span>
        <div>
          <p class="mono">{room.id} / {mixLabel}</p>
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
          <span aria-hidden="true">{$soundMuted ? 'OFF' : 'ON'}</span>
        </button>
        <Button variant="secondary" onclick={copyLink}>{copied ? 'Lien copié' : 'Copier le lien'}</Button>
      </div>
    </header>

    <div class="notice-tray" aria-live="polite" aria-label="Notifications de partie">
      {#each notices as notice (notice.id)}
        <article class={`notice notice-${notice.tone}`} role="status">
          <strong>{notice.title}</strong>
          {#if notice.detail}<span>{notice.detail}</span>{/if}
        </article>
      {/each}
    </div>

    {#if !joined}
      <form class="card join" on:submit|preventDefault={join} aria-describedby="join-status">
        <div class="panel-head">
          <p class="mono">Jouer</p>
          <h2>Rejoins la partie</h2>
        </div>
        <label class="field">
          <span>Pseudo</span>
          <input bind:value={playerName} maxlength="24" placeholder="Ton nom" autocomplete="nickname" />
        </label>
        {#if connectionError}
          <EmptyState
            icon="!"
            eyebrow="Connexion"
            title="Erreur serveur"
            detail={connectionError}
            actionLabel="Réessayer"
            onAction={join}
          />
        {/if}
        <Button type="submit" disabled={joining}>
          {joining ? 'Entrée...' : 'Rejoindre'}
        </Button>
      </form>
    {:else if room.status === 'waiting'}
      <section class="grid">
        <div class="card lobby">
          <RoomOrb3D playerCount={activePlayerCount} ready={lobbyReady} countdown={countdownActive} />

          <div class="lobby-header">
            <div class="panel-head">
              <p class="mono">Salon</p>
              <h2>Lobby</h2>
            </div>

            {#if countdownActive}
              <p class="countdown-pill" role="status" aria-live="polite">
                <span class="mono">{countdownRemaining}s</span>
              </p>
            {:else}
              <p class="ready-pill mono" role="status">{lobbyStatus}</p>
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

          <div class="room-preview" aria-label="Apercu de la partie">
            <div>
              <span class="mono">Mode</span>
              <strong>{room.config.modeName || room.config.mode?.name || 'Quiz'}</strong>
            </div>
            <div>
              <span class="mono">Joueurs</span>
              <strong>{activePlayerCount}/{room.players.length || 1}</strong>
            </div>
            <div>
              <span class="mono">Duree</span>
              <strong>{Math.max(1, Math.ceil((room.config.questionCount * room.config.timePerQuestion) / 60))} min</strong>
            </div>
          </div>

          <p class="lobby-line">{waitingLine}</p>

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

              <div class="lobby-question-control" role="group" aria-label="Nombre de questions">
                <button
                  type="button"
                  on:click={() => setLobbyQuestionCount(-1)}
                  disabled={!canDecreaseQuestions}
                  aria-label="Retirer une question"
                >
                  -
                </button>
                <div>
                  <span class="mono">Questions</span>
                  <strong>{lobbyQuestionCount}</strong>
                  <em>max {lobbyQuestionMax}</em>
                </div>
                <button
                  type="button"
                  on:click={() => setLobbyQuestionCount(1)}
                  disabled={!canIncreaseQuestions}
                  aria-label="Ajouter une question"
                >
                  +
                </button>
              </div>
            </div>
          {/if}

          <div class="actions">
            <Button disabled={!canStart} onclick={start}>
              {countdownActive ? 'Décompte...' : 'Lancer la partie'}
            </Button>

            <Button variant="secondary" onclick={copyLink}>Inviter les potes</Button>
            <Button variant="ghost" onclick={shareRoom}>Partage rapide</Button>
          </div>

          {#if isHost && activePlayerCount < 2}
            <EmptyState
              icon="H"
              eyebrow="Créateur"
              title="En attente des joueurs"
              detail="Il faut au moins 2 joueurs pour lancer une partie."
              actionLabel={copied ? 'Lien copié' : 'Copier le lien'}
              onAction={copyLink}
            />
          {/if}
        </div>

        <PlayerList players={room.players} hostId={room.hostId} title="Dans le salon" />
      </section>
    {:else if room.status === 'closing' || roomClosing}
      <section class="closing-panel card" role="status" aria-live="assertive">
        <div class="panel-head">
          <p class="mono">Salon</p>
          <h2>Salon fermé</h2>
        </div>
        <p>Un joueur a quitté le salon. Retour à l'accueil dans {closingCountdown}s.</p>
        <div class="closing-meter" style={`--close-progress:${closingProgress * 100}%;`} aria-hidden="true">
          <span></span>
        </div>
      </section>
    {:else}
      <section class="grid">
        <div class="play">
          <div class="hud">
            <div class="hud-question">
              {#if currentQuestionIcon}
                <img class="hud-season-icon ql-float" src={currentQuestionIcon} alt="" aria-hidden="true" loading="lazy" />
              {/if}
              <span class="mono">Question {progressText}</span>
              <strong>{answeredCount}/{activePlayerCount} réponses</strong>
              <div
                class="answer-meter"
                style={`--answer-progress:${answerProgress}%;`}
                aria-label={`${answeredCount} reponses sur ${activePlayerCount}`}
              >
                <span></span>
              </div>
            </div>
            <TimerCircle {remaining} total={room.config.timePerQuestion} />
          </div>

          {#if allAnswered && remaining <= 5 && remaining > 0}
            <div class="suspense all-answered mono" role="status" aria-live="polite">Tout le monde a repondu - prochaine manche dans {remaining}s</div>
          {:else if remaining <= 3 && remaining > 0}
            <div class="suspense mono" role="status" aria-live="polite">Le reveal arrive</div>
          {:else}
            <div class="round-line mono" role="status">{roundLine}</div>
          {/if}

          <div class="question-stage">
            <TimerRing3D {remaining} total={room.config.timePerQuestion} active={room.status === 'playing'} complete={allAnswered} />
            <AnswerImpactEffect feedback={answerFeedback} {selected} questionKey={currentQuestion?.id || room.currentQuestion} />
            <QuestionCard question={currentQuestion} {selected} feedback={answerFeedback} locked={selected !== null} onAnswer={answer} />
          </div>
        </div>

        <PlayerList players={room.players} hostId={room.hostId} maskScores title="Classement en direct" />
      </section>
    {/if}
  </section>
</main>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .room-page {
    --ink: #0b1020;
    --paper: #e6e8ef;
    --paper-dim: rgba(230, 232, 239, 0.72);
    --line: rgba(230, 232, 239, 0.18);
    --hot: var(--color-accent);
    --cyan: var(--color-cyan);
    --yellow: var(--color-yellow);
    --lime: var(--color-mint);
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background:
      linear-gradient(122deg, rgba(229, 57, 53, 0.16), transparent 34%),
      linear-gradient(248deg, rgba(57, 213, 255, 0.14), transparent 38%),
      conic-gradient(from 120deg at 50% 18%, #171e31, #0b1020, #0f0e12, #212a45, #0b1020);
    color: var(--paper);
  }

  .room-page::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.034) 0 1px, transparent 1px 78px),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.024) 0 1px, transparent 1px 78px);
    opacity: 0.46;
    mask-image: linear-gradient(to bottom, black 0%, transparent 84%);
  }

  .room {
    position: relative;
    z-index: 1;
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
    border: 1px solid rgba(230, 232, 239, 0.22);
    border-radius: 8px;
    background: linear-gradient(135deg, var(--yellow), var(--hot));
    color: var(--ink);
    font-weight: 950;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  }

  .title p,
  .panel-head p {
    color: var(--yellow);
    font-weight: 900;
    text-transform: uppercase;
  }

  h1 {
    color: var(--paper);
    font-size: clamp(1.75rem, 5svw, 3.8rem);
    line-height: 0.95;
    text-transform: uppercase;
  }

  h2 {
    color: var(--paper);
    font-size: clamp(1.6rem, 4svw, 2.5rem);
    line-height: 1;
    text-transform: uppercase;
  }

  .icon-button {
    display: grid;
    width: 48px;
    min-height: 46px;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.22);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.08);
    color: var(--paper);
    padding: 0;
    font-size: 1.35rem;
    font-weight: 900;
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
  }

  .notice-tray {
    position: fixed;
    right: clamp(12px, 3svw, 28px);
    bottom: clamp(12px, 3svw, 28px);
    z-index: 8;
    display: grid;
    width: min(340px, calc(100svw - 24px));
    gap: 8px;
    pointer-events: none;
  }

  .notice {
    display: grid;
    gap: 3px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    padding: 10px 12px;
    background:
      linear-gradient(90deg, rgba(230, 232, 239, 0.1), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.86);
    color: var(--paper);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.26);
    animation: notice-in 260ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
  }

  .notice strong,
  .notice span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .notice span {
    color: var(--paper-dim);
  }

  .notice-success,
  .notice-join {
    border-color: rgba(54, 210, 124, 0.34);
  }

  .notice-warning {
    border-color: rgba(255, 213, 74, 0.42);
  }

  .join,
  .lobby {
    display: grid;
    gap: 18px;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(230, 232, 239, 0.09), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.68);
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(14px);
  }

  .join {
    width: min(520px, 100%);
    margin: 0 auto;
  }

  .lobby {
    position: relative;
    overflow: hidden;
  }

  .lobby-header,
  .room-code,
  .config-row,
  .room-preview,
  .lobby-line,
  .host-panel,
  .actions,
  .lobby :global(.empty-state) {
    position: relative;
    z-index: 1;
  }

  .error {
    margin: 0;
    color: var(--yellow);
    font-weight: 900;
  }

  .countdown-pill,
  .ready-pill {
    display: grid;
    min-width: 70px;
    min-height: 48px;
    place-items: center;
    margin: 0;
    border: 1px solid rgba(230, 232, 239, 0.2);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.1);
    color: var(--paper);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.18);
    padding: 0 12px;
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .countdown-pill {
    animation: pulse-ring 900ms ease-out infinite;
  }

  .room-code {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    border: 1px dashed rgba(230, 232, 239, 0.24);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.07);
    padding: 14px;
  }

  .room-code span {
    font-size: 1.9rem;
    font-weight: 900;
  }

  .room-code button {
    min-height: 38px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    padding: 0 14px;
    font-weight: 900;
    text-transform: uppercase;
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
    border: 1px solid rgba(230, 232, 239, 0.13);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.075);
    color: var(--paper-dim);
    font-weight: 900;
    text-align: center;
    text-transform: uppercase;
  }

  .room-preview {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .room-preview div {
    display: grid;
    gap: 4px;
    min-height: 70px;
    align-content: center;
    border: 1px solid rgba(57, 213, 255, 0.16);
    border-radius: 8px;
    padding: 10px 12px;
    background:
      linear-gradient(135deg, rgba(57, 213, 255, 0.1), rgba(255, 213, 74, 0.06)),
      rgba(230, 232, 239, 0.045);
  }

  .room-preview span {
    color: var(--color-cyan);
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .room-preview strong {
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--paper);
    font-size: 1rem;
    line-height: 1.1;
  }

  .lobby-line {
    margin: -2px 0 0;
    border-left: 3px solid var(--yellow);
    padding-left: 10px;
    color: var(--paper-dim);
    font-weight: 900;
  }

  .host-panel {
    display: grid;
    gap: 10px;
  }

  .lobby-question-control {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    gap: 10px;
    align-items: center;
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    padding: 12px;
    background: rgba(230, 232, 239, 0.06);
  }

  .lobby-question-control button {
    display: grid;
    width: 44px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.24);
    border-radius: 50%;
    background: rgba(230, 232, 239, 0.1);
    color: var(--paper);
    font-size: 1.3rem;
    font-weight: 950;
  }

  .lobby-question-control button:not(:disabled):hover {
    background: var(--paper);
    color: var(--ink);
  }

  .lobby-question-control button:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }

  .lobby-question-control div {
    display: grid;
    justify-items: center;
    text-align: center;
  }

  .lobby-question-control span,
  .lobby-question-control em {
    color: var(--paper-dim);
    font-size: 0.7rem;
    font-style: normal;
    font-weight: 900;
    text-transform: uppercase;
  }

  .lobby-question-control strong {
    color: var(--paper);
    font-size: 2rem;
    line-height: 1;
  }

  .closing-panel {
    display: grid;
    width: min(560px, 100%);
    gap: 18px;
    margin: 0 auto;
    border: 1px solid rgba(255, 213, 74, 0.28);
    border-radius: 8px;
    padding: 24px;
    background:
      linear-gradient(135deg, rgba(255, 213, 74, 0.13), rgba(229, 57, 53, 0.08)),
      rgba(11, 16, 32, 0.78);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(14px);
  }

  .closing-panel p {
    margin: 0;
    color: var(--paper-dim);
    font-weight: 900;
  }

  .closing-meter {
    height: 12px;
    overflow: hidden;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 999px;
    background: rgba(230, 232, 239, 0.08);
  }

  .closing-meter span {
    display: block;
    width: var(--close-progress);
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--yellow), var(--hot));
    transition: width 100ms linear;
  }

  .actions {
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .start-hint {
    margin: 0;
    border: 1px solid rgba(255, 213, 74, 0.22);
    border-radius: 8px;
    background: rgba(255, 213, 74, 0.1);
    color: var(--yellow);
    padding: 10px 12px;
    font-weight: 900;
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
    border: 1px solid var(--line);
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(229, 57, 53, 0.12), rgba(57, 213, 255, 0.07)),
      rgba(11, 16, 32, 0.68);
    padding: 14px 16px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  }

  .hud > div {
    display: grid;
    gap: 4px;
  }

  .hud-question {
    position: relative;
    min-height: 54px;
    padding-left: 62px;
  }

  .hud-season-icon {
    position: absolute;
    left: 0;
    top: 50%;
    width: 50px;
    aspect-ratio: 1;
    object-fit: contain;
    transform: translateY(-50%);
  }

  .hud span {
    color: var(--yellow);
    font-weight: 900;
    text-transform: uppercase;
  }

  .hud strong {
    color: var(--paper-dim);
  }

  .answer-meter {
    width: min(220px, 100%);
    height: 8px;
    overflow: hidden;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 999px;
    background: rgba(230, 232, 239, 0.08);
  }

  .answer-meter span {
    display: block;
    width: var(--answer-progress);
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--cyan), var(--lime));
    transition: width 240ms ease;
  }

  .suspense {
    justify-self: start;
    border: 1px solid rgba(255, 213, 74, 0.26);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.78);
    color: var(--yellow);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
    animation: pulse-ring 800ms ease-out infinite;
  }

  .suspense.all-answered {
    border-color: rgba(54, 210, 124, 0.34);
    background: rgba(54, 210, 124, 0.11);
    color: var(--lime);
  }

  .round-line {
    justify-self: start;
    border: 1px solid rgba(57, 213, 255, 0.18);
    border-radius: 8px;
    background: rgba(57, 213, 255, 0.08);
    color: var(--cyan);
    padding: 7px 10px;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .question-stage {
    position: relative;
    isolation: isolate;
    perspective: 1000px;
  }

  .question-stage :global(.timer-ring3d) {
    z-index: 0;
  }

  .question-stage :global(.question-card) {
    z-index: 1;
  }

  .question-stage :global(.answer-impact) {
    z-index: 2;
  }

  @keyframes notice-in {
    from {
      opacity: 0;
      transform: translateY(12px) rotateX(-12deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0);
    }
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

    .notice-tray {
      position: sticky;
      right: auto;
      bottom: auto;
      width: 100%;
      order: 1;
    }
  }

  @media (max-width: 560px) {
    .title {
      align-items: start;
    }

    .brand-mark {
      width: 46px;
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
    .config-row,
    .room-preview {
      grid-template-columns: 1fr;
      display: grid;
    }
  }
</style>
