import type { Tool } from '@xsai/shared-chat'

import type { SceneDisplayContent } from './content'

import { errorMessageFrom } from '@moeru/std'
import { rawTool } from '@xsai/tool'

import { readSceneDisplayContent, readSceneDisplayIntent, sceneDisplayActions, sceneDisplayKinds } from './content'
import { sceneDisplayToolParameters } from './parameters'
import { useSceneDisplayStore } from './store'

const UNAVAILABLE = 'Scene display is not available in this runtime. Do not call stage_display again.'

/** Runs one validated tool call against the active target. */
async function run(input: Record<string, unknown>): Promise<string> {
  const intent = readSceneDisplayIntent(input)
  const { target } = useSceneDisplayStore()

  if (!target)
    return UNAVAILABLE

  if (intent.action === 'clear') {
    await target.clear()
    return 'Closed every scene display.'
  }

  if (!intent.displayId && intent.action !== 'show')
    return `The ${intent.action} action needs a display_id.`

  let content: SceneDisplayContent | undefined

  try {
    content = readSceneDisplayContent(input)
  }
  catch (error) {
    return `Scene display rejected the content: ${errorMessageFrom(error)}`
  }

  if (intent.action === 'remove') {
    await target.remove({ id: intent.displayId!, kind: 'table' })
    return `Closed scene display "${intent.displayId}".`
  }

  if (!content)
    return `The ${intent.action} action needs a "${String(input.kind ?? 'known')}" payload. Provide it and call again.`

  if (intent.action === 'update') {
    await target.update({ id: intent.displayId!, kind: content.kind }, content)
    return `Updated scene display "${intent.displayId}" to ${content.kind}.`
  }

  const handle = await target.show(content, { title: intent.title ?? undefined })
  return `Displayed ${content.kind} as "${handle.id}". Use that id to update or remove it.`
}

/**
 * Creates the tool the model calls to show multimedia content in the scene.
 *
 * Use when:
 * - A runtime registered a display target through `useSceneDisplayStore`
 *
 * Expects:
 * - The target accepts content that the schemas validated
 *
 * Returns:
 * - A short sentence the model reads back. A missing target, a bad argument,
 *   and a throwing target all return a sentence, so the tool never throws into
 *   the LLM loop
 */
export function sceneDisplay(): Tool[] {
  return [rawTool({
    name: 'stage_display',
    description: `Show a table, graph, image, LaTeX formula, or code block beside the character. Use it whenever a visual explains the answer better than text. Close a display with the same tool instead of leaving it open.

Kinds: ${sceneDisplayKinds.join(', ')}.
Actions: ${sceneDisplayActions.join(', ')}.`,
    parameters: sceneDisplayToolParameters,
    execute: async (input: unknown) => {
      try {
        return await run((input ?? {}) as Record<string, unknown>)
      }
      catch (error) {
        return `Scene display rejected the request: ${errorMessageFrom(error)}`
      }
    },
  })]
}
