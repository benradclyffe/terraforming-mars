<template>
  <div class="other-players-strip">
    <button
      v-for="player in opponents"
      :key="player.color"
      class="other-player-entry"
      :class="'player_translucent_bg_color_' + player.color"
      :title="player.name"
      @click="select(player.color)">
      <span class="other-player-entry-name">{{ player.name }}</span>
      <span class="other-player-entry-tr" :title="$t('Terraform Rating')">{{ player.terraformRating }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Compact opponents column shown alongside the board. Each entry shows an
// opponent's name and terraform rating at a glance; clicking one opens that
// player's full tableau in a drawer.
export default defineComponent({
  name: 'OtherPlayersStrip',
  props: {
    players: {
      type: Array as () => Array<PublicPlayerModel>,
      required: true,
    },
    thisPlayerColor: {
      type: String as () => Color,
      required: true,
    },
  },
  emits: ['select'],
  computed: {
    opponents(): Array<PublicPlayerModel> {
      return this.players.filter((p) => p.color !== this.thisPlayerColor);
    },
  },
  methods: {
    select(color: Color) {
      this.$emit('select', color);
    },
  },
});
</script>
