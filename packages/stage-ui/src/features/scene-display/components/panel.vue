<script setup lang="ts">
import type { CodeContent, ImageContent, LatexContent } from '../content'
import type { SceneDisplayEntry } from '../store'

import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import GraphPanel from './graph.vue'
import RichTextPanel from './rich-text.vue'
import TablePanel from './table.vue'

import { useSceneDisplayStore } from '../store'

const props = defineProps<{
  entry: SceneDisplayEntry
}>()

const emit = defineEmits<{
  close: [id: string]
}>()

const store = useSceneDisplayStore()
const { maxVisible } = storeToRefs(store)

const table = computed(() => props.entry.content.kind === 'table' ? props.entry.content.table : undefined)
const graph = computed(() => props.entry.content.kind === 'graph' ? props.entry.content.graph : undefined)
const rich = computed<CodeContent | ImageContent | LatexContent | undefined>(() => {
  const content = props.entry.content

  if (content.kind === 'image')
    return content.image
  if (content.kind === 'latex')
    return content.latex
  if (content.kind === 'code')
    return content.code

  return undefined
})

const PANEL_WIDTH = 360
const dragging = ref(false)
let offsetX = 0
let offsetY = 0

function startDrag(event: PointerEvent) {
  if (event.button !== 0)
    return

  offsetX = event.clientX - props.entry.x
  offsetY = event.clientY - props.entry.y
  dragging.value = true
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function onDrag(event: PointerEvent) {
  if (!dragging.value)
    return

  store.move(props.entry.id, event.clientX - offsetX, event.clientY - offsetY)
}

function endDrag() {
  dragging.value = false
}
</script>

<template>
  <section
    class="scene-display-panel pointer-events-auto fixed z-50 flex flex-col overflow-hidden border border-neutral-200 rounded-lg bg-white/95 shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95"
    :style="{
      left: `${entry.x}px`,
      top: `${entry.y}px`,
      width: `${PANEL_WIDTH}px`,
    }"
  >
    <header
      class="flex shrink-0 cursor-grab touch-none items-center gap-2 border-b border-neutral-200 px-3 py-2 active:cursor-grabbing dark:border-neutral-700"
      @pointerdown="startDrag"
      @pointermove="onDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <h2 class="flex-1 truncate text-sm font-medium">
        {{ entry.title }}
      </h2>
      <button
        type="button"
        class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        :aria-label="`Close ${entry.title}`"
        @click="emit('close', entry.id)"
      >
        <span class="i-lobe-icons:close-square" />
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-auto p-3">
      <TablePanel v-if="table" :content="table" />
      <GraphPanel v-else-if="graph" :content="graph" />
      <RichTextPanel v-else-if="rich" :content="rich" />
    </div>

    <footer v-if="maxVisible > 1" class="shrink-0 px-3 py-1 text-[10px] opacity-50">
      {{ entry.id }}
    </footer>
  </section>
</template>
