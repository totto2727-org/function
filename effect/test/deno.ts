// deno-lint-ignore-file no-namespace
import type {
  Duration,
  Effect,
  FastCheck as FC,
  Layer,
  Schema,
  Scope,
  TestServices,
} from "../../effect.ts";
import * as internal from "./deno.internal.ts";
import * as bdd from "../../test.ts";

bdd.configureGlobalSanitizers({
  sanitizeOps: false,
  sanitizeResources: false,
});

export * from "../../test.ts";

export type API = typeof bdd.test;

export namespace EffectDenoTest {
  export interface TestFunction<A, E, R, TestArgs extends Array<unknown>> {
    (...args: TestArgs): Effect.Effect<A, E, R>;
  }

  export interface Test<R> {
    <A, E>(
      name: string,
      self: TestFunction<A, E, R, [Deno.TestContext]>,
      timeout?: number,
    ): void;
  }

  export type Arbitraries =
    | Array<Schema.Schema.Any | FC.Arbitrary<unknown>>
    | { [K in string]: Schema.Schema.Any | FC.Arbitrary<unknown> };

  export interface Tester<R> extends EffectDenoTest.Test<R> {
    skip: EffectDenoTest.Test<R>;
    skipIf: (condition: boolean) => EffectDenoTest.Test<R>;
    runIf: (condition: boolean) => EffectDenoTest.Test<R>;
    only: EffectDenoTest.Test<R>;
    prop: <const Arbs extends Arbitraries, A, E>(
      name: string,
      arbitraries: Arbs,
      self: TestFunction<
        A,
        E,
        R,
        [
          {
            [K in keyof Arbs]: Arbs[K] extends FC.Arbitrary<infer T> ? T
              : Schema.Schema.Type<Arbs[K]>;
          },
          Deno.TestContext,
        ]
      >,
      timeout?:
        | number
        | {
          fastCheck?: FC.Parameters<
            {
              [K in keyof Arbs]: Arbs[K] extends FC.Arbitrary<infer T> ? T
                : Schema.Schema.Type<Arbs[K]>;
            }
          >;
        },
    ) => void;
  }

  export interface MethodsNonLive<R = never> extends API {
    readonly effect: EffectDenoTest.Tester<TestServices.TestServices | R>;
    readonly flakyTest: <A, E, R2>(
      self: Effect.Effect<A, E, R2>,
      timeout?: Duration.DurationInput,
    ) => Effect.Effect<A, never, R2>;
    readonly scoped: EffectDenoTest.Tester<
      TestServices.TestServices | Scope.Scope | R
    >;
    readonly layer: <R2, E>(layer: Layer.Layer<R2, E, R>, options?: {
      readonly timeout?: Duration.DurationInput;
    }) => {
      (f: (it: EffectDenoTest.MethodsNonLive<R | R2>) => void): void;
      (
        name: string,
        f: (it: EffectDenoTest.MethodsNonLive<R | R2>) => void,
      ): void;
    };

    readonly prop: <const Arbs extends Arbitraries>(
      name: string,
      arbitraries: Arbs,
      self: (
        properties: {
          [K in keyof Arbs]: Arbs[K] extends FC.Arbitrary<infer T> ? T
            : Schema.Schema.Type<Arbs[K]>;
        },
        ctx: Deno.TestContext,
      ) => void,
      timeout?:
        | number
        | {
          fastCheck?: FC.Parameters<
            {
              [K in keyof Arbs]: Arbs[K] extends FC.Arbitrary<infer T> ? T
                : Schema.Schema.Type<Arbs[K]>;
            }
          >;
        },
    ) => void;
  }

  export interface Methods<R = never> extends MethodsNonLive<R> {
    readonly live: EffectDenoTest.Tester<R>;
    readonly scopedLive: EffectDenoTest.Tester<Scope.Scope | R>;
  }
}

export const addEqualityTesters: () => void = internal.addEqualityTesters;

export const effect: EffectDenoTest.Tester<TestServices.TestServices> =
  internal.effect;

export const scoped: EffectDenoTest.Tester<
  TestServices.TestServices | Scope.Scope
> = internal.scoped;

export const live: EffectDenoTest.Tester<never> = internal.live;

export const scopedLive: EffectDenoTest.Tester<Scope.Scope> =
  internal.scopedLive;

/**
 * Share a `Layer` between multiple tests, optionally wrapping
 * the tests in a `describe` block if a name is provided.
 *
 * ```ts
 * import { expect, layer } from "@effect/vitest"
 * import { Context, Effect, Layer } from "effect"
 *
 * class Foo extends Context.Tag("Foo")<Foo, "foo">() {
 *   static Live = Layer.succeed(Foo, "foo")
 * }
 *
 * class Bar extends Context.Tag("Bar")<Bar, "bar">() {
 *   static Live = Layer.effect(
 *     Bar,
 *     Effect.map(Foo, () => "bar" as const)
 *   )
 * }
 *
 * layer(Foo.Live)("layer", (it) => {
 *   it.effect("adds context", () =>
 *     Effect.gen(function* () {
 *       const foo = yield* Foo
 *       expect(foo).toEqual("foo")
 *     })
 *   )
 *
 *   it.layer(Bar.Live)("nested", (it) => {
 *     it.effect("adds context", () =>
 *       Effect.gen(function* () {
 *         const foo = yield* Foo
 *         const bar = yield* Bar
 *         expect(foo).toEqual("foo")
 *         expect(bar).toEqual("bar")
 *       })
 *     )
 *   })
 * })
 * ```
 */
export const layer: <R, E>(
  layer_: Layer.Layer<R, E>,
  options?: {
    readonly memoMap?: Layer.MemoMap;
    readonly timeout?: Duration.DurationInput;
  },
) => {
  (f: (it: EffectDenoTest.MethodsNonLive<R>) => void): void;
  (name: string, f: (it: EffectDenoTest.MethodsNonLive<R>) => void): void;
} = internal.layer;

export const flakyTest: <A, E, R>(
  self: Effect.Effect<A, E, R>,
  timeout?: Duration.DurationInput,
) => Effect.Effect<A, never, R> = internal.flakyTest;

export const prop: EffectDenoTest.Methods["prop"] = internal.prop;

/** @ignored */
const methods = {
  effect,
  live,
  flakyTest,
  scoped,
  scopedLive,
  layer,
  prop,
} as const;

export const test: EffectDenoTest.Methods = Object.assign(bdd.test, methods);

export const it = test;

export const makeMethods: (test: typeof bdd.test) => EffectDenoTest.Methods =
  internal.makeMethods;

export const describeWrapped: (
  name: string,
  f: (it: EffectDenoTest.Methods) => void,
) => bdd.TestSuite<unknown> = internal.describeWrapped;
