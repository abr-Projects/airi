<script setup lang="ts">
import { storeToRefs } from 'pinia'

import Panel from './panel.vue'

import { useSceneDisplayStore } from '../store'

const store = useSceneDisplayStore()
const { entries } = storeToRefs(store)
</script>

<template>
  <div class="scene-display-overlay pointer-events-none fixed inset-0 z-40 overflow-hidden">
    <Panel
      v-for="entry in entries"
      :key="entry.id"
      :entry="entry"
      @close="store.close"
    />
  </div>
</template>
