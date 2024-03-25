import z from 'zod'

const BaseTemplateElementConfigurationSchema = z
  .object({
    creationId: z.string(),
  })
  .strict()

const TemplateElementConfigurationSchema = z.discriminatedUnion('type', [
  BaseTemplateElementConfigurationSchema.merge(
    z
      .object({
        type: z.literal('content'),
        reference: z.enum(['title', 'summary']),
      })
      .strict(),
  ),
  BaseTemplateElementConfigurationSchema.merge(
    z
      .object({
        type: z.literal('text'),
        template: z.string(),
      })
      .strict(),
  ),
  BaseTemplateElementConfigurationSchema.merge(
    z
      .object({
        type: z.literal('picture'),
        path: z.string(),
      })
      .strict(),
  ),
])

export const TemplateLayoutConfigurationSchema = z
  .object({
    name: z.string().optional(), // TODO: remove once "layouts" is entirely replaced by "layout"
    baseSlideNumber: z.number(),
    elements: z.array(TemplateElementConfigurationSchema),
  })
  .strict()

const FirstAndLastTemplateLayoutConfigurationSchema = z
  .object({
    first: TemplateLayoutConfigurationSchema.optional(),
    last: TemplateLayoutConfigurationSchema.optional(),
  })
  .strict()
  .optional()

export const TemplateConfigurationSchema = z
  .object({
    baseFile: z.string(),
    master: z
      .object({
        elements: z.array(TemplateElementConfigurationSchema),
      })
      .strict(),
    layout: z
      .object({
        document: FirstAndLastTemplateLayoutConfigurationSchema,
        section: FirstAndLastTemplateLayoutConfigurationSchema,
      })
      .strict()
      .optional(),
    layouts: z.array(TemplateLayoutConfigurationSchema),
  })
  .strict()

export type TemplateConfiguration = z.infer<typeof TemplateConfigurationSchema>
export type TemplateLayoutConfiguration = z.infer<typeof TemplateLayoutConfigurationSchema>
export type TemplateElementConfiguration = z.infer<typeof TemplateElementConfigurationSchema>
