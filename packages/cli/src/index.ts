import { cac } from 'cac'

import { analyzePowerpoint } from './commands/analyze-pptx.js'
import { samplePowerpointGeneration } from './commands/demo-pptx.js'

async function main() {
  const cli = cac('markpoint-cli')

  cli
    .command('analyze <file>', 'analyze a Powerpoint file')
    .option('--output <outputFile>', 'output YAML file')
    .action(async (file: string, options: { output: string | undefined }) => {
      await analyzePowerpoint(file, options.output)
    })
  cli
    .command('demo <templateFile> <outputFile>', 'demonstrate capabilities of Powerpoint generation')
    .action(async (templateFile: string, outputFile: string) => {
      await samplePowerpointGeneration(templateFile, outputFile)
    })
  cli.help()
  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
