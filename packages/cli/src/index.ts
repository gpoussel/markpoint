import fs from 'node:fs/promises'
import path from 'node:path'

import {
  PowerpointReader,
  PowerpointWriter,
  type PowerpointPresentationDefinition,
  type PresentationMetadata,
  type PresentationTemplateConfiguration,
  type PowerpointPartDefinition,
  type PowerpointSlidesConfiguration,
  type PowerpointGenerationConfiguration,
} from '@markpoint/powerpoint'
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
  const metadata: PresentationMetadata = {
    company: 'Acme Inc.',
    author: sampleAuthor,
    title: sampleTitle,
    subject: 'Presentation Subject',
  }
  const template: PresentationTemplateConfiguration = {
    layouts: [
      {
        name: 'title',
        baseSlideNumber: 4,
        parts: [
          { name: 'title', type: 'line', creationId: '{6D871570-FBB8-F282-1B97-65C16AE6C6F4}' },
          { name: 'subtitle', type: 'line', creationId: '{4F18DD32-924E-CE9C-91B0-4F30CCE1B6F9}' },
        ],
      },
      {
        name: 'sectionTitle',
        baseSlideNumber: 24,
        parts: [
          { name: 'title', type: 'line', creationId: '{05383CED-A871-D722-5C38-FDB6D14AA784}' },
          { name: 'subtitle', type: 'line', creationId: '{4F2608E1-5E03-2C7E-434E-5BF07E81F24A}' },
          { name: 'background', type: 'picture', creationId: '{7B4224E4-95EA-4DE2-B734-333DC4BF7A4F}' },
        ],
      },
      {
        name: 'contentSlide',
        baseSlideNumber: 21,
        parts: [
          { name: 'title', type: 'line', creationId: '{4582957B-1559-50B8-87D1-3F29F9DD12B2}' },
          { name: 'subtitle', type: 'line', creationId: '{28862325-59A6-26E6-FB10-93F6B61575F0}' },
          { name: 'content', type: 'text', creationId: '{0984FDF1-E23B-9E8F-73B5-6BF495603FA0}' },
        ],
      },
      {
        name: 'end',
        baseSlideNumber: 63,
        parts: [],
      },
    ],
    masterParts: [{ name: 'footer', type: 'line', creationId: '{62086BA9-1591-C6CD-E573-A5F8961683B1}' }],
  }
  const slides: PowerpointSlidesConfiguration[] = [
    {
      layout: 'title',
      parts: [
        {
          name: 'title',
          content: { type: 'line', text: sampleTitle },
        },
        {
          name: 'subtitle',
          content: { type: 'line', text: 'Presentation subtitle' },
        },
      ],
    },
    ...[1, 2].flatMap((sectionNb) => {
      return [
        {
          layout: 'sectionTitle',
          parts: [
            { name: 'title', content: { type: 'line', text: `Section ${sectionNb}` } },
            { name: 'subtitle', content: { type: 'line', text: `Section ${sectionNb} subtitle` } },
            { name: 'background', content: { type: 'picture', path: path.join('__fixtures__', '3385x1905.png') } },
          ],
        },
        ...[1, 2].flatMap((subSectionNb) => {
          return [
            {
              layout: 'contentSlide',
              parts: [
                { name: 'title', content: { type: 'line', text: `Section ${sectionNb} – Page ${subSectionNb}` } },
                { name: 'subtitle', content: { type: 'line', text: `Subtitle of subsection ${subSectionNb}` } },
                {
                  name: 'content',
                  content: {
                    type: 'list',
                    items: [
                      { text: `Outside bullet – Section ${sectionNb} – Page ${subSectionNb}`, level: 0 },
                      { text: 'First bullet 1', level: 1 },
                      { text: 'Inside bullet 1', level: 2 },
                      { text: 'Again bullet 1', level: 3 },
                      { text: 'Final bullet 1', level: 4 },
                      { text: 'Again bullet 2', level: 3 },
                      { text: 'Inside bullet 2', level: 2 },
                      { text: 'First bullet 2', level: 1 },
                      { text: 'Last paragraph', level: 0 },
                    ],
                  },
                },
              ],
            },
          ]
        }),
        {
          layout: 'contentSlide',
          parts: [{ name: 'title', content: { type: 'line', text: `Section ${sectionNb} – No content` } }],
        },
      ] as PowerpointSlidesConfiguration[]
    }),
    {
      layout: 'end',
      parts: [],
    },
  ]
  const master: PowerpointPartDefinition[] = [
    {
      name: 'footer',
      content: {
        type: 'line',
        text: [sampleTitle, sampleAuthor, sampleDate].join(' | '),
      },
    },
  ]
  const presentation: PowerpointPresentationDefinition = {
    master,
    slides,
  }
  const configuration: PowerpointGenerationConfiguration = {
    metadata,
    template,
    presentation,
  }
  await writer.generate(templatePath, configuration, outputPath)
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
