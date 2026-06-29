# Single-screen game dashboard

## Goal

Restructure the main in-game view so it fits one screen with no scrolling, in
the spirit of the official client (`main-screen.png`): the Mars board dominates
the centre, the current player's dashboard is a fixed bar below it, opponents
are a compact strip, and the log / cards-in-hand / played-cards move out of the
scrolling page into slide-in drawers opened by icons.

Decisions (from brainstorming):

- Default for everyone (not gated behind `experimental_ui`).
- Panels open as slide-in drawers (not centred modals).
- Opponents shown as a compact strip (the screenshot's left column), click to
  expand a player's detail.
- Log icon lives in the right `Sidebar` (the "main menu"); hand/played/colony
  icons live in the bottom dashboard bar (they carry player-specific counts).

## Scope

In scope: the in-game action view (the branch of `PlayerHome` rendered while
`thisPlayer.tableau.length > 0`). Setup, research, and end-of-game screens keep
today's normal flow.

Out of scope: a full sci-fi visual reskin (textures, fonts, board overlay
chrome), corporation-select reskin. This is layout + drawers, reusing existing
content components.

## Layout architecture

```
+----------------------------------------------+
| other   |          GAME BOARD          | side |
| players |   (GameBoardView fills)      | bar  |
| strip   |                              |(icons)|
| (left)  |                              |      |
+---------+------------------------------+------+
|  PLAYER DASHBOARD BAR (PlayerInfo + icons)    |
+----------------------------------------------+
   drawers slide in over this from edges, one at a time
```

`PlayerHome.vue`'s in-game branch becomes a fixed full-viewport flex shell:
board centre, fixed bottom bar, compact opponents strip on the left, existing
`Sidebar` on the right, and drawers that slide in over the board.

## Components

- `Drawer.vue` (new, `common/`) — reusable slide-in panel. Props: `side`
  (`'right' | 'bottom' | 'left'`), `title` (string), `open` (boolean). Default
  slot for content. Closes via close button, Escape, and click-outside; emits
  `close`. No heavy backdrop so the board stays visible.
- `PlayerDashboardBar.vue` (new) — the fixed bottom bar. Reuses `PlayerInfo`
  for the current player and adds icon buttons with counts: cards-in-hand,
  played-cards, colonies. Each emits a toggle event for its drawer.
- `OtherPlayersStrip.vue` (new) — compact opponents column reusing
  `OtherPlayer` / `PlayerStatus` (name, score, TR, passed/acting). Clicking an
  opponent emits a select event so `PlayerHome` opens that player's detail in a
  drawer.
- `Sidebar.vue` (edit) — add a log icon that toggles the log drawer. GEN,
  global parameters, and existing shortcuts remain.
- `PlayerHome.vue` (restructure) — the layout shell. Owns `openDrawer` state
  (`'log' | 'hand' | 'played' | 'colonies' | 'player' | undefined`, only one
  open at a time). Renders board + bar + strip + sidebar and the `Drawer`s that
  host existing content components.

## Data flow

`PlayerHome` owns `openDrawer`. The bar, sidebar, and strip emit toggle/select
events upward; `PlayerHome` sets `openDrawer` and renders the matching `Drawer`.
Drawer contents reuse existing components with no logic duplication:

- log drawer -> `LogPanel`
- hand drawer -> `SortableCards`
- played drawer -> the tableau `Card`s (active / automated / event)
- colonies drawer -> `Colony` list
- player drawer -> `PlayerInfo` for the selected opponent

Opening any drawer sets `openDrawer`; opening a second replaces the first.

## Mapping to requested items

1. Log behind an icon in the main menu -> log icon in `Sidebar` opens the log
   drawer.
2. Game bar with icons below the map -> `PlayerDashboardBar` fixed at the
   bottom.
3. Hide cards-in-hand and played-cards behind icons -> count-badged icons in
   the bar open the hand and played drawers.

## Testing

- `Drawer.spec`: renders slot content when `open`, not when closed; emits
  `close` on Escape, close button, and click-outside.
- `PlayerDashboardBar.spec`: renders the current player's `PlayerInfo` and icon
  counts; clicking an icon emits the matching toggle event.
- `OtherPlayersStrip.spec`: renders one entry per opponent (excludes self);
  clicking an entry emits a select event with the player's colour.
- `PlayerHome.spec` (extend): clicking the hand icon opens the hand drawer with
  `SortableCards`; played icon opens the played drawer; the Sidebar log icon
  opens the log drawer; opening one drawer closes the previously open one.

## Assumptions and risks

- Desktop-first. On narrow/mobile widths the bottom bar wraps and drawers
  become full-width — functional, not pixel-perfect.
- This restructures `PlayerHome`'s template and `player_home.less` for everyone.
  Mitigation: keep existing content components intact (move/wrap rather than
  rewrite), rely on the tests above, and do a manual browser pass to catch
  layout regressions before merge.
- No changes to setup, research, or end-of-game screens.
