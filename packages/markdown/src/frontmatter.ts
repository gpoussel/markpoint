import type { Root, RootContent, Yaml } from 'mdast'
import YAML from 'yaml'
import z from 'zod'

import { extractFirst } from './utils'

const FrontmatterObjectType = z.object({
  company: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  issue: z.string().optional(),
  reference: z.string().optional(),
})

export type FrontmatterAttributes = z.infer<typeof FrontmatterObjectType>

export function extractFrontMatter(tree: Root) {
  const yamlNode = extractFirst(tree.children, (node: RootContent): node is Yaml => node.type === 'yaml', false)
  if (!yamlNode) {
    return
  }
  return FrontmatterObjectType.parse(
    YAML.parse(yamlNode.value, {
      strict: true,
      uniqueKeys: true,
    }),
  )
}
