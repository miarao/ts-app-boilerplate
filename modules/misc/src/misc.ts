export function printer(...args: unknown[]) {
  console.log(...args) // eslint-disable-line no-console
}

export function errorPrinter(...args: unknown[]) {
  console.error(...args) // eslint-disable-line no-console
}

/**
 * Checks, at compile time, that a certain situation cannot happen (and fail the build if it can). This is useful for
 * checking that all possible cases of a union type are handled.
 *
 * Typical usage pattern:
 *
 *   type X = 'A' | 'B'
 *
 *   function f(x: X) {
 *     if (x === 'a') {
 *       // do something ...
 *       return
 *     }
 *     if (x === 'b') {
 *       // do something ...
 *       return
 *     }
 *     shouldNeverHappen(x)
 *   }
 *
 *
 * If we ever change X such that it has a third case (as in `type X = 'A' | 'B' | 'C') we will get a compile error
 * unless we add logic to this function (`f()`) to handle it.
 *
 * @param n a value of type `never`
 */
export function shouldNeverHappen(n: never): never {
  return n
}

/**
 * An always-failing function. If it ever gets called, it will throw an error. It is useful in conditional expressions
 * in which one of the branches of the expression is the happy path, and the other branch is a sad path in which no
 * value can be computed. Sepcifically, it usually appears as the right-hand-side operand of `??` or `||` expressions.
 *
 * Typical usage pattern:
 *
 *    const dir: string = process.env['WORKING_DIR'] || failMe('missing env variable "a"')
 *
 * Essentially, this is a concise alternative to:
 *
 *    const dir = process.env['a']
 *    if (!dir) {
 *      throw new Error('missing env variable "a"')
 *    }
 *
 * @param hint an optional human-readable string to be placed in the message of the thrown error
 */
export function failMe(hint?: string): never {
  if (!hint) {
    throw new Error(`This expression must never be evaluated`)
  }

  throw new Error(`Unexpectedly evaluated an expression that must never be evaluated: ${hint}`)
}

/**
 * Evaluates just one of several functions (the `cases` parameter) based on the `selector` value passed in.
 * `cases` is a record of zero-argument functions. The function at `cases[selector]` will be evaluated and its return
 * value is returned back to the caller.
 *
 * A compile time error is produced if not all possible values of `selector` are covered by `cases`.
 *
 * Example:
 *    function f(op: '+' | '-' | '*', n1: number, n2: number) {
 *      return switchOn(op, {
 *        '+': () => n1 + n2,
 *        '-': () => n1 - n2,
 *        '*': () => n1 * n2,
 *      })
 *    }
 *
 *
 * The following snippet yields a compile-time error:
 *
 *    function f(op: '+' | '-' | '*', n1: number, n2: number) {
 *      return switchOn(op, {
 *        '+': () => n1 + n2,
 *        '-': () => n1 - n2,
 *      })   // <-- Compiler error here due to missing case ('*')
 *    }
 *
 * And so does this:
 *
 *    function f(op: '+' | '-' | '*', n1: number, n2: number) {
 *      return switchOn(op, {
 *        '+': () => n1 + n2,
 *        '-': () => n1 - n2,
 *        '*': () => n1 - n2,
 *        '/': () => n1 / n2,
 *      })   // <-- Compiler error here due to extraneous case ('/')
 *    }
 *
 * @param selector
 * @param cases
 * @returns
 */
export function switchOn<K extends string, G>(selector: K, cases: Record<K, () => G>): G {
  const f = cases[selector]
  return f()
}

/**
 * An interace describing the structure of typically thrown objects. It follows the structure of the Node's standard
 * error class but it also contains additional properties (such as `reason`) which are commonly found in thrown values.
 * The properties are all optional becuase Node does not require the thrown value to conform to any structure.
 */
interface ErrorLike extends Error {
  code: string
  message: string
  stack?: string
  reason?: string
}

/**
 * Safely converts an input of type `unknown` into an Error like object. The return value will contain `message`
 * and `stack` properties which will be strings (if a corresponding propertiy of type string exists on the
 * input) or undefined (otherwise). It will also contain an option `reason` property which is not part of the standard
 * `Error` class but is commonly found in thrown error objects.
 *
 * @param err an input of type `unknown`
 * @returns an Error like object, if fallback message is provided, message is set
 */
export function errorLike(err: unknown): ErrorLike
export function errorLike(err: unknown, fallbackMessage: string): ErrorLike & { message: string }
export function errorLike(err: unknown, fallbackMessage?: string): ErrorLike {
  const {
    code = 'UNKNOWN_ERROR',
    message = fallbackMessage ?? 'unknown error occurred',
    stack,
    reason,
  } = (err ?? {}) as ErrorLike
  return {
    name: 'ErrorLike',
    code,
    message,
    stack: typeof stack === 'string' ? stack : undefined,
    reason: typeof reason === 'string' ? reason : undefined,
  }
}

/**
 * Masks an email address by replacing all characters in the local part
 * (except for the first and last character) with exactly five asterisks.
 *
 * @param email - The email address to mask.
 * @returns The masked email address if it matches the email pattern, otherwise the original string.
 */
export function maskEmail(email: string): string {
  // Regular expression to capture:
  // - The first character of the local part
  // - The middle of the local part (which we ignore)
  // - The last character of the local part
  // - The domain part
  const emailRegex = /^(.)(.*?)(.)@(.+)$/
  const match = email.match(emailRegex)

  if (!match) {
    // If the input doesn't match the expected email pattern, return it unmodified.
    return email
  }

  const firstChar = match[1]
  const lastChar = match[3]
  const domain = match[4]

  // Return the masked email with exactly five '*' characters
  return `${firstChar}*****${lastChar}@${domain}`
}
