import type * as EffectDenoTest from "./deno.ts";
import * as bdd from "../../test.ts";
import * as expect from "../../test.ts";
import {
  Arbitrary,
  Cause,
  Duration,
  Effect,
  Equal,
  Exit,
  FastCheck as FC,
  Fiber,
  flow,
  Function,
  Layer,
  Logger,
  pipe,
  Schedule,
  Schema,
  Scope,
  TestContext,
  type TestServices,
  Utils,
} from "../../effect.ts";

const runPromise = () => <E, A>(effect: Effect.Effect<A, E>) =>
  Effect.gen(function* () {
    const exitFiber = yield* Effect.fork(Effect.exit(effect));

    const exit = yield* Fiber.join(exitFiber);

    yield* Fiber.interrupt(exitFiber).pipe(
      Effect.asVoid,
    );

    if (Exit.isSuccess(exit)) {
      return () => exit.value;
    } else {
      const errors = Cause.prettyErrors(exit.cause);
      for (let i = 1; i < errors.length; i++) {
        yield* Effect.logError(errors[i]);
      }
      return () => {
        throw errors[0];
      };
    }
  }).pipe(Effect.runPromise).then((f) => f());

/** @internal */
const runTest = () => <E, A>(effect: Effect.Effect<A, E>) =>
  runPromise()(effect);

/** @internal */
const TestEnv = TestContext.TestContext.pipe(
  Layer.provide(Logger.remove(Logger.defaultLogger)),
);

/** @internal */
type Tester = (
  this: TesterContext,
  a: unknown,
  b: unknown,
  customTesters: Array<Tester>,
) => boolean | undefined;

/** @internal */
type TesterContext = {
  equals: (
    a: unknown,
    b: unknown,
    customTesters?: Array<Tester>,
    strictCheck?: boolean,
  ) => boolean;
};

/** @internal */
function customTester(
  this: TesterContext,
  a: unknown,
  b: unknown,
) {
  if (!Equal.isEqual(a) || !Equal.isEqual(b)) {
    return undefined;
  }
  return Utils.structuralRegion(
    () => Equal.equals(a, b),
    (x, y) => this.equals(x, y),
  );
}

/** @internal */
export const addEqualityTesters = () => {
  expect.expect.addEqualityTesters([customTester]);
};

/** @internal */
const makeTester = <R>(
  mapEffect: <A, E>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, never>,
  test: typeof bdd.test = bdd.test,
): EffectDenoTest.EffectDenoTest.Tester<R> => {
  const run = <A, E, TestArgs extends Array<unknown>>(
    args: TestArgs,
    self: EffectDenoTest.EffectDenoTest.TestFunction<A, E, R, TestArgs>,
  ) => pipe(Effect.suspend(() => self(...args)), mapEffect, runTest());

  const f: EffectDenoTest.EffectDenoTest.Test<R> = (name, self) =>
    test({
      name,
      fn: (ctx) => {
        run([ctx], self);
      },
    });

  const skip: EffectDenoTest.EffectDenoTest.Tester<R>["only"] = (name, self) =>
    test.ignore({
      name,
      fn: (ctx) => {
        run([ctx], self);
      },
    });

  const skipIf: EffectDenoTest.EffectDenoTest.Tester<R>["skipIf"] =
    (condition) => (name, self) =>
      test(
        {
          name,
          ignore: condition,
          fn: (ctx) => {
            run([ctx], self);
          },
        },
      );

  const runIf: EffectDenoTest.EffectDenoTest.Tester<R>["runIf"] =
    (condition) => (name, self) =>
      test({
        name,
        ignore: !condition,
        fn: (ctx) => {
          run([ctx], self);
        },
      });

  const only: EffectDenoTest.EffectDenoTest.Tester<R>["only"] = (name, self) =>
    test({
      name,
      only: true,
      fn: (ctx) => {
        run([ctx], self);
      },
    });

  const prop: EffectDenoTest.EffectDenoTest.Tester<R>["prop"] = (
    name,
    arbitraries,
    self,
  ) => {
    if (Array.isArray(arbitraries)) {
      const arbs = arbitraries.map((arbitrary) =>
        Schema.isSchema(arbitrary) ? Arbitrary.make(arbitrary) : arbitrary
      );
      return test(
        name,
        (ctx) =>
          FC.assert(
            FC.asyncProperty(
              // @ts-ignore -- TODO
              ...arbs,
              // @ts-ignore -- TODO
              (...as) => run([as as unknown, ctx], self),
            ),
          ),
      );
    }

    const arbs = FC.record(
      Object.keys(arbitraries).reduce(function (result, key) {
        result[key] = Schema.isSchema(arbitraries[key])
          ? Arbitrary.make(arbitraries[key])
          : arbitraries[key];
        return result;
      }, {} as Record<string, FC.Arbitrary<unknown>>),
    );

    return test(
      name,
      (ctx) =>
        FC.assert(
          FC.asyncProperty(arbs, (...as) =>
            // @ts-ignore -- TODO
            run([as[0] as unknown, ctx], self)),
        ),
    );
  };

  return Object.assign(f, { skip, skipIf, runIf, only, prop });
};

export const prop: EffectDenoTest.EffectDenoTest.Methods["prop"] = (
  name,
  arbitraries,
  self,
) => {
  if (Array.isArray(arbitraries)) {
    const arbs = arbitraries.map((arbitrary) =>
      Schema.isSchema(arbitrary) ? Arbitrary.make(arbitrary) : arbitrary
    );
    return bdd.test(
      name,
      (ctx) =>
        FC.assert(
          // @ts-ignore -- TODO
          FC.property(...arbs, (...as) => self(as, ctx)),
        ),
    );
  }

  const arbs = FC.record(
    Object.keys(arbitraries).reduce(function (result, key) {
      result[key] = Schema.isSchema(arbitraries[key])
        ? Arbitrary.make(arbitraries[key])
        : arbitraries[key];
      return result;
    }, {} as Record<string, FC.Arbitrary<unknown>>),
  );

  return bdd.test(
    name,
    (ctx) =>
      FC.assert(
        // @ts-ignore -- TODO
        FC.property(arbs, (as) => self(as, ctx)),
      ),
  );
};

/** @internal */
export const layer = <R, E>(layer_: Layer.Layer<R, E>, options?: {
  readonly memoMap?: Layer.MemoMap;
  readonly timeout?: Duration.DurationInput;
}): {
  (f: (it: EffectDenoTest.EffectDenoTest.MethodsNonLive<R>) => void): void;
  (
    name: string,
    f: (it: EffectDenoTest.EffectDenoTest.MethodsNonLive<R>) => void,
  ): void;
} =>
(
  ...args: [
    name: string,
    f: (it: EffectDenoTest.EffectDenoTest.MethodsNonLive<R>) => void,
  ] | [
    f: (it: EffectDenoTest.EffectDenoTest.MethodsNonLive<R>) => void,
  ]
) => {
  const withTestEnv = Layer.provideMerge(layer_, TestEnv);
  const memoMap = options?.memoMap ?? Effect.runSync(Layer.makeMemoMap);
  const scope = Effect.runSync(Scope.make());
  const runtimeEffect = Layer.toRuntimeWithMemoMap(withTestEnv, memoMap).pipe(
    Scope.extend(scope),
    Effect.orDie,
    Effect.cached,
    Effect.runSync,
  );

  const makeIt = (
    test: typeof bdd.test,
  ): EffectDenoTest.EffectDenoTest.MethodsNonLive<R> =>
    Object.assign(test, {
      effect: makeTester<TestServices.TestServices | R>(
        (effect) =>
          Effect.flatMap(
            runtimeEffect,
            (runtime) => effect.pipe(Effect.provide(runtime)),
          ),
        test,
      ),

      prop,

      scoped: makeTester<TestServices.TestServices | Scope.Scope | R>(
        (effect) =>
          Effect.flatMap(runtimeEffect, (runtime) =>
            effect.pipe(
              Effect.scoped,
              Effect.provide(runtime),
            )),
        test,
      ),
      flakyTest,
      layer<R2, E2>(nestedLayer: Layer.Layer<R2, E2, R>, options?: {
        readonly timeout?: Duration.DurationInput;
      }) {
        return layer(Layer.provideMerge(nestedLayer, withTestEnv), {
          ...options,
          memoMap,
        });
      },
    });

  if (args.length === 1) {
    bdd.beforeAll(
      () => runPromise()(Effect.asVoid(runtimeEffect)),
    );
    bdd.afterAll(
      () => runPromise()(Scope.close(scope, Exit.void)),
    );
    return args[0](makeIt(bdd.test));
  }

  return bdd.describe(args[0], () => {
    bdd.beforeAll(
      () => runPromise()(Effect.asVoid(runtimeEffect)),
    );
    bdd.afterAll(
      () => runPromise()(Scope.close(scope, Exit.void)),
    );
    return args[1](makeIt(bdd.test));
  });
};

/** @internal */
export const flakyTest = <A, E, R>(
  self: Effect.Effect<A, E, R>,
  timeout: Duration.DurationInput = Duration.seconds(30),
) =>
  pipe(
    Effect.catchAllDefect(self, Effect.fail),
    Effect.retry(
      pipe(
        Schedule.recurs(10),
        Schedule.compose(Schedule.elapsed),
        Schedule.whileOutput(Duration.lessThanOrEqualTo(timeout)),
      ),
    ),
    Effect.orDie,
  );

/** @internal */
export const makeMethods = (
  test: typeof bdd.test,
): EffectDenoTest.EffectDenoTest.Methods =>
  Object.assign(test, {
    effect: makeTester<TestServices.TestServices>(
      Effect.provide(TestEnv),
      test,
    ),
    scoped: makeTester<TestServices.TestServices | Scope.Scope>(
      flow(Effect.scoped, Effect.provide(TestEnv)),
      test,
    ),
    live: makeTester<never>(Function.identity, test),
    scopedLive: makeTester<Scope.Scope>(Effect.scoped, test),
    flakyTest,
    layer,
    prop,
  });

export const {
  /** @internal */
  effect,
  /** @internal */
  live,
  /** @internal */
  scoped,
  /** @internal */
  scopedLive,
} = makeMethods(bdd.test);

/** @internal */
export const describeWrapped = (
  name: string,
  f: (test: EffectDenoTest.EffectDenoTest.Methods) => void,
): bdd.TestSuite<unknown> => bdd.describe(name, () => f(makeMethods(bdd.test)));
