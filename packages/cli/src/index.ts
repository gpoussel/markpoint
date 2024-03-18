import fs from 'node:fs/promises'

import { PowerpointReader, PowerpointWriter } from '@markpoint/powerpoint'
import { cac } from 'cac'

async function analyze(path: string, outputPath: string | undefined) {
  const reader = new PowerpointReader()
  const template = await reader.read(path)

  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(template, undefined, 2), 'utf8')
  } else {
    for (const masterSlide of template.slides) {
      // eslint-disable-next-line no-console
      console.log(masterSlide)
    }
  }
}

async function sampleGeneration(templatePath: string, outputPath: string) {
  const writer = new PowerpointWriter()
  await writer.generate(templatePath, outputPath)
}

async function main() {
  const cli = cac('markpoint-cli')

  cli
    .command('analyze <file>', 'analyze a Powerpoint file')
    .option('--output <outputFile>', 'output YAML file')
    .action(async (file: string, options: { output: string | undefined }) => {
      await analyze(file, options.output)
    })
  cli
    .command('demo <templateFile> <outputFile>', 'demonstrate capabilities of Powerpoint generation')
    .action(async (templateFile: string, outputFile: string) => {
      await sampleGeneration(templateFile, outputFile)
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
