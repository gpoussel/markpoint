import type { Root, RootContent, Yaml } from 'mdast'
import YAML from 'yaml'

import { FrontmatterObjectType } from './types'
import { extractFirst } from './utils'

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
