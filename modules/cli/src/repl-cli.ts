import { printer } from 'misc'
import process from 'process'
import readline from 'readline'
import type { ArgumentsCamelCase } from 'yargs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { CLI, CommandDefinition, YargsArgumentsCamelCase } from './cli'

/** Session abstraction for interactive prompts. */
export interface InteractiveSession {
  begin(): Promise<void>
  inform(message: string): void
  ask(promptMessage: string, processFn: (userInput: string) => Promise<string>): Promise<string>
  finish(): Promise<void>
}

/** Base REPL implementation using readline and yargs. */
export class ReplCli implements InteractiveSession {
  private rl: readline.Interface | null = null
  private timeoutMs = 30000

  async begin(): Promise<void> {
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  }
  inform(message: string): void {
    printer(message)
  }
  ask(promptMessage: string, processFn: (userInput: string) => Promise<string>): Promise<string> {
    if (!this.rl) {
      throw new Error('Session not started')
    }
    return new Promise((resolve, reject) => {
      this.rl!.question(promptMessage, userInput => {
        const timer = setTimeout(() => {
          clearTimeout(timer)
          reject(new Error('Response timed out'))
        }, this.timeoutMs)

        processFn(userInput)
          .then(answer => {
            clearTimeout(timer)
            resolve(answer)
          })
          .catch(err => {
            clearTimeout(timer)
            reject(err)
          })
      })
    })
  }
  async finish(): Promise<void> {
    this.rl?.close()
    this.rl = null
  }
}

/** REPL‑style CLI: prompts user, parses each line with yargs, invokes handlers. */
export class REPLCLI extends ReplCli implements CLI {
  private commands: CommandDefinition[] = []

  registerCommands(...commands: CommandDefinition[]): void {
    this.commands.push(...commands)
  }

  async run(_args: string[] = process.argv): Promise<void> {
    await this.begin()
    this.inform("Interactive CLI started. Type 'exit' or 'quit' to end the session.")

    while (true) {
      try {
        const input = await this.ask('>> ', async val => val)
        const trimmed = input.trim()
        if (/^(exit|quit)$/i.test(trimmed)) {
          break
        }
        if (!trimmed) {
          continue
        }

        const argv = trimmed.split(/\s+/)
        const parser = yargs(hideBin(argv)).exitProcess(false)

        for (const cmd of this.commands) {
          parser.command({
            command: cmd.name,
            describe: cmd.description,
            builder: cmd.builder
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
            handler: async (argv: ArgumentsCamelCase) => {
              await cmd.handler(argv as YargsArgumentsCamelCase)
            },
          })
        }

        await parser.help(false).parseAsync()
      } catch (err) {
        this.inform(err instanceof Error ? `Error: ${err.message}` : `Error: ${String(err)}`)
      }
    }

    await this.finish()
  }
}
