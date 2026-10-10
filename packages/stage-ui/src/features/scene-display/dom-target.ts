import type { SceneDisplayContent, SceneDisplayKind } from './content'
import type { SceneDisplayHandle, SceneDisplayOptions, SceneDisplayTarget } from './target'

import { useSceneDisplayStore } from './store'

/**
 * Builds the target that drives the reactive display store.
 *
 * Use when:
 * - A renderer renders scene display content from `useSceneDisplayStore`
 *
 * Expects:
 * - Only the leader process creates this target
 *
 * Returns:
 * - A target whose operations are store writes, so a mounted component follows
 *   every tool call without extra wiring
 */
export function createStoreSceneDisplayTarget(): SceneDisplayTarget {
  const store = () => useSceneDisplayStore()

  return {
    name: 'store',
    async clear() {
      await store().closeAll()
    },
    async remove(handle: SceneDisplayHandle) {
      await store().close(handle.id)
    },
    async show(content: SceneDisplayContent, options?: SceneDisplayOptions) {
      const entry = await store().add(content, options?.title)
      return { id: entry.id, kind: entry.kind }
    },
    async update(handle: SceneDisplayHandle, content: SceneDisplayContent) {
      await store().replace(handle.id, content)
    },
  }
}

/** Re-exported for renderers that branch on the kind. */
export type { SceneDisplayKind }
