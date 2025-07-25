import {
  Effect,
  flow,
  Function,
  type Schema,
  type SchemaAST,
} from "../effect.ts";

export const constVoidEffect: Function.LazyArg<
  Effect.Effect<void, never, never>
> = Function.constant(Effect.void);

export const asVoidEffect: <ARGS extends unknown[]>(
  fn: (...args: ARGS) => unknown,
) => (...a: ARGS) => Effect.Effect<void, never, never> = (
  fn,
) => flow(fn, constVoidEffect);

export type Create<S> = S extends Schema.Schema<infer A, infer I, never>
  ? (i: I, overrideOptions?: SchemaAST.ParseOptions) => A
  : never;
