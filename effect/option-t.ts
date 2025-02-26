/**
 * @module
 *
 * Converts Option-t's `Result` to Effect's `Exit`.
 *
 * @example
 * ```ts
 * import { fromResult } from "@totto/function/effect/option-t";
 *
 * const exit = fromResult(Result.createOk("success"));
 * // exit: Exit.Success("success")
 * ```
 */
import { Result } from "../option-t.ts";
import { Exit } from "../effect.ts";

/**
 * Converts an Option-t's `Result` object into an Effect's `Exit` object.
 */
export function fromResult<OK, ERR>(
  result: Result.Result<OK, ERR>,
): Exit.Exit<OK, ERR> {
  if (Result.isOk(result)) {
    return Exit.succeed(Result.unwrapOk(result));
  } else {
    return Exit.fail(Result.unwrapErr(result));
  }
}
