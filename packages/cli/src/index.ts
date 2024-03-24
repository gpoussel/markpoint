import { Command, Option, Argument } from 'commander'

import { analyzePowerpoint } from './libs/commands/analyze-pptx.js'
import { convert } from './libs/commands/convert.js'
import { sampleMarkdownReading } from './libs/commands/demo-md.js'
import { samplePowerpointGeneration } from './libs/commands/demo-pptx.js'

async function main() {
  const program = new Command()
  program
    //
    .name('markpoint-cli')
    .description('Command_line tool for converting Markdown documents to Powerpoint presentations')
    .allowExcessArguments(false)

  program.addCommand(
    new Command('analyze-pptx')
      .description('Analyze a Powerpoint file')
      .addArgument(new Argument('<file>', 'Powerpoint file'))
      .addOption(new Option('--output <outputFile>', 'Output YAML file'))
      .action(async (file: string, options: { output: string | undefined }) => {
        await analyzePowerpoint(file, options.output)
      }),
  )

  program.addCommand(
    new Command('demo-pptx')
      .description('Demonstrate capabilities of Powerpoint generation')
      .addArgument(new Argument('<templateFile>', 'Template configuration (YAML file)'))
      .addArgument(new Argument('<outputFile>', 'Output file (PPTX file)'))
      .action(async (templateFile: string, outputFile: string) => {
        await samplePowerpointGeneration(templateFile, outputFile)
      }),
  )

  program.addCommand(
    new Command('demo-md')
      .description('Demonstrate capabilities of Markdown reading')
      .addArgument(new Argument('<inputFile>', 'Markdown file'))
      .addArgument(new Argument('<outputFile>', 'Output file (YAML file)'))
      .action(async (inputFile: string, options: { output: string | undefined }) => {
        await sampleMarkdownReading(inputFile, options.output)
      }),
  )

  program.addCommand(
    new Command('convert')
      .description('Convert a Markdown document to a Powerpoint presentation using a template')
      .addOption(new Option('--template <templateFile>', 'Template configuration (YAML file)'))
      .addOption(new Option('--presentation <presentationFile>', 'Presentation content (Markdown file)'))
      .addOption(new Option('--output <outputFile>', 'Presentation content (Markdown file)'))
      .action(async (options: { template: string; presentation: string; output: string }) => {
        await convert(options.template, options.presentation, options.output)
      }),
  )

  await program.parseAsync()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
