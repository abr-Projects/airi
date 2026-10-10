import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import { createStoreSceneDisplayTarget } from './dom-target'
import { useSceneDisplayStore } from './store'

const TABLE = { columns: ['A'], rows: [[1]] }
const CODE = { code: 'const a = 1', language: 'ts' }

describe('sceneDisplayStore', () => {
  it('registers and clears a target', () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()

    expect(store.hasTarget()).toBe(false)
    store.setTarget(createStoreSceneDisplayTarget())
    expect(store.hasTarget()).toBe(true)
    store.setTarget()
    expect(store.hasTarget()).toBe(false)
  })

  it('adds entries through the store target and gives each a title', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    const handle = await target.show({ kind: 'table', table: TABLE })

    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].title).toBe('Table')
    expect(handle.id).toBe(store.entries[0].id)
  })

  it('uses the requested title', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    await target.show({ kind: 'code', code: CODE }, { title: 'Snippet' })

    expect(store.entries[0].title).toBe('Snippet')
  })

  it('replaces content without changing the id', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    const handle = await target.show({ kind: 'table', table: TABLE })
    await target.update(handle, { kind: 'code', code: CODE })

    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].id).toBe(handle.id)
    expect(store.entries[0].kind).toBe('code')
    expect(store.entries[0].title).toBe('Code')
  })

  it('ignores an update to an unknown id', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    await target.update({ id: 'missing', kind: 'table' }, { kind: 'table', table: TABLE })

    expect(store.entries).toHaveLength(0)
  })

  it('removes one entry and clears the rest', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    const first = await target.show({ kind: 'table', table: TABLE })
    await target.show({ kind: 'code', code: CODE })
    await target.remove(first)
    expect(store.entries).toHaveLength(1)

    await target.clear()
    expect(store.entries).toHaveLength(0)
  })

  it('drops the oldest entry past the visible cap', async () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()
    store.maxVisible = 2
    const target = createStoreSceneDisplayTarget()
    store.setTarget(target)

    const first = await target.show({ kind: 'table', table: TABLE })
    await target.show({ kind: 'code', code: CODE })
    await target.show({ kind: 'graph', graph: { series: [{ name: 'a', points: [{ x: 0, y: 0 }] }] } })

    expect(store.entries).toHaveLength(2)
    expect(store.entries.some(entry => entry.id === first.id)).toBe(false)
  })

  it('clamps a drag inside the viewport', () => {
    setActivePinia(createPinia())
    const store = useSceneDisplayStore()

    void store.add({ kind: 'table', table: TABLE })
    const id = store.entries[0].id

    store.move(id, -500, -500)
    expect(store.entries[0].x).toBe(8)
    expect(store.entries[0].y).toBe(8)

    store.move(id, 999999, 999999)
    expect(store.entries[0].x).toBeLessThanOrEqual(Math.max(0, (globalThis.innerWidth ?? 1920) - 480))
  })
})
