# Play cards from the cards icon (hand drawer)

## Goal

Match the reference layout: the cards icon in the bottom dashboard bar is the
player's hand — it shows all current cards and is where you play them from.
Remove the separate "Play card" button from the bottom action row.

Decisions (from brainstorming):
- The hand drawer shows the full hand; playable cards play on click, unplayable
  cards are shown greyed.
- The action-row "Play card" button is removed (playing happens via the cards
  icon).

## Server

`Player.getActions()` builds the main play-card `SelectProjectCardToPlay` with
the player's full hand (`cardsInHand`) plus an `enabled` array (true where the
card is playable), instead of only the playable subset. The component already
greys cards whose `enabled` flag is false and only allows selecting enabled
ones, so this renders the whole hand with unplayable cards greyed. The option is
still only added when at least one card is playable. Other `SelectProjectCardToPlay`
construction sites are unchanged.

## Client

- **ActionMenu:** stop rendering the `projectCard` option as an action-row
  button; it is reached through the cards icon instead.
- **PlayerHome / cards drawer:** when the action menu offers a play-card option,
  the hand drawer renders that option's `SelectProjectCardToPlay` (full hand +
  payment). Selecting a playable card and paying plays it. When no play option
  is offered (not the player's turn, or nothing playable), the drawer shows the
  read-only hand (`SortableCards`) as today.
- **Submission:** a small util (`submitPlayerInput`) posts the menu response
  `{type: 'or', index, response}` to the existing `PLAYER_INPUT` endpoint and
  refreshes the player view, mirroring the sandbox-replace util. The drawer
  wires `SelectProjectCardToPlay`'s `onsave` to it, wrapping the response in the
  `OrOptions` envelope at the option's index.

## Data flow

`PlayerHome` locates the `projectCard` option (and its index) within
`playerView.waitingFor` when it is the action menu. If present, the cards drawer
renders the play UI for it; on save it submits the `OrOptions` response at that
index. ActionMenu excludes the same option from its button row so the action is
not duplicated.

## Testing

- Server (`Player.spec`): the play-card option in `getActions()` lists the full
  hand and marks unplayable cards disabled (enabled=false), playable ones
  enabled.
- Client `ActionMenu.spec`: a `projectCard` option does not render an action-row
  button.
- Client `PlayerHome.spec`: when the menu has a play-card option the cards
  drawer renders `SelectProjectCardToPlay`; otherwise it renders the read-only
  hand.
- Client: `submitPlayerInput` posts the expected payload.

## Risks / caveats

- Self-Replicating-Robots target cards (playable but not in `cardsInHand`) are
  not shown in this hand view. Minor; follow-up if needed.
- Showing the full hand in `SelectProjectCardToPlay` must not let unplayable
  cards be selected — guaranteed by the `enabled` flags (existing behaviour).
