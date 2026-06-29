// Submits a player input response to the server outside the WaitingFor
// component (e.g. when playing a card straight from the cards drawer), then
// refreshes the player view. Mirrors WaitingFor.onsave.
import {ComponentPublicInstance} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {vueRoot} from '@/client/components/vueRoot';
import {paths} from '@/common/app/paths';

export function submitPlayerInput(
  component: ComponentPublicInstance,
  playerView: PlayerViewModel,
  response: InputResponse): void {
  fetch(paths.PLAYER_INPUT + '?id=' + playerView.id, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({runId: playerView.runId, ...response}),
  }).then(async (resp) => {
    const root = vueRoot(component);
    if (resp.ok) {
      root.updatePlayer();
    } else {
      const body = await resp.json().catch(() => ({message: 'Unknown error'}));
      root.showAlert('Error', body.message);
    }
  }).catch((e) => {
    console.error('submitPlayerInput', e);
  });
}
