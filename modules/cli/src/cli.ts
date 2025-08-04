import process from 'process'
import yargs, { ArgumentsCamelCase, CommandModule, Options as YargsOption } from 'yargs'
import { hideBin } from 'yargs/helpers'

/**
 * A command option used by the CLI.
 */
export interface CommandOption extends YargsOption {
  name: string
  /** If true or a string, makes this option required. */
  obligatory?: boolean | string
}

/**
 * Definition of a portable command. Supports raw builder or options array.
 */
export interface CommandDefinition {
  name: string
  description: string
  /** Structured options (flags) */
  options?: CommandOption[]
  /** Optional raw yargs builder for positionals or advanced config */
  builder?: (yargs: import('yargs').Argv) => import('yargs').Argv
  handler: CommandModule['handler']
}

/** Common CLI interface for both batch and interactive modes. */
export interface CLI {
  registerCommands(...commands: CommandDefinition[]): void
  run(args?: string[]): Promise<void>
}

export type YargsArgumentsCamelCase = ArgumentsCamelCase

/**
 * Yargs-based batch (static) CLI.
 */
export class YargsCLI implements CLI {
  private commands: CommandDefinition[] = []

  registerCommands(...commands: CommandDefinition[]): void {
    this.commands.push(...commands)
  }

  async run(args: string[] = process.argv): Promise<void> {
    process.exitCode = 0
    const parser = yargs(hideBin(args))

    for (const cmd of this.commands) {
      parser.command(
        cmd.name,
        cmd.description,
        cmd.builder
          ? cmd.builder
          : builder => {
              if (cmd.options) {
                for (const opt of cmd.options) {
                  builder.option(opt.name, opt)
                  if (opt.obligatory) {
                    builder.demandOption(opt.name, typeof opt.obligatory === 'string' ? opt.obligatory : undefined)
                  }
                }
              }
              return builder
            },
        async (argv: YargsArgumentsCamelCase) => {
          await cmd.handler(argv)
        },
      )
    }

    await parser.demandCommand(1).parseAsync()
  }
}
