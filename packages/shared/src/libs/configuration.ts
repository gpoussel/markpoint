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
    name: z.string(),
    baseSlideNumber: z.number(),
    elements: z.array(TemplateElementConfigurationSchema),
  })
  .strict()

export const TemplateConfigurationSchema = z
  .object({
    baseFile: z.string(),
    master: z.object({
      elements: z.array(TemplateElementConfigurationSchema),
    }),
    layouts: z.array(TemplateLayoutConfigurationSchema),
  })
  .strict()

export type TemplateConfiguration = z.infer<typeof TemplateConfigurationSchema>
export type TemplateLayoutConfiguration = z.infer<typeof TemplateLayoutConfigurationSchema>
export type TemplateElementConfiguration = z.infer<typeof TemplateElementConfigurationSchema>
