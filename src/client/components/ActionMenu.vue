<template>
  <div class="action-menu">
    <label v-if="showtitle" class="action-menu-title"><div>{{ $t(playerinput.title) }}</div></label>
    <div class="action-menu-buttons">
      <AppButton v-for="(option, idx) in displayedOptions" :key="idx"
        size="big"
        :title="buttonLabel(option)"
        @click="openOption(idx)" />
    </div>

    <div v-if="openedIdx !== undefined" class="action-menu-modal-overlay" @click.self="close">
      <div class="action-menu-modal">
        <button class="action-menu-modal-close" @click="close">×</button>
        <PlayerInputFactory ref="inputfactory"
          :playerView="playerView"
          :playerinput="openedOption"
          :onsave="onChildSave"
          :showsave="true"
          :showtitle="true" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {Message} from '@/common/logs/Message';

type DataModel = {
  displayedOptions: Array<PlayerInputModel>;
  originalIndices: Array<number>;
  openedIdx: number | undefined;
};

export default defineComponent({
  name: 'ActionMenu',
  components: {
    AppButton,
    PlayerInputFactory,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => OrOptionsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: OrOptionsResponse) => void,
      required: true,
    },
    showtitle: {
      type: Boolean,
      default: true,
    },
    // The original index of an option the dashboard wants to trigger (e.g. a
    // convert action invoked from a resource square). A terminal option is
    // submitted immediately; anything with further input opens its modal.
    requestOptionIndex: {
      type: Number,
      default: undefined,
    },
  },
  emits: ['request-handled'],
  data(): DataModel {
    // Mirror OrOptions.vue: hide learner-mode-only cards while keeping a map back
    // to the original option index, so the index submitted to the server stays
    // correct even when options are hidden.
    const displayedOptions: Array<PlayerInputModel> = [];
    const originalIndices: Array<number> = [];
    this.playerinput.options.forEach((option, i) => {
      if (option.type === 'card' && option.showOnlyInLearnerMode !== false && !getPreferences().learner_mode) {
        return;
      }
      displayedOptions.push(option);
      originalIndices.push(i);
    });
    return {
      displayedOptions,
      originalIndices,
      openedIdx: undefined,
    };
  },
  computed: {
    // Only read while the modal is open (openedIdx defined), guarded by v-if in
    // the template, so the index is always valid here.
    openedOption(): PlayerInputModel {
      return this.displayedOptions[this.openedIdx ?? 0];
    },
  },
  watch: {
    requestOptionIndex(index: number | undefined) {
      if (index === undefined || index === null) {
        return;
      }
      const displayedIdx = this.originalIndices.indexOf(index);
      if (displayedIdx !== -1) {
        const option = this.displayedOptions[displayedIdx];
        if (option.type === 'option') {
          // One-click: terminal options (e.g. convert heat) submit immediately.
          this.onsave({type: 'or', index, response: {type: 'option'}});
        } else {
          // Anything needing further input (e.g. convert plants -> place a
          // greenery) opens its modal.
          this.openOption(displayedIdx);
        }
      }
      this.$emit('request-handled');
    },
  },
  methods: {
    buttonLabel(option: PlayerInputModel): string | Message {
      return option.buttonLabel || option.title;
    },
    openOption(displayedIdx: number) {
      this.openedIdx = displayedIdx;
    },
    close() {
      this.openedIdx = undefined;
    },
    onChildSave(out: InputResponse) {
      if (this.openedIdx === undefined) {
        return;
      }
      const index = this.originalIndices[this.openedIdx];
      this.close();
      this.onsave({type: 'or', index, response: out});
    },
    keylistener(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.openedIdx !== undefined) {
        this.close();
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.keylistener);
  },
  unmounted() {
    window.removeEventListener('keydown', this.keylistener);
  },
});
</script>
