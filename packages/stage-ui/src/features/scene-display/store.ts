import type { SceneDisplayContent, SceneDisplayKind } from './content'
import type { SceneDisplayTarget } from './target'

import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

/** One visible display, owned by a target and driven by the store. */
export interface SceneDisplayEntry {
  content: SceneDisplayContent
  id: string
  kind: SceneDisplayKind
  title: string
  x: number
  y: number
}

const DEFAULT_TITLES: Record<SceneDisplayKind, string> = {
  code: 'Code',
  graph: 'Graph',
  image: 'Image',
  latex: 'Formula',
  table: 'Table',
}

/** Default offset from the bottom-right of the scene, in pixels. */
const DEFAULT_OFFSET = { x: 32, y: 32 }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Holds the displays a target shows and the target itself.
 *
 * Use when:
 * - A renderer mounts scene display content in the page
 *
 * Expects:
 * - Only the leader process registers a target, because the model tool runs
 *   where the LLM request runs
 *
 * Returns:
 * - Reactive entries that a renderer component renders directly
 */
export const useSceneDisplayStore = defineStore('scene-display', () => {
  const target = shallowRef<SceneDisplayTarget>()
  const entries = ref<SceneDisplayEntry[]>([])
  const maxVisible = ref(3)
  let counter = 0

  function nextId() {
    return `scene-display-${++counter}`
  }

  /** Drops the oldest entry once the visible cap is exceeded. */
  async function enforceCap() {
    while (entries.value.length > maxVisible.value) {
      const dropped = entries.value.shift()
      if (dropped)
        await target.value?.remove({ id: dropped.id, kind: dropped.kind })
    }
  }

  async function add(content: SceneDisplayContent, title?: string) {
    const entry: SceneDisplayEntry = {
      content,
      id: nextId(),
      kind: content.kind,
      title: title ?? DEFAULT_TITLES[content.kind],
      x: DEFAULT_OFFSET.x,
      y: DEFAULT_OFFSET.y,
    }

    entries.value = [...entries.value, entry]
    await enforceCap()
    return entry
  }

  function find(id: string) {
    return entries.value.find(entry => entry.id === id)
  }

  async function replace(id: string, content: SceneDisplayContent) {
    const existing = find(id)

    if (!existing)
      return

    entries.value = entries.value.map(entry => entry.id === id
      ? { ...entry, content, kind: content.kind, title: DEFAULT_TITLES[content.kind] }
      : entry)
  }

  async function close(id: string) {
    const existing = find(id)

    if (!existing)
      return

    entries.value = entries.value.filter(entry => entry.id !== id)
  }

  async function closeAll() {
    entries.value = []
  }

  /** Keeps a dragged panel inside the viewport. */
  function move(id: string, x: number, y: number) {
    const existing = find(id)

    if (!existing)
      return

    const maxX = Math.max(0, (globalThis.innerWidth ?? 1920) - 480)
    const maxY = Math.max(0, (globalThis.innerHeight ?? 1080) - 200)
    entries.value = entries.value.map(entry => entry.id === id
      ? { ...entry, x: clamp(x, 8, maxX), y: clamp(y, 8, maxY) }
      : entry)
  }

  /** Registers the active target. Call without an argument to detach it. */
  function setTarget(next?: SceneDisplayTarget) {
    target.value = next
  }

  function hasTarget() {
    return target.value !== undefined
  }

  return {
    add,
    close,
    closeAll,
    entries,
    find,
    hasTarget,
    maxVisible,
    move,
    replace,
    setTarget,
    target,
  }
})
