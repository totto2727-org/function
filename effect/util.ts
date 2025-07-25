import {
  Effect,
  flow,
  Function,
  type Schema,
  type SchemaAST,
} from "../effect.ts";

export const constVoidEffect = Function.constant(Effect.void);

export const asVoidEffect = <ARGS extends unknown[]>(
  fn: (...args: ARGS) => unknown,
) => flow(fn, constVoidEffect);

export type Create<S> = S extends Schema.Schema<infer A, infer I, never>
  ? (i: I, overrideOptions?: SchemaAST.ParseOptions) => A
  : never;
