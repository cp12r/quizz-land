<script>
  import { onMount } from 'svelte';
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
  let selected = null;
  let remaining = room.config.timePerQuestion;
  let ws;

  $: currentQuestion = room.status === 'playing' ? room.questions[room.currentQuestion] : null;
  $: shareUrl = typeof location === 'undefined' ? '' : `${location.origin}/room/${room.id}`;
  $: isHost = player && room.hostId === player.id;

  function handleRoomState(next) {
    room = next;
    selected = null;
    if (room.status === 'finished') location.href = `/results/${room.id}`;
  }

  onMount(() => {
    playerName = localStorage.getItem('quizz-player-name') || '';
    ws = connectRoom(room.id, {
      room_state: handleRoomState,
      question_start: handleRoomState,
      round_end: handleRoomState,
      timer_tick: (payload) => (remaining = payload.remaining),
      player_joined: (payload) => {
        player = payload.player;
        room = payload.room;
      }
    });
    return () => ws?.close();
  });

  function join() {
    localStorage.setItem('quizz-player-name', playerName || 'Joueur');
    ws.sendJson('join_room', { playerId: getPlayerId(), name: playerName || 'Joueur' });
    joined = true;
  }

  function start() {
    ws.sendJson('start_game', { playerId: player.id });
  }

  function answer(index) {
    selected = index;
    ws.sendJson('submit_answer', { playerId: player.id, answerIndex: index });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
  }
</script>

<main class="page">
  <section class="shell room">
    <header class="top">
      <div>
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
        <Button type="submit">Rejoindre</Button>
      </form>
    {:else if room.status === 'waiting'}
      <section class="grid">
        <div class="card lobby">
          <h2>Salon d attente</h2>
          <p>Partage le lien et lance quand tout le monde est pret.</p>
          <Button disabled={!isHost || room.players.length < 1} onclick={start}>Lancer</Button>
        </div>
        <PlayerList players={room.players} hostId={room.hostId} />
      </section>
    {:else}
      <section class="grid">
        <div class="play">
          <div class="hud">
            <span class="mono">Question {room.currentQuestion + 1}/{room.questions.length}</span>
            <TimerCircle {remaining} total={room.config.timePerQuestion} />
          </div>
          <QuestionCard question={currentQuestion} {selected} locked={selected !== null} onAnswer={answer} />
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

  .top p,
  .top h1 {
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
  }
</style>
