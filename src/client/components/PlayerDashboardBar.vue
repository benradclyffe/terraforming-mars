<template>
  <div class="player-dashboard-bar" ref="bar" :style="{height: barHeight}">
    <div class="player-dashboard-bar-content" ref="content" :style="{transform: 'scale(' + scale + ')'}">
      <PlayerInfo
        :player="playerView.thisPlayer"
        :playerView="playerView"
        :actionLabel="''"
        :playerIndex="-1"
        :hideZeroTags="true"
        :isTopBar="true"
        section="body"
        :convertResources="convertResources"
        @convert="$emit('convert', $event)" />

      <div class="dashboard-icons">
        <button class="dashboard-icon dashboard-icon--corp" :title="$t('Corporation')" @click="toggle('corp')">
          <i class="dashboard-icon-glyph dashboard-icon-glyph--corp"></i>
          <span class="dashboard-label" v-i18n>Corp</span>
        </button>
        <button class="dashboard-icon dashboard-icon--hand" :title="$t('Cards in hand')" @click="toggle('hand')">
          <i class="dashboard-icon-glyph dashboard-icon-glyph--hand"></i>
          <span class="dashboard-count">{{ handCount }}</span>
        </button>
        <button class="dashboard-icon dashboard-icon--played" :title="$t('Played cards')" @click="toggle('played')">
          <i class="dashboard-icon-glyph dashboard-icon-glyph--played"></i>
          <span class="dashboard-count">{{ playedCount }}</span>
        </button>
        <button v-if="coloniesCount > 0" class="dashboard-icon dashboard-icon--colonies" :title="$t('Colonies')" @click="toggle('colonies')">
          <i class="dashboard-icon-glyph dashboard-icon-glyph--colonies"></i>
          <span class="dashboard-count">{{ coloniesCount }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, markRaw} from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';

// The fixed game bar below the board. Shows the current player's dashboard
// (resources, production, tags) and icon buttons that toggle the slide-in
// drawers for cards in hand, played cards, and colonies. The whole row scales
// to fit the available width so it stays on one line (no wrap).
export type DashboardDrawer = 'hand' | 'played' | 'colonies' | 'corp';

type DataModel = {
  scale: number;
  barHeight: string;
  resizeObserver: ResizeObserver | undefined;
};

export default defineComponent({
  name: 'PlayerDashboardBar',
  components: {
    PlayerInfo,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    handCount: {
      type: Number,
      required: true,
    },
    playedCount: {
      type: Number,
      required: true,
    },
    coloniesCount: {
      type: Number,
      required: true,
    },
    convertResources: {
      type: Object as () => Partial<Record<Resource, number>>,
      default: () => ({}),
    },
  },
  emits: ['toggle', 'convert'],
  data(): DataModel {
    return {
      scale: 1,
      barHeight: 'auto',
      resizeObserver: undefined,
    };
  },
  methods: {
    toggle(drawer: DashboardDrawer) {
      this.$emit('toggle', drawer);
    },
    // Scale the single-line content down to fit the bar width. offsetWidth is
    // unaffected by the transform, so measuring here can't feed back.
    updateScale(): void {
      const content = this.$refs.content as HTMLElement | undefined;
      const bar = this.$refs.bar as HTMLElement | undefined;
      if (content === undefined || bar === undefined) {
        return;
      }
      const naturalWidth = content.offsetWidth;
      const naturalHeight = content.offsetHeight;
      if (naturalWidth === 0) {
        return;
      }
      const scale = Math.min(1, bar.clientWidth / naturalWidth);
      this.scale = scale;
      this.barHeight = Math.ceil(naturalHeight * scale) + 'px';
    },
  },
  mounted() {
    this.$nextTick(() => this.updateScale());
    const content = this.$refs.content as HTMLElement | undefined;
    const bar = this.$refs.bar as HTMLElement | undefined;
    if (content !== undefined && bar !== undefined && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.updateScale());
      observer.observe(bar);
      observer.observe(content);
      this.resizeObserver = markRaw(observer);
    }
  },
  unmounted() {
    this.resizeObserver?.disconnect();
  },
});
</script>
