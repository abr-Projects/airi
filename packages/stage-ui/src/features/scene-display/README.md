# Scene Display

Lets the model show a table, graph, image, LaTeX formula, or code block beside the stage character.

## What it does

The LLM calls one tool, `stage_display`. The tool writes into a target that a renderer turns into visible panels.

```ts
import { registerSceneDisplayTarget } from '@proj-airi/stage-ui/features/scene-display'
```

Call it once in an app shell, then mount the overlay:

```vue
<SceneDisplayOverlay />
```

Registration happens on the leader only, because the tool runs where the LLM request runs.

## Tool shape

One tool, one `kind` discriminator, so the model does not choose between four near-identical tools.

| Field | Purpose |
| --- | --- |
| `action` | `show`, `update`, `remove`, or `clear` |
| `display_id` | Target for `update` and `remove` |
| `kind` | `table`, `graph`, `image`, `latex`, or `code` |
| `kind`-named field | The payload for that kind |
| `title` | Optional heading |

The schema lists every optional field in `required` and types them as `['type', 'null']`, because OpenAI-compatible validators reject a strict schema that omits a key.

The executor returns a short sentence in every case, including a missing target, a bad argument, and a throwing target. It never throws into the LLM loop.

## Why it renders in the page, not in the 3D scene

The scene renders through TresJS and three, so it has no DOM. A table or a formula cannot be an object in that graph.

Every target platform has a real DOM for page UI, so the panels are ordinary Vue components positioned over the canvas. This also means LaTeX and code reuse `useMarkdown()`, which already runs KaTeX and Shiki for the chat bubbles. The graph is hand-drawn SVG, matching `components/gadgets/time-series-chart.vue`. The package adds no new runtime dependency.

## Layout

| Path | Purpose |
| --- | --- |
| `content.ts` | Valibot schemas and the flat-argument readers |
| `parameters.ts` | JSON Schema for the tool, written by hand for strict validators |
| `target.ts` | The `SceneDisplayTarget` contract |
| `store.ts` | Reactive entries, the visible cap, drag clamping |
| `execute.ts` | The `stage_display` tool |
| `register.ts` | Registers the store-backed target |
| `components/` | Panel shell plus one renderer per kind |
| `target-fixture.ts` | Recording target for tests |

## Adding a target

Implement `SceneDisplayTarget` and pass it to `useSceneDisplayStore().setTarget()`. The tool resolves the active target at call time, so a target can be swapped without touching the executor.

## Limits

- The visible cap is 3 panels. Past it the oldest closes.
- Panels have no timeout. The user closes them, or the model calls `remove` or `clear`.
- Image URLs must start with `https://` or `data:image/`.
- A panel is positioned over the canvas, not parented to it. It does not occlude with the model.
