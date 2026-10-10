import type { SceneDisplayContent } from './content'
import type { SceneDisplayHandle, SceneDisplayOptions, SceneDisplayTarget } from './target'

interface Shown {
  content: SceneDisplayContent
  handle: SceneDisplayHandle
  options?: SceneDisplayOptions
}

/** A target that records every call, for tool-level tests. */
export function createSceneDisplayTarget() {
  const shown: Shown[] = []
  const updated: Array<{ content: SceneDisplayContent, id: string }> = []
  const removed: string[] = []
  const state = { clearCount: 0, failNext: false }
  let counter = 0

  const target: SceneDisplayTarget = {
    name: 'fixture',
    async clear() {
      state.clearCount += 1
    },
    async remove(handle) {
      removed.push(handle.id)
    },
    async show(content, options) {
      if (state.failNext) {
        state.failNext = false
        throw new Error('target unavailable')
      }

      const handle = { id: `display-${++counter}`, kind: content.kind }
      shown.push({ content, handle, options })
      return handle
    },
    async update(handle, content) {
      updated.push({ content, id: handle.id })
    },
  }

  return {
    get clearCount() {
      return state.clearCount
    },
    get failNext() {
      return state.failNext
    },
    set failNext(value: boolean) {
      state.failNext = value
    },
    removed,
    setTarget: target,
    shown,
    target,
    updated,
  }
}
