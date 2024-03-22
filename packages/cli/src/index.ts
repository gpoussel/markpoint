import { cac } from 'cac'

import { analyzePowerpoint } from './commands/analyze-pptx.js'
import { sampleMarkdownReading } from './commands/demo-md.js'
import { samplePowerpointGeneration } from './commands/demo-pptx.js'

async function main() {
  const cli = cac('markpoint-cli')

  cli
    .command('analyze-pptx <file>', 'analyze a Powerpoint file')
    .option('--output <outputFile>', 'output YAML file')
    .action(async (file: string, options: { output: string | undefined }) => {
      await analyzePowerpoint(file, options.output)
    })
  cli
    .command('demo-pptx <templateFile> <outputFile>', 'demonstrate capabilities of Powerpoint generation')
    .action(async (templateFile: string, outputFile: string) => {
      await samplePowerpointGeneration(templateFile, outputFile)
    })
  cli
    .command('demo-md <inputFile> <outputFile>', 'demonstrate capabilities of Markdown reading')
    .action(async (inputFile: string, outputFile: string) => {
      await sampleMarkdownReading(inputFile, outputFile)
    })
  cli.help()
  cli.parse(process.argv, { run: false })
  if (!cli.matchedCommand) {
    cli.outputHelp()
    process.exit(1)
  }
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
