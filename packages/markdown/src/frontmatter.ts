import type { Root, Yaml } from 'mdast'
import YAML from 'yaml'
import z from 'zod'

const FrontmatterObjectType = z.object({
  company: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  issue: z.string().optional(),
  reference: z.string().optional(),
})

export type FrontmatterAttributes = z.infer<typeof FrontmatterObjectType>

export function extractFrontMatter(tree: Root) {
  const children = tree.children
  const firstChildren = children[0]
  if (!firstChildren) {
    // Document is empty: no frontmatter
    return
  }
  if ((firstChildren.type as string) !== 'yaml') {
    // No YAML frontmatter
    return
  }
  const yamlNode = tree.children.shift() as Yaml
  return FrontmatterObjectType.parse(
    YAML.parse(yamlNode.value, {
      strict: true,
      uniqueKeys: true,
    }),
  )
}
