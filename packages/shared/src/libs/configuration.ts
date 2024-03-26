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
        reference: z.enum(['title', 'subtitle', 'summary', 'content']),
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
    theme: z
      .object({
        font: z
          .object({
            monospace: z.string(),
          })
          .strict(),
        color: z.record(z.string()),
      })
      .strict(),
    layout: z
      .object({
        document: FirstAndLastTemplateLayoutConfigurationSchema,
        section: FirstAndLastTemplateLayoutConfigurationSchema,
        content: z
          .object({
            text: TemplateLayoutConfigurationSchema.optional(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict()

export type TemplateConfiguration = z.infer<typeof TemplateConfigurationSchema>
export type TemplateLayoutConfiguration = z.infer<typeof TemplateLayoutConfigurationSchema>
export type TemplateElementConfiguration = z.infer<typeof TemplateElementConfigurationSchema>
