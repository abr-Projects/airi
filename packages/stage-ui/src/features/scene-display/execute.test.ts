import type { Tool, ToolExecuteOptions } from '@xsai/shared-chat'

import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import { sceneDisplay } from './execute'
import { useSceneDisplayStore } from './store'
import { createSceneDisplayTarget } from './target-fixture'

const TABLE = {
  columns: ['Region', 'Total'],
  rows: [['North', 12], ['South', 9]],
}

const EXECUTE_OPTIONS: ToolExecuteOptions = { messages: [], toolCallId: 'call-scene-display' }

function call(tool: Tool, input: Record<string, unknown>) {
  return tool.execute(input, EXECUTE_OPTIONS)
}

function parameters(tool: Tool) {
  return (tool.function.parameters as { required: string[] })
}

function setup() {
  setActivePinia(createPinia())
  const fixture = createSceneDisplayTarget()
  useSceneDisplayStore().setTarget(fixture.target)
  const [tool] = sceneDisplay()
  return { fixture, tool }
}

describe('sceneDisplay', () => {
  it('names the tool stage_display and lists every optional key in required', () => {
    const { tool } = setup()

    expect(tool.function.name).toBe('stage_display')
    // Strict validators reject a schema that omits a key from `required`.
    expect(parameters(tool).required).toEqual([
      'action',
      'display_id',
      'kind',
      'table',
      'graph',
      'image',
      'latex',
      'code',
      'title',
    ])
  })

  it('reports an unavailable runtime instead of throwing', async () => {
    setActivePinia(createPinia())
    const [tool] = sceneDisplay()

    await expect(call(tool, { action: 'show', kind: 'table', table: TABLE })).resolves.toContain('not available')
  })

  it('shows a table and returns its id', async () => {
    const { fixture, tool } = setup()

    const result = await call(tool, { action: 'show', kind: 'table', table: TABLE })

    expect(fixture.shown).toHaveLength(1)
    expect(fixture.shown[0].content).toEqual({ kind: 'table', table: TABLE })
    expect(result).toContain(fixture.shown[0].handle.id)
  })

  it('passes the requested title to the target', async () => {
    const { fixture, tool } = setup()

    await call(tool, { action: 'show', kind: 'table', title: 'Sales', table: TABLE })

    expect(fixture.shown[0].options).toEqual({ title: 'Sales' })
  })

  it('shows every kind', async () => {
    const { fixture, tool } = setup()

    await call(tool, { action: 'show', kind: 'graph', graph: { series: [{ name: 'a', points: [{ x: 0, y: 1 }] }] } })
    await call(tool, { action: 'show', kind: 'image', image: { url: 'https://example.com/a.png' } })
    await call(tool, { action: 'show', kind: 'latex', latex: { tex: 'a^2' } })
    await call(tool, { action: 'show', kind: 'code', code: { code: 'const a = 1', language: 'ts' } })

    expect(fixture.shown.map(item => item.content.kind)).toEqual(['graph', 'image', 'latex', 'code'])
  })

  it('rejects an image URL that is not https or data', async () => {
    const { fixture, tool } = setup()

    const result = await call(tool, { action: 'show', kind: 'image', image: { url: 'file:///etc/passwd' } })

    expect(fixture.shown).toHaveLength(0)
    expect(result).toContain('rejected')
  })

  it('rejects an unknown action', async () => {
    const { fixture, tool } = setup()

    const result = await call(tool, { action: 'destroy', kind: 'table', table: TABLE })

    expect(fixture.shown).toHaveLength(0)
    expect(result).toContain('rejected')
  })

  it('rejects a table row that is not an array', async () => {
    const { fixture, tool } = setup()

    const result = await call(tool, { action: 'show', kind: 'table', table: { columns: ['A'], rows: 'nope' } })

    expect(fixture.shown).toHaveLength(0)
    expect(result).toContain('rejected')
  })

  it('updates an existing display', async () => {
    const { fixture, tool } = setup()

    await call(tool, { action: 'show', kind: 'table', table: TABLE })
    const id = fixture.shown[0].handle.id

    const result = await call(tool, { action: 'update', display_id: id, kind: 'code', code: { code: 'x', language: 'ts' } })

    expect(fixture.updated).toEqual([{ content: { kind: 'code', code: { code: 'x', language: 'ts' } }, id }])
    expect(result).toContain(id)
  })

  it('requires a display id for update and remove', async () => {
    const { tool } = setup()

    await expect(call(tool, { action: 'update', kind: 'table', table: TABLE })).resolves.toContain('display_id')
    await expect(call(tool, { action: 'remove' })).resolves.toContain('display_id')
  })

  it('removes one display', async () => {
    const { fixture, tool } = setup()

    await call(tool, { action: 'show', kind: 'table', table: TABLE })
    const id = fixture.shown[0].handle.id
    await call(tool, { action: 'remove', display_id: id })

    expect(fixture.removed).toEqual([id])
  })

  it('clears every display', async () => {
    const { fixture, tool } = setup()

    await call(tool, { action: 'clear' })

    expect(fixture.clearCount).toBe(1)
  })

  it('asks for a payload when the show action has none', async () => {
    const { tool } = setup()

    await expect(call(tool, { action: 'show', kind: 'table' })).resolves.toContain('payload')
  })

  it('turns a throwing target into a sentence', async () => {
    const { fixture, tool } = setup()
    fixture.failNext = true

    await expect(call(tool, { action: 'show', kind: 'table', table: TABLE })).resolves.toContain('rejected')
  })
})
