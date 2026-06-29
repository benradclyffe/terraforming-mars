# Replace an offered card by searching the deck (sandbox)

## Goal

When choosing from drawn cards, let the player replace one of the offered
cards with any eligible card from the matching deck, found by searching its
name. A sandbox / testing tool for setting up specific hands.

## Decisions (from brainstorming)

- **Gating:** a single new preference `sandbox_card_search`. The feature shows
  wherever the preference is on. The preference checkbox is only *toggleable*
  while viewing a solo game (disabled otherwise), keeping it solo-focused
  without a separate runtime check.
- **Scope:** all card-selection-from-drawn prompts — project, corporation,
  prelude, and CEO — since they all render through `SelectCard.vue`
  (`SelectInitialCards` reuses `SelectCard` for each category). The replacement
  must come from the deck matching the replaced card's category.
- **Search:** offers all eligible cards of that selection's category for the
  game (filtered by enabled expansions), by name.

## Server

- New route `POST player/replace-card`, authenticated by player id + `runId`
  like `PLAYER_INPUT`. Body: `{targetCardName, replacementCardName}`.
- `Player.replaceDealtCard(targetName, replacementName)`:
  1. Locate the active `SelectCard` by walking `player.waitingFor` (recurse
     `OrOptions` / `AndOptions` / `SelectInitialCards`) for a `SelectCard` whose
     offered cards include `targetName`.
  2. Determine the deck from the target card's type: `CORPORATION` ->
     `corporationDeck`, `PRELUDE` -> `preludeDeck`, `CEO` -> `ceoDeck`, else
     `projectDeck`.
  3. Validate `replacementName` is in that deck's `drawPile` (else
     `InputError`: not in deck — already drawn or in play).
  4. Swap: remove the replacement from the draw pile, replace the target within
     the `SelectCard`'s offered cards with it, and return the target to the
     draw pile. Deck size is unchanged.
  5. `setWaitingFor` the same input so the client refreshes with the new card.
- The route handler validates the player and `runId`, then calls the method and
  returns the refreshed player model (same shape as `PLAYER_INPUT`).

## Client

- `PreferencesManager`: add `sandbox_card_search: boolean` (default `false`).
- `PreferencesDialog`: add a checkbox for it, disabled unless the current game
  is solo. Solo-ness is passed in from `Sidebar` (it already has
  `playerNumber`) through `PreferencesIcon` to `PreferencesDialog`.
- `SelectCard.vue`: when `sandbox_card_search` is on, each offered card shows a
  small **Replace** affordance. Activating it opens a name search (autocomplete
  over the client card manifest, filtered to the selection's category and the
  game's enabled expansions). Choosing a replacement POSTs to
  `player/replace-card`, then refreshes the player view via the existing
  `vueRoot`/`WaitingFor` update path.
- A small reusable card-name search input (datalist or filtered list) lives
  with `SelectCard` (e.g. `CardNameSearch.vue`) so it can be tested in
  isolation.

## Data flow

Offered cards were drawn out of the deck into the `SelectCard`. The swap returns
the target to the draw pile and pulls the replacement out, preserving deck
integrity. On confirm, the mutated `SelectCard` resolves through its normal
`process()` — no special-casing.

## Testing

- Server (`Player.spec`): `replaceDealtCard` swaps the offered card, removes the
  replacement from the matching deck and returns the target to it; errors when
  the replacement is not in the deck; works for a project `SelectCard` and for a
  `SelectInitialCards`-nested project `SelectCard`.
- Client (`CardNameSearch.spec`): filters by typed text and emits the chosen
  name. (`SelectCard.spec`): the Replace affordance is hidden unless
  `sandbox_card_search` is on; choosing a replacement posts the right payload.
- Client (`PreferencesDialog.spec`): the sandbox checkbox is disabled when not
  solo.

## Risks

- Walking `waitingFor` to find the right `SelectCard` is the trickiest part —
  covered by a nested (`SelectInitialCards`) server test.
- Searching a card already drawn / in play returns a clear error rather than
  corrupting the deck.
- The preference is global; once enabled in solo it remains on. This is the
  accepted design (toggle is solo-only); the server still only ever swaps cards
  that are genuinely in the deck, so it cannot conjure cards from nothing.
