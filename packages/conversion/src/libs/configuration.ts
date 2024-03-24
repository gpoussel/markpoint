import z from 'zod'

export const PowerpointTemplateElementSchema = z.object({
  name: z.string(),
  creationId: z.string(),
  type: z.union([z.literal('line'), z.literal('picture'), z.literal('text')]),
})

export const PowerpointTemplateLayoutSchema = z.object({
  name: z.string(),
  baseSlideNumber: z.number(),
  elements: z.array(PowerpointTemplateElementSchema),
})

export const PowerpointTemplateConfigurationSchema = z.object({
  baseFile: z.string(),
  master: z.object({
    elements: z.array(PowerpointTemplateElementSchema),
  }),
  layouts: z.array(PowerpointTemplateLayoutSchema),
})

export type PowerpointTemplateConfiguration = z.infer<typeof PowerpointTemplateConfigurationSchema>
export type PowerpointTemplateLayout = z.infer<typeof PowerpointTemplateLayoutSchema>
export type PowerpointTemplateElement = z.infer<typeof PowerpointTemplateElementSchema>
