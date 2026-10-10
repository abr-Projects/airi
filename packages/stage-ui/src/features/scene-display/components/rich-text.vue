<script setup lang="ts">
import type { CodeContent, ImageContent, LatexContent } from '../content'

import { computed } from 'vue'

import MarkdownRenderer from '../../../components/markdown/markdown-renderer.vue'

const props = defineProps<{
  content: CodeContent | ImageContent | LatexContent
}>()

/**
 * The Markdown pipeline already runs KaTeX and Shiki, so both kinds render
 * through the same component the chat bubbles use. Wrapping in a fence keeps
 * the highlighter on the code path and the math parser on the formula path.
 */
const markdown = computed(() => {
  if ('code' in props.content) {
    const language = props.content.language?.trim() || 'text'
    return `\`\`\`${language}\n${props.content.code}\n\`\`\``
  }

  if ('tex' in props.content) {
    const delimiter = props.content.display ? '$$' : '$'
    return `${delimiter}${props.content.tex}${delimiter}`
  }

  return ''
})
</script>

<template>
  <MarkdownRenderer v-if="'code' in content || 'tex' in content" :content="markdown" />

  <img
    v-else-if="'url' in content"
    :src="content.url"
    :alt="content.alt ?? ''"
    class="max-h-72 w-full object-contain"
  >
</template>
