<template>
  <div class="card-name-search">
    <input type="text" class="card-name-search-input" v-model="query" :placeholder="$t('Search card name')">
    <ul v-if="query.length > 0" class="card-name-search-results">
      <li v-for="name in matches" :key="name">
        <button type="button" class="card-name-search-result" @click="select(name)">{{ name }}</button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {CardName} from '@/common/cards/CardName';

// A name-search box over a provided list of card names. Used by the sandbox
// card-replacement tool to find a specific card to pull from the deck.
const MAX_RESULTS = 30;

export default defineComponent({
  name: 'CardNameSearch',
  props: {
    cards: {
      type: Array as () => ReadonlyArray<CardName>,
      required: true,
    },
  },
  emits: ['select'],
  data() {
    return {
      query: '',
    };
  },
  computed: {
    matches(): Array<CardName> {
      const q = this.query.trim().toLowerCase();
      if (q.length === 0) {
        return [];
      }
      return this.cards.filter((name) => name.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
    },
  },
  methods: {
    select(name: CardName) {
      this.$emit('select', name);
      this.query = '';
    },
  },
});
</script>
