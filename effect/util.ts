import {
  Array,
  Effect,
  flow,
  Function,
  Option,
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

export type EffectFnSuccess<
  // deno-lint-ignore no-explicit-any
  FN extends (...args: any[]) => Effect.Effect<any, any, any>,
> = Effect.Effect.Success<ReturnType<FN>>;

export type EffectFnError<
  // deno-lint-ignore no-explicit-any
  FN extends (...args: any[]) => Effect.Effect<any, any, any>,
> = Effect.Effect.Error<ReturnType<FN>>;

export type EffectFnContext<
  // deno-lint-ignore no-explicit-any
  FN extends (...args: any[]) => Effect.Effect<any, any, any>,
> = Effect.Effect.Context<ReturnType<FN>>;

export type EffectFn<
  // deno-lint-ignore no-explicit-any
  ARGS extends Schema.Schema<any, any, never>,
  // deno-lint-ignore no-explicit-any
  RETURNED extends Effect.Effect<any, any, any>,
> = (args: ARGS["Type"]) => RETURNED;

export const nonEmptyArrayOrNone = <const T>(
  args: T[],
): Option.Option<Array.NonEmptyArray<T>> => {
  return Array.isNonEmptyArray(args) ? Option.some(args) : Option.none();
};
