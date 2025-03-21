import { Effect, flow, Function } from "../effect.ts";

export const constVoidEffect = Function.constant(Effect.void);

export const asVoidEffect = <ARGS extends unknown[]>(
  fn: (...args: ARGS) => unknown,
) => flow(fn, constVoidEffect);
