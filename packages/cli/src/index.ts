import { cac } from 'cac'

import { analyzePowerpoint } from './libs/commands/analyze-pptx.js'
import { convert } from './libs/commands/convert.js'
import { sampleMarkdownReading } from './libs/commands/demo-md.js'
import { samplePowerpointGeneration } from './libs/commands/demo-pptx.js'

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
    .command('demo-md <inputFile>', 'demonstrate capabilities of Markdown reading')
    .option('--output <outputFile>', 'output YAML file')
    .action(async (inputFile: string, options: { output: string | undefined }) => {
      await sampleMarkdownReading(inputFile, options.output)
    })
  const convertCommand = cli
    .command('convert', 'convert a Markdown document to a Powerpoint presentation using a template')
    .option('--template <templateFile>', 'template configuration (YAML file)')
    .option('--presentation <presentationFile>', 'presentation content (Markdown file)')
    .option('--output <outputFile>', 'output file (PPTX file)')
    .action(
      async (options: {
        template: string | undefined
        presentation: string | undefined
        output: string | undefined
      }) => {
        if (!options.template || !options.presentation || !options.output) {
          convertCommand.outputHelp()
          return
        }
        await convert(options.template, options.presentation, options.output)
      },
    )
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
