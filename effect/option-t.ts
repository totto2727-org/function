import { Result } from "../option-t.ts";
import { Exit } from "../effect.ts";

export function fromResult<OK, ERR>(
  result: Result.Result<OK, ERR>,
): Exit.Exit<OK, ERR> {
  if (Result.isOk(result)) {
    return Exit.succeed(Result.unwrapOk(result));
  } else {
    return Exit.fail(Result.unwrapErr(result));
  }
}
