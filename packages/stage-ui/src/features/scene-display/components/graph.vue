<script setup lang="ts">
import type { GraphContent } from '../content'

import { computed } from 'vue'

const props = defineProps<{
  content: GraphContent
  height?: number
}>()

const WIDTH = 320
const PADDING = { top: 8, right: 8, bottom: 20, left: 32 }

const palette = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#14b8a6']

const height = computed(() => props.height ?? 160)

const bounds = computed(() => {
  const points = props.content.series.flatMap(series => series.points)

  if (points.length === 0)
    return { maxX: 1, maxY: 1, minX: 0, minY: 0 }

  const xs = points.map(point => point.x)
  const ys = points.map(point => point.y)
  return {
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
  }
})

/** A flat range would divide by zero, so widen it before scaling. */
const range = computed(() => {
  const { maxX, maxY, minX, minY } = bounds.value
  return {
    x: maxX - minX || 1,
    y: maxY - minY || 1,
  }
})

const plot = computed(() => ({
  height: height.value - PADDING.top - PADDING.bottom,
  width: WIDTH - PADDING.left - PADDING.right,
}))

function projectX(value: number) {
  return PADDING.left + ((value - bounds.value.minX) / range.value.x) * plot.value.width
}

function projectY(value: number) {
  return PADDING.top + plot.value.height - ((value - bounds.value.minY) / range.value.y) * plot.value.height
}

const paths = computed(() => props.content.series.map((series, index) => {
  const ordered = [...series.points].sort((a, b) => a.x - b.x)
  const path = ordered
    .map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'}${projectX(point.x).toFixed(2)},${projectY(point.y).toFixed(2)}`)
    .join(' ')

  return {
    color: palette[index % palette.length]!,
    name: series.name,
    path,
  }
}))

const gridLines = computed(() => {
  const lines: Array<{ label: string, y: number }> = []
  const steps = 4

  for (let step = 0; step <= steps; step++) {
    const ratio = step / steps
    const value = bounds.value.minY + ratio * range.value.y
    lines.push({
      label: Number.isInteger(value) ? String(value) : value.toFixed(1),
      y: PADDING.top + plot.value.height - ratio * plot.value.height,
    })
  }

  return lines
})
</script>

<template>
  <div class="scene-display-graph">
    <svg :viewBox="`0 0 ${WIDTH} ${height}`" class="w-full">
      <g v-for="line in gridLines" :key="line.y">
        <line
          :x1="PADDING.left"
          :y1="line.y"
          :x2="WIDTH - PADDING.right"
          :y2="line.y"
          stroke="currentColor"
          stroke-opacity="0.12"
          stroke-width="1"
        />
        <text :x="PADDING.left - 6" :y="line.y + 3" text-anchor="end" class="fill-current text-[9px] opacity-60">
          {{ line.label }}
        </text>
      </g>

      <path
        v-for="series in paths"
        :key="series.name"
        :d="series.path"
        fill="none"
        :stroke="series.color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
      <span v-for="series in paths" :key="series.name" class="flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: series.color }" />
        {{ series.name }}
      </span>
    </div>
  </div>
</template>
