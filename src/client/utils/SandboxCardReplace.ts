// Shared logic for the sandbox card-replacement tool: deciding when it is
// available, which cards are eligible replacements for a given card, and
// sending the replace request. Used by both the card-selection view
// (SelectCard) and the cards-in-hand view (SortableCards).
import {ComponentPublicInstance} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {getCard, getCards} from '@/client/cards/ClientCardManifest';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {vueRoot} from '@/client/components/vueRoot';
import {paths} from '@/common/app/paths';

type DeckCategory = 'corp' | 'prelude' | 'ceo' | 'project';

// Group a card type into the deck it is drawn from, so a replacement matches
// the kind of card being replaced (a corporation slot offers corporations).
function deckCategory(type: CardType): DeckCategory {
  switch (type) {
  case CardType.CORPORATION: return 'corp';
  case CardType.PRELUDE: return 'prelude';
  case CardType.CEO: return 'ceo';
  default: return 'project';
  }
}

// Enabled by preference, but only in solo games.
export function isSandboxReplaceEnabled(playerView: PlayerViewModel): boolean {
  return getPreferences().sandbox_card_search === true && playerView.players?.length === 1;
}

// Eligible replacements: cards of the same deck category as the target, limited
// to the game's enabled expansions.
export function eligibleReplacementNames(playerView: PlayerViewModel, targetName: CardName | undefined): Array<CardName> {
  if (targetName === undefined) {
    return [];
  }
  const type = getCard(targetName)?.type;
  if (type === undefined) {
    return [];
  }
  const category = deckCategory(type);
  const expansions = playerView.game.gameOptions.expansions as unknown as Record<string, boolean>;
  return getCards((card) =>
    deckCategory(card.type) === category &&
    (card.module === 'base' || expansions[card.module] === true),
  ).map((card) => card.name);
}

// POST the replacement and refresh the player view on success.
export function sendReplaceCard(
  component: ComponentPublicInstance,
  playerView: PlayerViewModel,
  targetName: CardName,
  replacementName: CardName): void {
  fetch(paths.REPLACE_CARD + '?id=' + playerView.id, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      runId: playerView.runId,
      targetCardName: targetName,
      replacementCardName: replacementName,
    }),
  }).then(async (response) => {
    const root = vueRoot(component);
    if (response.ok) {
      root.updatePlayer();
    } else {
      const body = await response.json().catch(() => ({message: 'Unknown error'}));
      root.showAlert('Unable to replace card', body.message);
    }
  }).catch((e) => {
    console.error('replaceCard', e);
  });
}
