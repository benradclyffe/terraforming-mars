<template>
  <div id="player-home" :class="(game.turmoil ? 'with-turmoil': '')">
    <div v-if="game.phase === 'end'">
      <TopBar :playerView="playerView" />
      <div class="player_home_block">
        <DynamicTitle title="This game is over!" :color="thisPlayer.color"/>
        <a :href="'the-end?id='+ playerView.id" v-i18n>Go to game results</a>
      </div>
    </div>

    <!-- In-game single-screen dashboard: board centre, opponents strip left,
         sidebar right, the current player's bar at the bottom, and the log /
         cards / colonies tucked into slide-in drawers behind icons. -->
    <template v-else-if="thisPlayer.tableau.length > 0">
      <div class="game-dashboard">
        <PurgeWarning class="game-dashboard-purge" :expectedPurgeTimeMs="game.expectedPurgeTimeMs"/>

        <OtherPlayersStrip
          v-if="playerView.players.length > 1"
          class="game-dashboard-left"
          :players="playerView.players"
          :thisPlayerColor="thisPlayer.color"
          @select="openPlayerDrawer"/>

        <Sidebar v-trim-whitespace
          class="game-dashboard-sidebar"
          :actingPlayer="isPlayerActing(playerView)"
          :playerColor="thisPlayer.color"
          :generation="game.generation"
          :coloniesCount="game.colonies.length"
          :temperature="game.temperature"
          :oxygen="game.oxygenLevel"
          :oceans="game.oceans"
          :venus="game.venusScaleLevel"
          :turmoil="game.turmoil"
          :moonData="game.moon"
          :gameOptions="game.gameOptions"
          :playerNumber="playerView.players.length"
          :lastSoloGeneration="game.lastSoloGeneration"
          :deckSize="game.deckSize"
          :discardPileSize="game.discardPileSize"
          @toggle-log="setDrawer('log')"/>

        <div class="game-dashboard-board">
          <div class="board-scaler" ref="boardScaler" :style="{transform: 'scale(' + boardScale + ')'}">
            <GameBoardView
              :game="game"
              :tileView="tileView"
              :players="playerView.players"
              @toggleTileView="cycleTileView()"/>
          </div>
        </div>

        <div class="game-dashboard-actions">
          <WaitingFor :playerView="playerView" :waitingfor="playerView.waitingFor"
            :requestOptionIndex="requestOptionIndex"
            @request-handled="requestOptionIndex = undefined"/>
        </div>

        <PlayerDashboardBar
          class="game-dashboard-bar"
          :playerView="playerView"
          :handCount="cardsInHandCount"
          :playedCount="thisPlayer.tableau.length"
          :coloniesCount="game.colonies.length"
          :convertResources="convertResources"
          @toggle="setDrawer"
          @convert="onConvert"/>
      </div>

      <Drawer v-if="openDrawer === 'log'" :open="true" side="right" title="Game log" @close="closeDrawer">
        <LogPanel :viewModel="playerView" :color="thisPlayer.color" :step="game.step"/>
      </Drawer>

      <Drawer v-if="openDrawer === 'hand'" :open="true" side="bottom" title="Cards in hand" @close="closeDrawer">
        <div class="player_home_block player_home_block--hand" v-if="playerView.draftedCards.length > 0">
          <DynamicTitle title="Drafted cards" :color="thisPlayer.color" />
          <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
            <Card :card="card"/>
          </div>
        </div>
        <SortableCards v-if="cardsInHandCount > 0" :playerId="playerView.id" :cards="allCardsInHand" :playerView="playerView"/>
        <div v-else v-i18n>No cards in hand</div>
      </Drawer>

      <Drawer v-if="openDrawer === 'played'" :open="true" side="bottom" title="Played cards" @close="closeDrawer">
        <div class="player_home_block player_home_block--cards">
          <div class="hiding-card-button-row">
            <div class="played-cards-filters">
              <div :class="getHideButtonClass('ACTIVE')" @click.prevent="toggle('ACTIVE')">
                <div class="played-cards-count">{{ activeTableauCount }}</div>
                <div class="played-cards-selection" v-i18n>{{ getToggleLabel('ACTIVE')}}</div>
              </div>
              <div :class="getHideButtonClass('AUTOMATED')" @click.prevent="toggle('AUTOMATED')">
                <div class="played-cards-count">{{ automatedTableauCount }}</div>
                <div class="played-cards-selection" v-i18n>{{ getToggleLabel('AUTOMATED')}}</div>
              </div>
              <div :class="getHideButtonClass('EVENT')" @click.prevent="toggle('EVENT')">
                <div class="played-cards-count">{{ eventTableauCount }}</div>
                <div class="played-cards-selection" v-i18n>{{ getToggleLabel('EVENT')}}</div>
              </div>
            </div>
          </div>
          <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CORPORATION])" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
          </div>
          <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CEO])" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
          </div>
          <div v-show="isVisible('ACTIVE')" v-for="card in activeTableauCards" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
          </div>
          <StackedCards v-show="isVisible('AUTOMATED')" :cards="automatedTableauCards" />
          <StackedCards v-show="isVisible('EVENT')" :cards="eventTableauCards" />
        </div>

        <div v-if="thisPlayer.selfReplicatingRobotsCards.length > 0" class="player_home_block">
          <DynamicTitle title="Self-replicating Robots cards" :color="thisPlayer.color"/>
          <div>
            <div v-for="card in thisPlayer.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>
        </div>

        <div v-if="thisPlayer.underworldData.tokens.length > 0">
          <DynamicTitle title="Claimed Underground Resource Tokens" :color="thisPlayer.color"/>
          <UndergroundTokens :underworldData="thisPlayer.underworldData"/>
        </div>
      </Drawer>

      <Drawer v-if="openDrawer === 'corp'" :open="true" side="bottom" title="Corporation" @close="closeDrawer">
        <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CORPORATION])" :key="card.name" class="cardbox">
          <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
        </div>
        <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CEO])" :key="card.name" class="cardbox">
          <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color"/>
        </div>
      </Drawer>

      <Drawer v-if="openDrawer === 'colonies'" :open="true" side="bottom" title="Colonies" @close="closeDrawer">
        <div class="colonies-fleets-cont">
          <div class="colonies-player-fleets" v-for="colonyPlayer in playerView.players" :key="colonyPlayer.color">
            <div :class="'colonies-fleet colonies-fleet-'+ colonyPlayer.color" v-for="idx in getFleetsCountRange(colonyPlayer)" :key="idx"></div>
          </div>
        </div>
        <div class="player_home_colony_cont">
          <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
            <Colony :colony="colony" :active="colony.isActive"/>
          </div>
        </div>
      </Drawer>

      <Drawer v-if="openDrawer === 'player' && selectedPlayer !== undefined" :open="true" side="right" :title="selectedPlayer.name" @close="closeDrawer">
        <PlayerInfo :player="selectedPlayer" :playerView="playerView" :actionLabel="''" :playerIndex="selectedPlayerIndex"/>
      </Drawer>

      <KeyboardShortcuts v-show="keyboardShortcutOpened" @close="keyboardShortcutOpened = false"/>
    </template>

    <template v-else>
      <TopBar :playerView="playerView" />
      <PlayerSetupView :playerView="playerView" :tileView="tileView"/>
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent, markRaw} from 'vue';

import Card from '@/client/components/card/Card.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import TopBar from '@/client/components/TopBar.vue';
import StackedCards from '@/client/components/StackedCards.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import KeyboardShortcuts from '@/client/components/KeyboardShortcuts.vue';
import Drawer from '@/client/components/common/Drawer.vue';
import PlayerDashboardBar from '@/client/components/PlayerDashboardBar.vue';
import OtherPlayersStrip from '@/client/components/OtherPlayersStrip.vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import {getPreferences, Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {CardModel} from '@/common/models/CardModel';
import {getCardOrThrow} from '../cards/ClientCardManifest';
import {HomeMixin} from '@/client/mixins/HomeMixin';

// The drawers that can be open over the dashboard. Only one is open at a time.
type DrawerName = 'log' | 'hand' | 'played' | 'colonies' | 'player' | 'corp';

type PlayerHomeModel = {
  showHand: boolean;
  showActiveCards: boolean;
  showAutomatedCards: boolean;
  showEventCards: boolean;
  openDrawer: DrawerName | undefined;
  selectedPlayerColor: Color | undefined;
  boardScale: number;
  boardResizeObserver: ResizeObserver | undefined;
  requestOptionIndex: number | undefined;
}

type ToggleableCardType = 'HAND' | 'ACTIVE' | 'AUTOMATED' | 'EVENT';

// The boolean card-visibility flags in PlayerHomeModel (excludes drawer state).
type CardVisibilityKey = 'showHand' | 'showActiveCards' | 'showAutomatedCards' | 'showEventCards';

const typeToDataModel: Record<ToggleableCardType, {key: CardVisibilityKey, preference: keyof Preferences}> = {
  HAND: {key: 'showHand', preference: 'hide_hand'},
  ACTIVE: {key: 'showActiveCards', preference: 'hide_active_cards'},
  AUTOMATED: {key: 'showAutomatedCards', preference: 'hide_automated_cards'},
  EVENT: {key: 'showEventCards', preference: 'hide_event_cards'},
} as const;

export default defineComponent({
  name: 'PlayerHome',
  mixins: [HomeMixin],
  data(): PlayerHomeModel {
    const preferences = getPreferences();
    return {
      showHand: !preferences.hide_hand,
      showActiveCards: !preferences.hide_active_cards,
      showAutomatedCards: !preferences.hide_automated_cards,
      showEventCards: !preferences.hide_event_cards,
      openDrawer: undefined,
      selectedPlayerColor: undefined,
      boardScale: 1,
      boardResizeObserver: undefined,
      requestOptionIndex: undefined,
    };
  },
  watch: {
    showHand: function hide_hand() {
      PreferencesManager.INSTANCE.set('hide_hand', !this.showHand);
    },
    showActiveCards: function toggle_active_cards() {
      PreferencesManager.INSTANCE.set('hide_active_cards', !this.showActiveCards);
    },
    showAutomatedCards: function toggle_automated_cards() {
      PreferencesManager.INSTANCE.set('hide_automated_cards', !this.showAutomatedCards);
    },
    showEventCards: function toggle_event_cards() {
      PreferencesManager.INSTANCE.set('hide_event_cards', !this.showEventCards);
    },
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    CardType(): typeof CardType {
      return CardType;
    },
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    allCardsInHand(): Array<CardModel> {
      const playerView = this.playerView;
      return playerView.preludeCardsInHand
        .concat(playerView.ceoCardsInHand)
        .concat(playerView.cardsInHand);
    },
    activeTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.ACTIVE]).length;
    },
    automatedTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.AUTOMATED, CardType.PRELUDE]).length;
    },
    eventTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.EVENT]).length;
    },
    activeTableauCards(): Array<CardModel> {
      const cards = getCardsByType(this.thisPlayer.tableau, [CardType.ACTIVE, CardType.PRELUDE]);
      return [...sortActiveCards(cards.filter((c) => this.isActive(c)))];
    },
    automatedTableauCards(): Array<CardModel> {
      const cards = getCardsByType(this.thisPlayer.tableau, [CardType.AUTOMATED, CardType.PRELUDE]);
      return cards.filter((c) => this.isNotActive(c));
    },
    eventTableauCards(): Array<CardModel> {
      return [...getCardsByType(this.thisPlayer.tableau, [CardType.EVENT])];
    },
    getCardsByType(): typeof getCardsByType {
      return getCardsByType;
    },
    isCardActivated(): typeof isCardActivated {
      return isCardActivated;
    },
    sortActiveCards(): typeof sortActiveCards {
      return sortActiveCards;
    },
    selectedPlayer(): PublicPlayerModel | undefined {
      return this.playerView.players.find((p) => p.color === this.selectedPlayerColor);
    },
    selectedPlayerIndex(): number {
      return this.playerView.players.findIndex((p) => p.color === this.selectedPlayerColor);
    },
    // Maps each resource that has a standard conversion available this turn to
    // the index of its option within the action menu, so the dashboard can show
    // a convert button on that resource's square.
    convertResources(): Partial<Record<Resource, number>> {
      const result: Partial<Record<Resource, number>> = {};
      const waitingFor = this.playerView.waitingFor;
      if (waitingFor?.type === 'or' && waitingFor.menu === true) {
        waitingFor.options.forEach((option, index) => {
          if (option.resourceSource !== undefined) {
            result[option.resourceSource] = index;
          }
        });
      }
      return result;
    },
  },

  components: {
    DynamicTitle,
    Card,
    WaitingFor,
    Sidebar,
    Colony,
    LogPanel,
    SortableCards,
    TopBar,
    GameBoardView,
    PlayerSetupView,
    StackedCards,
    PurgeWarning,
    UndergroundTokens,
    KeyboardShortcuts,
    Drawer,
    PlayerDashboardBar,
    OtherPlayersStrip,
    PlayerInfo,
  },
  methods: {
    isPlayerActing(playerView: PlayerViewModel) : boolean {
      return playerView.players.length > 1 && playerView.waitingFor !== undefined && !playerView.waitingFor.optional;
    },
    getFleetsCountRange(player: PublicPlayerModel): Array<number> {
      const fleetsRange = [];
      for (let i = 0; i < player.fleetSize - player.tradesThisGeneration; i++) {
        fleetsRange.push(i);
      }
      return fleetsRange;
    },
    setDrawer(drawer: DrawerName): void {
      this.openDrawer = this.openDrawer === drawer ? undefined : drawer;
    },
    closeDrawer(): void {
      this.openDrawer = undefined;
    },
    openPlayerDrawer(color: Color): void {
      this.selectedPlayerColor = color;
      this.openDrawer = 'player';
    },
    onConvert(resource: Resource): void {
      this.requestOptionIndex = this.convertResources[resource];
    },
    toggle(type: ToggleableCardType): void {
      this[typeToDataModel[type].key] = !this[typeToDataModel[type].key];
    },
    isVisible(type: ToggleableCardType): boolean {
      return this[typeToDataModel[type].key];
    },
    getToggleLabel(hideType: ToggleableCardType): string {
      const val = this[typeToDataModel[hideType].key];
      return val ? '✔' : '';
    },
    getHideButtonClass(hideType: ToggleableCardType): string {
      const prefix = 'hiding-card-button ';
      switch (hideType) {
      case 'HAND':
        return prefix + (this.showHand ? 'hand-toggle' : 'hand-toggle-transparent');
      case 'ACTIVE':
        return prefix + (this.showActiveCards ? 'active' : 'active-transparent');
      case 'AUTOMATED':
        return prefix + (this.showAutomatedCards ? 'automated' : 'automated-transparent');
      case 'EVENT':
        return prefix + (this.showEventCards ? 'event' : 'event-transparent');
      }
    },
    isActive(cardModel: CardModel): boolean {
      const card = getCardOrThrow(cardModel.name);
      return card.type === CardType.ACTIVE || card.hasAction;
    },
    isNotActive(cardModel: CardModel): boolean {
      return !getCardOrThrow(cardModel.name).hasAction;
    },
    // Scale the board so it fills the space between the bottom bar and the top
    // without being clipped, regardless of window size. offsetWidth/Height are
    // unaffected by the transform, so measuring them here can't feed back.
    updateBoardScale(): void {
      const scaler = this.$refs.boardScaler as HTMLElement | undefined;
      const container = scaler?.parentElement;
      if (scaler === undefined || container === null || container === undefined) {
        return;
      }
      const naturalWidth = scaler.offsetWidth;
      const naturalHeight = scaler.offsetHeight;
      if (naturalWidth === 0 || naturalHeight === 0) {
        return;
      }
      const scale = Math.min(container.clientWidth / naturalWidth, container.clientHeight / naturalHeight);
      this.boardScale = Math.max(0.5, Math.min(scale, 3));
    },
  },
  mounted() {
    this.$nextTick(() => this.updateBoardScale());
    const scaler = this.$refs.boardScaler as HTMLElement | undefined;
    const container = scaler?.parentElement;
    if (container !== null && container !== undefined && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.updateBoardScale());
      observer.observe(container);
      this.boardResizeObserver = markRaw(observer);
    }
  },
  unmounted() {
    this.boardResizeObserver?.disconnect();
  },
});

</script>
