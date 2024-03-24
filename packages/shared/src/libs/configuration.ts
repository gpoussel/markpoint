import z from 'zod'

export const TemplateElementConfigurationSchema = z.object({
  name: z.string(),
  creationId: z.string(),
  type: z.union([z.literal('line'), z.literal('picture'), z.literal('text')]),
})

export const TemplateLayoutConfigurationSchema = z.object({
  name: z.string(),
  baseSlideNumber: z.number(),
  elements: z.array(TemplateElementConfigurationSchema),
})

export const TemplateConfigurationSchema = z.object({
  baseFile: z.string(),
  master: z.object({
    elements: z.array(TemplateElementConfigurationSchema),
  }),
  layouts: z.array(TemplateLayoutConfigurationSchema),
})

export type TemplateConfiguration = z.infer<typeof TemplateConfigurationSchema>
export type TemplateLayoutConfiguration = z.infer<typeof TemplateLayoutConfigurationSchema>
export type TemplateElementConfiguration = z.infer<typeof TemplateElementConfigurationSchema>
