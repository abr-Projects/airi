<script setup lang="ts">
import type { TableContent } from '../content'

defineProps<{
  content: TableContent
}>()
</script>

<template>
  <div class="scene-display-table overflow-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th
            v-for="(column, index) in content.columns"
            :key="index"
            class="border-b border-neutral-200 px-3 py-2 text-left font-medium dark:border-neutral-700 dark:text-neutral-200"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in content.rows"
          :key="rowIndex"
          class="odd:bg-neutral-50 dark:odd:bg-neutral-800/40"
        >
          <td
            v-for="(cell, cellIndex) in row"
            :key="cellIndex"
            class="border-b border-neutral-200 px-3 py-1.5 dark:border-neutral-700 dark:text-neutral-300"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.scene-display-table {
  max-height: 18rem;
}
</style>
