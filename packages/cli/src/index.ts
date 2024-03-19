import fs from 'node:fs/promises'
import path from 'node:path'

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

  const sampleAuthor = 'Presentation Author'
  const sampleTitle = 'Lorem Ipsum Title'
  const sampleDate = '28/06/2024'
  await writer.generate(
    templatePath,
    {
      metadata: {
        company: 'Acme Inc.',
        author: sampleAuthor,
        title: sampleTitle,
        subject: 'Presentation Subject',
      },
      masterTexts: [
        {
          creationId: '{62086BA9-1591-C6CD-E573-A5F8961683B1}',
          content: [sampleTitle, sampleAuthor, sampleDate].join(' | '),
        },
      ],
      slides: [
        {
          copyOnSlide: 4,
          texts: [
            {
              creationId: '{6D871570-FBB8-F282-1B97-65C16AE6C6F4}',
              content: sampleTitle,
            },
            {
              creationId: '{4F18DD32-924E-CE9C-91B0-4F30CCE1B6F9}',
              content: 'Presentation Subtitle',
            },
          ],
        },
        ...[1, 2].flatMap((sectionNb) => {
          return [
            {
              copyOnSlide: 24,
              texts: [
                {
                  creationId: '{05383CED-A871-D722-5C38-FDB6D14AA784}',
                  content: `Section ${sectionNb}`,
                },
                {
                  creationId: '{4F2608E1-5E03-2C7E-434E-5BF07E81F24A}',
                  content: `Section ${sectionNb} subtitle`,
                },
              ],
              pictures: [
                {
                  creationId: '{7B4224E4-95EA-4DE2-B734-333DC4BF7A4F}',
                  path: path.join('__fixtures__', '3385x1905.png'),
                },
              ],
            },
            ...[1, 2].map((subsectionNb) => ({
              copyOnSlide: 21,
              texts: [
                {
                  creationId: '{4582957B-1559-50B8-87D1-3F29F9DD12B2}',
                  content: `Section ${sectionNb} – Page ${subsectionNb}`,
                },
                {
                  creationId: '{28862325-59A6-26E6-FB10-93F6B61575F0}',
                  content: `Subtitle of subsection ${subsectionNb}`,
                },
                {
                  creationId: '{0984FDF1-E23B-9E8F-73B5-6BF495603FA0}',
                  content: 'Unformatted content',
                },
              ],
            })),
          ]
        }),
        {
          copyOnSlide: 63,
        },
      ],
    },
    outputPath,
  )
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
