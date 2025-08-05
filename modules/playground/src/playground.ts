import { CommandDefinition, YargsCLI } from 'cli'
import { errorLike, errorPrinter, printer } from 'misc'

import { parseNumbers, StreamMedianCalculator } from './stream-median-calculator'

const commands: CommandDefinition[] = [
  {
    name: 'calc-median <numbers>',
    description: 'Calculate median of comma-separated numbers',
    handler: async argv => {
      try {
        const numbers = parseNumbers(argv.numbers as string)
        const calculator = new StreamMedianCalculator()
        calculator.addBatch(numbers)
        const median = calculator.findMedian()

        printer(`Numbers: [${numbers.join(', ')}]`)
        printer(`Median: ${median}`)
      } catch (err) {
        const error = `Error: ${err instanceof Error ? err.message : errorLike(err, 'Unknown error').message}`
        printer(error)
        throw new Error(`error while calculating median: ${error}`)
      }
    },
  },
]

export async function main(): Promise<void> {
  const cli = new YargsCLI()
  cli.registerCommands(...commands)
  await cli.run()
}

main().catch(e => {
  errorPrinter(
    `CLI Execution Error: terminated unexpectedly. Error: ${errorLike(e).message}`,
    'CLI Execution Error: terminated unexpectedly.',
  )
  // eslint-disable-next-line no-process-exit
  process.exit(1) // Explicitly exit with error code
})
