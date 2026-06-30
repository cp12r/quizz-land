<script>
  import { getPlayerBadge } from '$lib/utils/playerBadges.js';

  export let player = null;
  export let results = [];
  export let room = {};
  export let siteUrl = '';

  let copied = false;

  $: rank = Math.max(0, results.findIndex((item) => item.id === player?.id)) + 1 || 1;
  $: badge = getPlayerBadge(player, rank - 1, results);
  $: topPercent = Math.max(1, Math.round((rank / Math.max(results.length, 1)) * 100));
  $: themeName = room?.config?.themeName || room?.config?.themeId || 'QuizzLand';
  $: shareLink = siteUrl || (typeof location !== 'undefined' ? location.origin : '');
  $: shareText = `${player?.name || 'Joueur'} termine #${rank} avec ${player?.score || 0} pts sur QuizzLand. TOP ${topPercent}% - ${badge.label}`;
  $: qrValue = encodeURIComponent(shareLink || `room:${room?.id || ''}`);
  $: qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${qrValue}`;

  async function copyResult() {
    if (typeof navigator === 'undefined') return;
    await navigator.clipboard.writeText(`${shareText}\n${shareLink}`);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1400);
  }

  async function shareResult() {
    if (typeof navigator === 'undefined') return copyResult();
    if (navigator.share) {
      await navigator.share({ title: 'Résultat QuizzLand', text: shareText, url: shareLink }).catch(() => {});
      return;
    }
    await copyResult();
  }
</script>

<article class="share-card" style={`--badge-tone:${badge.tone};`}>
  <div class="share-head">
    <span class="badge-icon" aria-hidden="true">{badge.icon}</span>
    <div>
      <p class="mono">Carte partage</p>
      <h2>{player?.name || 'Joueur'}</h2>
    </div>
  </div>

  <div class="score-strip">
    <div>
      <span>Score</span>
      <strong>{player?.score || 0}</strong>
    </div>
    <div>
      <span>Rang</span>
      <strong>#{rank}</strong>
    </div>
    <div>
      <span>Badge</span>
      <strong>{badge.label}</strong>
    </div>
  </div>

  <div class="viral-line">
    <strong>Je suis TOP {topPercent}% sur QuizzLand</strong>
    <span>{themeName}</span>
  </div>

  <div class="share-footer">
    {#if shareLink}
      <img src={qrUrl} alt="QR code QuizzLand" loading="lazy" />
    {/if}
    <div class="share-actions">
      <button type="button" on:click={copyResult}>{copied ? 'Résultat copié' : 'Copier le résultat'}</button>
      <button type="button" class="share-main" on:click={shareResult}>Partager</button>
    </div>
  </div>
</article>

<style>
  .share-card {
    display: grid;
    gap: 16px;
    overflow: hidden;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    padding: 18px;
    background:
      radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--badge-tone) 30%, transparent), transparent 42%),
      linear-gradient(145deg, rgba(230, 232, 239, 0.11), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.78);
    color: #e6e8ef;
    box-shadow: 0 26px 66px rgba(0, 0, 0, 0.28);
  }

  .share-head,
  .share-footer {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .badge-icon {
    display: grid;
    width: 62px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--badge-tone) 58%, white);
    border-radius: 8px;
    background: linear-gradient(135deg, var(--badge-tone), rgba(255, 255, 255, 0.18));
    color: #0b1020;
    font-size: 1.5rem;
    font-weight: 950;
  }

  p,
  h2,
  .viral-line strong,
  .viral-line span {
    margin: 0;
  }

  p {
    color: #ffd54a;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  h2 {
    font-size: clamp(1.6rem, 5vw, 2.8rem);
    line-height: 0.96;
    text-transform: uppercase;
  }

  .score-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .score-strip div {
    display: grid;
    gap: 4px;
    border: 1px solid rgba(230, 232, 239, 0.13);
    border-radius: 8px;
    padding: 12px;
    background: rgba(230, 232, 239, 0.07);
  }

  .score-strip span,
  .viral-line span {
    color: rgba(230, 232, 239, 0.7);
    font-size: 0.76rem;
    font-weight: 850;
    text-transform: uppercase;
  }

  .score-strip strong {
    overflow-wrap: anywhere;
    color: #e6e8ef;
    font-size: 1.35rem;
    line-height: 1;
  }

  .viral-line {
    display: grid;
    gap: 6px;
    border: 1px solid color-mix(in srgb, var(--badge-tone) 34%, transparent);
    border-radius: 8px;
    padding: 14px;
    background: color-mix(in srgb, var(--badge-tone) 12%, transparent);
  }

  .viral-line strong {
    color: #ffd54a;
    font-size: 1.15rem;
    text-transform: uppercase;
  }

  img {
    width: 86px;
    aspect-ratio: 1;
    border: 8px solid #e6e8ef;
    border-radius: 8px;
    background: #e6e8ef;
  }

  .share-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    flex: 1;
  }

  button {
    min-height: 46px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.09);
    color: #e6e8ef;
    padding: 0 12px;
    font-weight: 950;
    text-transform: uppercase;
  }

  .share-main {
    background: #e6e8ef;
    color: #0b1020;
  }

  @media (max-width: 620px) {
    .score-strip,
    .share-actions {
      grid-template-columns: 1fr;
    }

    .share-footer {
      align-items: stretch;
      display: grid;
    }
  }
</style>
