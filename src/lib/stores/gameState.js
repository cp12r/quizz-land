import { writable } from 'svelte/store';

export const gameState = writable({ room: null, player: null, remaining: 0 });
