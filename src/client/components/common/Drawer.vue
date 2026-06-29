<template>
  <div v-if="open" :class="['drawer-root', 'drawer--' + side]">
    <div class="drawer-backdrop" @click="close"></div>
    <div class="drawer-panel" :class="'drawer-panel--' + side">
      <div class="drawer-header">
        <div class="drawer-title">{{ $t(title) }}</div>
        <button class="drawer-close" @click="close">×</button>
      </div>
      <div class="drawer-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// A reusable slide-in panel anchored to a screen edge. Used to surface the log,
// cards in hand, and played cards on the single-screen dashboard without
// scrolling the main page. The board stays visible behind a light backdrop.
export default defineComponent({
  name: 'Drawer',
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    side: {
      type: String as () => 'right' | 'bottom' | 'left',
      default: 'right',
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  methods: {
    close() {
      this.$emit('close');
    },
    keylistener(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.open) {
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
