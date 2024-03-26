import {
  PowerpointWriter,
  type PowerpointGenerationConfiguration,
  type PowerpointSlidesConfiguration,
  type PresentationMetadata,
  type PowerpointPresentationDefinition,
  PresentationTheme,
} from '@markpoint/powerpoint'
import type { TemplateDefinition } from '@markpoint/shared'

const sampleAuthor = 'Presentation Author'
const sampleTitle = 'Lorem Ipsum Title'

const metadata: PresentationMetadata = {
  company: 'Acme Inc.',
  author: sampleAuthor,
  title: sampleTitle,
  subject: 'Presentation Subject',
}
const template: TemplateDefinition = {
  layouts: [
    {
      name: 'title',
      baseSlideNumber: 4,
      elements: [
        {
          type: 'text',
          creationId: '{6D871570-FBB8-F282-1B97-65C16AE6C6F4}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
        {
          type: 'text',
          creationId: '{4F18DD32-924E-CE9C-91B0-4F30CCE1B6F9}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
      ],
    },
    {
      name: 'sectionTitle',
      baseSlideNumber: 24,
      elements: [
        {
          type: 'text',
          creationId: '{05383CED-A871-D722-5C38-FDB6D14AA784}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
        {
          type: 'text',
          creationId: '{4F2608E1-5E03-2C7E-434E-5BF07E81F24A}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
        { type: 'picture', creationId: '{7B4224E4-95EA-4DE2-B734-333DC4BF7A4F}', path: '??' },
      ],
    },
    {
      name: 'contentSlide',
      baseSlideNumber: 21,
      elements: [
        {
          type: 'text',
          creationId: '{4582957B-1559-50B8-87D1-3F29F9DD12B2}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
        {
          type: 'text',
          creationId: '{28862325-59A6-26E6-FB10-93F6B61575F0}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
        {
          type: 'text',
          creationId: '{0984FDF1-E23B-9E8F-73B5-6BF495603FA0}',
          text: [{ text: '??', bold: false, italic: false, monospace: false }],
        },
      ],
    },
    {
      name: 'end',
      baseSlideNumber: 63,
      elements: [],
    },
  ],
  master: {
    elements: [
      {
        type: 'text',
        creationId: '{62086BA9-1591-C6CD-E573-A5F8961683B1}',
        text: [{ text: '??', bold: false, italic: false, monospace: false }],
      },
    ],
  },
}
const slides: PowerpointSlidesConfiguration[] = [
  /*
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
  {
    layout: 'sectionTitle',
    parts: [
      { name: 'title', content: { type: 'line', text: `Section 1` } },
      { name: 'subtitle', content: { type: 'line', text: `Section 1 subtitle` } },
      { name: 'background', content: { type: 'picture', path: path.join('__fixtures__', '3385x1905.png') } },
    ],
  },
  {
    layout: 'contentSlide',
    parts: [
      { name: 'title', content: { type: 'line', text: `Section 1 – Code` } },
      {
        name: 'content',
        content: {
          type: 'code',
          language: 'json',
          code: `{
// This is the basic data
"name": "John Doe",
"age": 35,
"city": "New York City",
"maritalInfo": {
  // Marital information
  "isMarried": true,		// ← Look at that; that's awesome
  "wifeName": "Jane Doe"
}
}`,
        },
      },
    ],
  },
  {
    layout: 'contentSlide',
    parts: [
      { name: 'title', content: { type: 'line', text: `Section 1 – List` } },
      { name: 'subtitle', content: { type: 'line', text: `Subtitle of list` } },
      {
        name: 'content',
        content: {
          type: 'list',
          items: [
            { text: `Outside bullet`, level: 0 },
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
  {
    layout: 'sectionTitle',
    parts: [
      { name: 'title', content: { type: 'line', text: `Section 2` } },
      { name: 'subtitle', content: { type: 'line', text: `Section 2 subtitle` } },
    ],
  },
  {
    layout: 'contentSlide',
    parts: [
      { name: 'title', content: { type: 'line', text: `Section 2 – Code` } },
      {
        name: 'content',
        content: {
          type: 'code',
          language: 'yaml',
          code: `---
doe: "a deer, a female deer"
ray: "a drop of golden sun"
pi: 3.14159
xmas: true
french-hens: 3
calling-birds:
- huey
- dewey
- louie
- fred`,
        },
      },
    ],
  },
  {
    layout: 'contentSlide',
    parts: [{ name: 'title', content: { type: 'line', text: `Section 2 – No content` } }],
  },
  {
    layout: 'end',
    parts: [],
  },
  */
]
const presentation: PowerpointPresentationDefinition = {
  slides,
}
const configuration: PowerpointGenerationConfiguration = {
  metadata,
  template,
  presentation,
}

export async function samplePowerpointGeneration(templatePath: string, outputPath: string) {
  const writer = new PowerpointWriter(
    new PresentationTheme(
      {
        monospace: 'Courier New',
      },
      {},
      {
        codeLines: 10,
      },
    ),
  )
  await writer.generate(templatePath, configuration, outputPath)
}
