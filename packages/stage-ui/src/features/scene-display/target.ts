import type { SceneDisplayContent, SceneDisplayKind } from './content'

/** Identifies one visible display in the active target. */
export interface SceneDisplayHandle {
  id: string
  kind: SceneDisplayKind
}

export interface SceneDisplayOptions {
  title?: string
}

/**
 * Contract for a surface that can show scene display content.
 *
 * Use when:
 * - A runtime can put multimedia content in front of the character, such as a
 *   page overlay in a browser or a window in Electron
 *
 * Expects:
 * - `show` and `update` never throw for content the schema already accepted
 *
 * Returns:
 * - A handle that later `update`, `remove`, and `clear` calls can address
 */
export interface SceneDisplayTarget {
  readonly name: string
  show: (content: SceneDisplayContent, options?: SceneDisplayOptions) => Promise<SceneDisplayHandle>
  update: (handle: SceneDisplayHandle, content: SceneDisplayContent) => Promise<void>
  remove: (handle: SceneDisplayHandle) => Promise<void>
  clear: () => Promise<void>
}
