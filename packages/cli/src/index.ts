import { PowerpointReader } from '@markpoint/powerpoint'
import { cac } from 'cac'

async function analyze(path: string) {
  const reader = new PowerpointReader()
  await reader.read(path)
}

async function main() {
  const cli = cac('markpoint-cli')

  cli.command('analyze <file>', 'analyze a POTX template file').action(async (file: string) => {
    await analyze(file)
  })
  cli.help()
  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
