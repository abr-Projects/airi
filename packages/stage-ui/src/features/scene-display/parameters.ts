import type { JsonSchema } from 'xsschema'

import { sceneDisplayActions, sceneDisplayKinds } from './content'

/**
 * JSON Schema for the scene display tool.
 *
 * Every optional field uses a `['type', 'null']` union and still appears in
 * `required`. OpenAI-compatible validators reject a strict schema that leaves
 * a key out of `required`.
 *
 * The shape is written by hand rather than converted from the Valibot
 * schemas, because xsschema rejects the union and array shapes that OpenAI
 * strict tool schemas use.
 */
export const sceneDisplayToolParameters: JsonSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [...sceneDisplayActions],
      description: 'show creates a display. update replaces the content of an existing display. remove closes one display. clear closes every display.',
    },
    display_id: {
      type: ['string', 'null'],
      description: 'Target display for update and remove. Omit it for show. Use clear for no target.',
    },
    kind: {
      type: ['string', 'null'],
      enum: [...sceneDisplayKinds, null],
      description: 'Content type. Use table, graph, image, latex, or code.',
    },
    table: {
      type: ['object', 'null'],
      description: 'Table payload. Set columns to header labels and rows to arrays of cell values.',
      properties: {
        columns: { type: 'array', items: { type: 'string' }, description: 'Header labels, one per column.' },
        rows: { type: 'array', items: { type: 'array', items: {} }, description: 'One array of cell values per row.' },
      },
      required: ['columns', 'rows'],
      additionalProperties: false,
    },
    graph: {
      type: ['object', 'null'],
      description: 'Graph payload. Use series for one or more named lines of numeric points.',
      properties: {
        series: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              points: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                  },
                  required: ['x', 'y'],
                  additionalProperties: false,
                },
              },
            },
            required: ['name', 'points'],
            additionalProperties: false,
          },
        },
        x_label: { type: ['string', 'null'] },
        y_label: { type: ['string', 'null'] },
      },
      required: ['series'],
      additionalProperties: false,
    },
    image: {
      type: ['object', 'null'],
      description: 'Image payload. The URL must start with https:// or data:image/.',
      properties: {
        url: { type: 'string' },
        alt: { type: ['string', 'null'] },
      },
      required: ['url'],
      additionalProperties: false,
    },
    latex: {
      type: ['object', 'null'],
      description: 'LaTeX payload. Set tex to the formula source, without delimiters.',
      properties: {
        tex: { type: 'string' },
        display: { type: ['boolean', 'null'], description: 'true for a centered block, false for inline.' },
      },
      required: ['tex'],
      additionalProperties: false,
    },
    code: {
      type: ['object', 'null'],
      description: 'Code payload. Set code to the source and language to the highlighting language.',
      properties: {
        code: { type: 'string' },
        language: { type: ['string', 'null'] },
      },
      required: ['code'],
      additionalProperties: false,
    },
    title: {
      type: ['string', 'null'],
      description: 'Optional heading for the panel. Defaults to a name derived from the kind.',
    },
  },
  required: ['action', 'display_id', 'kind', 'table', 'graph', 'image', 'latex', 'code', 'title'],
  additionalProperties: false,
}
