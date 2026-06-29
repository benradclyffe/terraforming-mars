# Action menu as buttons + modals

## Goal

Replace the always-visible radio toggle-list of turn actions with a row of
buttons on the player dashboard. Each button opens a focused modal containing
that action's UI (play a card, standard projects, fund an award, etc.). This
replaces the toggle-list for everyone — it is not gated behind a preference.

Reference: the official Asmodee digital Terraforming Mars keeps the dashboard
clean and surfaces actions ("Standard Projects", "Perform an action from a
played card") as buttons that open modal overlays rather than an inline list.

## Scope

In scope: the main turn-action menu becomes buttons + modals.

Out of scope: board/sidebar visuals, a persistent dashboard top-bar
(Milestones / Awards chips), corporation-select reskin, and any broader sci-fi
visual reskin. Those are deferred to later, separate specs.

## Design

### 1. Identifying the turn menu (server)

Only the main turn-action menu (and the pending-initial-actions menu) should
render as buttons. A mid-resolution `OrOptions` (e.g. "gain 2 plants OR 3 heat"
from a card effect) must keep rendering inline as today.

To distinguish them, add an optional `menu?: boolean` field to `OrOptionsModel`
(`src/common/models/PlayerInputModel.ts`). It is set on:

- the `OrOptions` returned by `Player.getActions()`, and
- the pending-initial-actions `OrOptions` built in `Player.takeAction()`.

The server `OrOptions` class (`src/server/inputs/OrOptions.ts`) gains a public
`menu` boolean (default `false`) and a fluent `setMenu()` helper; `toModel()`
copies it onto the model when `true`.

### 2. New `ActionMenu.vue` (client)

`WaitingFor.vue` currently always delegates to `PlayerInputFactory`. Add a
branch: when the top-level input is `type === 'or'` and `menu === true`, render
the new `ActionMenu` component instead. All other inputs are unchanged.

`ActionMenu`:

- Renders a responsive flex-wrap row of `AppButton`s — one per option. The
  button label comes from each option's `buttonLabel` (falling back to
  `title`).
- Reuses the learner-mode filtering and the `displayed -> original` index
  mapping currently in `OrOptions.vue`, so the index submitted to the server
  stays correct even when some `card` options are hidden.
- Clicking a button opens a single modal (`<dialog>`, reusing the
  `HTMLDialogElementCompatibility` helpers and the pattern from
  `ConfirmDialog.vue`). Escape and backdrop click close it.
- The modal hosts `PlayerInputFactory` for that one option. On save it emits
  `{type: 'or', index, response}` (an `OrOptionsResponse`) via the `onsave`
  callback and closes. Closing without saving returns to the dashboard with no
  submission.

### 3. Terminal actions

Confirm-only options (Pass, End turn, Undo, Convert heat) are `SelectOption`s.
Inside the modal they render via the existing `SelectOption.vue` as title +
warnings + a confirm button. Behaviour is uniform: every button opens a modal,
including these. This matches the "buttons that trigger modals" requirement and
avoids accidental Pass/Undo from a stray click.

### 4. Styling

Light styling only. A clean button row plus a centred modal overlay built from
the existing `AppButton` component and current app theme. No board/sidebar or
sci-fi reskin.

## Components and boundaries

- `OrOptionsModel.menu` — data flag marking an `OrOptions` as the turn menu.
- `OrOptions` (server) — owns `menu` state and serialises it.
- `Player.getActions()` / `takeAction()` — set the flag on the turn menus.
- `WaitingFor.vue` — routes a top-level menu `OrOptions` to `ActionMenu`.
- `ActionMenu.vue` — renders buttons, owns modal open/close, maps indices,
  submits the `OrOptionsResponse`.

`ActionMenu` depends on: `AppButton`, `PlayerInputFactory`, the dialog
compatibility helpers, and `PreferencesManager` (for learner-mode filtering).

## Testing

- Server: `getActions().toModel(player)` sets `menu: true`; a non-menu
  `OrOptions` does not.
- Client `ActionMenu.spec`:
  - renders one button per (learner-mode-filtered) option,
  - clicking a button opens the modal hosting the correct child input,
  - saving emits `{type: 'or', index, response}` with the index mapped back
    through the displayed→original mapping.

## Risks

- Index mapping must match `OrOptions.vue` exactly, or the wrong action is
  submitted. Covered by a client test asserting the emitted index.
- A top-level forced `OrOptions` without the `menu` flag must keep inline
  rendering — verified by the server test that only turn menus set the flag.
