import { type Cause, Exit, Function } from "../effect.ts";
import { Result } from "../option-t.ts";

function fromExit_<OK, ERR_IN, ERR_OUT>(
  exit: Exit.Exit<OK, ERR_IN>,
  f: (value: Cause.Cause<ERR_IN>) => ERR_OUT,
): Result.Result<OK, ERR_OUT> {
  if (Exit.isSuccess(exit)) {
    return Result.createOk(exit.value);
  } else {
    return Result.createErr(f(exit.cause));
  }
}

export const fromExit: {
  <OK, ERR_IN, ERR_OUT>(
    exit: Exit.Exit<OK, ERR_IN>,
    f: (value: Cause.Cause<ERR_IN>) => ERR_OUT,
  ): Result.Result<OK, ERR_OUT>;
  <ERR_IN, ERR_OUT>(
    f: (value: Cause.Cause<ERR_IN>) => ERR_OUT,
  ): <OK>(exit: Exit.Exit<OK, ERR_IN>) => Result.Result<OK, ERR_OUT>;
} = Function.dual(2, fromExit_);
