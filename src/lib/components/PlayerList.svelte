<script>
  import { getPlayerBadge } from '$lib/utils/playerBadges.js';

  export let players = [];
  export let hostId = null;
  export let maskScores = false;
  export let title = 'Joueurs';

  $: connectedCount = players.filter((player) => player.connected !== false).length;
  $: waitingSlots = Math.max(0, 2 - connectedCount);
  $: rankedPlayers = [...players].sort((a, b) => {
    if ((a.connected !== false) !== (b.connected !== false)) return a.connected === false ? 1 : -1;
    return b.score - a.score;
  });

  function rankLabel(index) {
    if (index === 0) return '1er';
    if (index === 1) return '2e';
    if (index === 2) return '3e';
    return String(index + 1);
  }
</script>

<section class="card players" aria-label="Joueurs">
  <div class="heading">
    <h2>{title}</h2>
    <span class="count mono">{connectedCount}/{players.length}</span>
  </div>

  {#if players.length}
    <ol>
      {#each rankedPlayers as player, index}
        {@const badge = getPlayerBadge(player, index, rankedPlayers)}
        <li
          class:podium={index < 3}
          aria-label={maskScores ? `${player.name}, rang et score masqués` : undefined}
          style={`--row-delay:${Math.min(index, 8) * 42}ms; --badge-tone:${badge.tone};`}
        >
          <span class:masked={maskScores} class="rank mono" aria-hidden={maskScores}>
            {rankLabel(index)}
          </span>
          <span class="avatar" aria-hidden="true">{player.name?.slice(0, 1) || '?'}</span>
          <span class:online={player.connected !== false} class="status-dot" aria-hidden="true"></span>
          {#if maskScores}<span class="sr-only">Rang masqué</span>{/if}
          <span class="player-copy">
            <strong class:masked={maskScores} aria-hidden={maskScores}>{player.name}</strong>
            <em>{badge.label}</em>
          </span>
          {#if maskScores}<span class="sr-only">Pseudo masqué</span>{/if}
          {#if player.connected === false}
            <small class="offline">Hors ligne</small>
          {:else if player.id === hostId}
            <small>Créateur</small>
          {/if}
          <span class:masked={maskScores} class="score mono" aria-hidden={maskScores}>
            {maskScores ? '---' : player.score}
          </span>
          {#if maskScores}<span class="sr-only">Score masqué</span>{/if}
        </li>
      {/each}
    </ol>
  {:else}
    <div class="empty-list" role="status">
      <strong>Salon prêt</strong>
      <span>Invite les joueurs, le show démarre dès que vous êtes au moins 2.</span>
    </div>
  {/if}

  {#if waitingSlots > 0}
    <p class="waiting mono">Encore {waitingSlots} joueur{waitingSlots > 1 ? 's' : ''} pour lancer</p>
  {/if}
</section>

<style>
  .players {
    border-radius: 8px;
    padding: 20px;
    background:
      radial-gradient(circle at 10% 0%, rgba(229, 57, 53, 0.17), transparent 36%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.026)),
      rgba(23, 30, 49, 0.82);
    color: var(--gray-900);
    box-shadow: var(--shadow-card);
  }

  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  h2 {
    margin: 0;
    color: var(--gray-900);
    font-size: 20px;
    text-transform: uppercase;
  }

  .count {
    display: grid;
    min-width: 34px;
    min-height: 30px;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.55);
    color: var(--color-yellow);
    font-size: 13px;
    font-weight: 900;
  }

  ol {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    display: grid;
    grid-template-columns: 42px 38px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    min-height: 58px;
    border: 1px solid rgba(230, 232, 239, 0.12);
    border-radius: 8px;
    background: rgba(33, 42, 69, 0.62);
    padding: 8px 12px;
    animation: rise-in 300ms var(--ease-pop) both;
    animation-delay: var(--row-delay, 0ms);
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease;
  }

  li:hover {
    border-color: rgba(255, 213, 74, 0.32);
    transform: translateY(-2px);
  }

  .podium {
    background: linear-gradient(135deg, rgba(255, 213, 74, 0.16), rgba(229, 57, 53, 0.1));
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
  }

  .podium:first-child {
    border-color: rgba(255, 213, 74, 0.36);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16), 0 0 26px rgba(255, 213, 74, 0.12);
  }

  .rank {
    display: grid;
    min-height: 34px;
    place-items: center;
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.6);
    color: var(--color-yellow);
    font-size: 12px;
    font-weight: 900;
  }

  .avatar {
    display: grid;
    width: 38px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--badge-tone) 48%, white);
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.32), transparent 34%),
      var(--badge-tone);
    color: #0b1020;
    font-weight: 950;
    text-transform: uppercase;
  }

  .status-dot {
    position: absolute;
    left: 58px;
    bottom: 10px;
    width: 10px;
    aspect-ratio: 1;
    border: 2px solid #171e31;
    border-radius: 50%;
    background: rgba(230, 232, 239, 0.52);
  }

  .status-dot.online {
    background: var(--color-mint);
    box-shadow: 0 0 12px rgba(54, 210, 124, 0.54);
  }

  .player-copy {
    display: grid;
    min-width: 0;
    gap: 3px;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    justify-self: start;
    border: 1px solid color-mix(in srgb, var(--badge-tone) 38%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--badge-tone) 13%, transparent);
    color: var(--badge-tone);
    padding: 3px 7px;
    font-size: 0.62rem;
    font-style: normal;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
  }

  small {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    border: 1px solid rgba(57, 213, 255, 0.24);
    border-radius: 8px;
    background: rgba(57, 213, 255, 0.1);
    color: var(--color-cyan);
    padding: 0 8px;
    font-weight: 900;
    font-size: 12px;
  }

  .offline {
    border-color: rgba(230, 232, 239, 0.18);
    background: rgba(230, 232, 239, 0.08);
    color: rgba(230, 232, 239, 0.62);
  }

  .score {
    min-width: 54px;
    color: var(--gray-900);
    text-align: right;
    font-weight: 900;
  }

  .masked {
    color: var(--color-yellow);
    filter: blur(4px);
    opacity: 0.72;
    text-shadow: 0 0 14px rgba(255, 213, 74, 0.46);
    transform: translateZ(0);
    user-select: none;
  }

  p,
  .empty-list {
    margin: 0;
    color: var(--color-muted);
    font-weight: 800;
  }

  .empty-list {
    display: grid;
    gap: 4px;
    border: 1px dashed rgba(255, 213, 74, 0.28);
    border-radius: 8px;
    padding: 14px;
    background: rgba(255, 213, 74, 0.08);
  }

  .empty-list strong {
    color: var(--color-yellow);
    text-transform: uppercase;
  }

  .waiting {
    margin-top: 12px;
    border: 1px solid rgba(57, 213, 255, 0.18);
    border-radius: 8px;
    padding: 9px 10px;
    background: rgba(57, 213, 255, 0.08);
    color: var(--color-cyan);
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  @media (max-width: 520px) {
    li {
      grid-template-columns: 34px 34px minmax(0, 1fr) auto;
      gap: 8px;
      padding-inline: 10px;
    }

    small {
      display: none;
    }

    .avatar {
      width: 34px;
    }

    .status-dot {
      left: 49px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    li {
      animation: none;
      transition: none;
    }
  }
</style>
