import * as v from 'valibot'

/** The multimedia kinds the model can ask the scene to show. */
export const sceneDisplayKinds = ['table', 'graph', 'image', 'latex', 'code'] as const

export type SceneDisplayKind = typeof sceneDisplayKinds[number]

/** Actions the tool accepts. Every action uses the same schema. */
export const sceneDisplayActions = ['show', 'update', 'remove', 'clear'] as const

export type SceneDisplayAction = typeof sceneDisplayActions[number]

const cellSchema = v.union([v.string(), v.number(), v.boolean()])

export const tableContentSchema = v.object({
  columns: v.array(v.pipe(v.string(), v.minLength(1))),
  rows: v.array(v.array(cellSchema)),
})

export const graphPointSchema = v.object({
  x: v.number(),
  y: v.number(),
})

export const graphSeriesSchema = v.object({
  name: v.string(),
  points: v.pipe(v.array(graphPointSchema), v.minLength(1)),
})

export const graphContentSchema = v.object({
  series: v.pipe(v.array(graphSeriesSchema), v.minLength(1)),
  xLabel: v.nullish(v.string()),
  yLabel: v.nullish(v.string()),
})

/**
 * Accepts `https:` and `data:` only, so a model cannot reach `file:` or
 * `javascript:` through an image URL.
 */
export const sceneDisplayImageUrlSchema = v.pipe(
  v.string(),
  v.check(
    value => value.startsWith('https://') || value.startsWith('data:image/'),
    'Image URL must start with https:// or data:image/',
  ),
)

export const imageContentSchema = v.object({
  url: sceneDisplayImageUrlSchema,
  alt: v.nullish(v.string()),
})

export const latexContentSchema = v.object({
  tex: v.pipe(v.string(), v.minLength(1)),
  display: v.nullish(v.boolean()),
})

export const codeContentSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
  language: v.nullish(v.string()),
})

/** The action and its target, checked before any content is parsed. */
export const sceneDisplayIntentSchema = v.object({
  action: v.picklist(sceneDisplayActions),
  displayId: v.nullish(v.string()),
  title: v.nullish(v.string()),
})

export type TableContent = v.InferOutput<typeof tableContentSchema>
export type GraphContent = v.InferOutput<typeof graphContentSchema>
export type ImageContent = v.InferOutput<typeof imageContentSchema>
export type LatexContent = v.InferOutput<typeof latexContentSchema>
export type CodeContent = v.InferOutput<typeof codeContentSchema>
export type SceneDisplayIntent = v.InferOutput<typeof sceneDisplayIntentSchema>

export type SceneDisplayContent
  = { kind: 'table', table: TableContent }
    | { kind: 'graph', graph: GraphContent }
    | { kind: 'image', image: ImageContent }
    | { kind: 'latex', latex: LatexContent }
    | { kind: 'code', code: CodeContent }

/** Reads the action and its target out of the flat tool arguments. */
export function readSceneDisplayIntent(input: Record<string, unknown>): SceneDisplayIntent {
  return v.parse(sceneDisplayIntentSchema, {
    action: input.action,
    displayId: input.display_id ?? undefined,
    title: input.title ?? undefined,
  })
}

/** Reads the payload that belongs to `kind` out of the flat tool arguments. */
export function readSceneDisplayContent(input: Record<string, unknown>): SceneDisplayContent | undefined {
  const kind: string | undefined = typeof input.kind === 'string' ? input.kind : undefined

  if (kind === undefined)
    return undefined

  const raw = input[kind]

  if (raw === undefined || raw === null)
    return undefined

  switch (kind) {
    case 'table':
      return { kind: 'table', table: v.parse(tableContentSchema, raw) }
    case 'graph':
      return { kind: 'graph', graph: v.parse(graphContentSchema, raw) }
    case 'image':
      return { kind: 'image', image: v.parse(imageContentSchema, raw) }
    case 'latex':
      return { kind: 'latex', latex: v.parse(latexContentSchema, raw) }
    case 'code':
      return { kind: 'code', code: v.parse(codeContentSchema, raw) }
    default:
      return undefined
  }
}
