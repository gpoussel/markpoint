/**
 * Applies string interpolation to a template string using the provided data.
 * The template string should contain placeholders in the form of `{key}` where `key` is a key in the data object.
 * @param templateString The template string to interpolate.
 * @param data The data to use for interpolation.
 */
export function template(templateString: string, data: Record<string, string | number>): string {
  return templateString.replaceAll(/{([^{}]*)}/g, (match: string, key: string | undefined) => {
    if (!key || !(key in data)) {
      return match
    }
    return data[key]?.toString() ?? match
  })
}
