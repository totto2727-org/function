/*
 * This is a port of [neverthrow](https://github.com/supermacro/neverthrow)'s `safeUnwrap` and `safeTry` to [option-t](https://github.com/gcanti/option-t).
 *
 * https://github.com/supermacro/neverthrow/blob/master/tests/safe-try.test.ts
 *
 * MIT License
 *
 * Copyright (c) 2019 Giorgio Delgado
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { expect } from "jsr:@std/expect@1.0.16";
import { Result } from "../option-t.ts";
import { safeTry, safeUnwrap } from "./safe-try.ts";

Deno.test("Returns what is returned from the generator function", async (t) => {
  await t.step("With synchronous Ok", () => {
    // deno-lint-ignore require-yield
    const actual = Result.unwrapOk(safeTry(function* () {
      return Result.createOk("value");
    }));

    expect(actual).toBe("value");
  });

  await t.step("With synchronous Err", () => {
    // deno-lint-ignore require-yield
    const actual = Result.unwrapErr(safeTry(function* () {
      return Result.createErr("value");
    }));

    expect(actual).toBe("value");
  });

  await t.step("With async Ok", async () => {
    const actual = Result.unwrapOk(
      // deno-lint-ignore require-yield
      await safeTry(async function* () {
        return Result.createOk("value");
      }),
    );

    const expected = "value";

    expect(actual).toBe(expected);
  });

  await t.step("With async Err", async () => {
    const actual = Result.unwrapErr(
      // deno-lint-ignore require-yield
      await safeTry(async function* () {
        return Result.createErr("value");
      }),
    );

    expect(actual).toBe("value");
  });
});

Deno.test("Returns the first occurrence of Err instance as yield*'s operand", async (t) => {
  await t.step("Only synchronous", async (t) => {
    const okValues = Array<string>();

    const result = safeTry(function* () {
      const okFoo = yield* safeUnwrap(Result.createOk("foo"));
      okValues.push(okFoo);

      const okBar = yield* safeUnwrap(Result.createOk("bar"));
      okValues.push(okBar);

      yield* safeUnwrap(Result.createErr("err"));

      throw new Error("This line should not be executed");
    });

    await t.step("Run until Error", () => {
      const actual = okValues;
      const expected = ["foo", "bar"];
      expect(actual).toEqual(expected);
    });

    await t.step("Return Err", () => {
      const actual = Result.isErr(result);
      const expected = true;
      expect(actual).toBe(expected);
    });
  });

  await t.step("Only async", async (t) => {
    const okValues = Array<string>();

    const result = Result.unwrapErr(
      await safeTry(async function* () {
        const okFoo = yield* safeUnwrap(
          Promise.resolve(Result.createOk("foo")),
        );
        okValues.push(okFoo);

        const okBar = yield* safeUnwrap(
          Promise.resolve(Result.createOk("bar")),
        );
        okValues.push(okBar);

        yield* safeUnwrap(Promise.resolve(Result.createErr("err")));

        throw new Error("This line should not be executed");
      }),
    );

    await t.step("Run until Error", () => {
      const actual = okValues;
      const expected = ["foo", "bar"];
      expect(actual).toEqual(expected);
    });

    await t.step("Return Err", () => {
      const actual = result;
      const expected = "err";
      expect(actual).toBe(expected);
    });
  });

  await t.step(
    "Mix synchronous and async",
    async (t) => {
      const okValues = Array<string>();

      const result = Result.unwrapErr(
        await safeTry(async function* () {
          const okFoo = yield* safeUnwrap(
            Promise.resolve(Result.createOk("foo")),
          );
          okValues.push(okFoo);

          const okBar = yield* safeUnwrap(Result.createOk("bar"));
          okValues.push(okBar);

          yield* safeUnwrap(Result.createErr("err"));

          throw new Error("This line should not be executed");
        }),
      );

      await t.step("Run until Error", () => {
        const actual = okValues;

        const expected = ["foo", "bar"];
        expect(actual).toEqual(expected);
      });

      await t.step("Return Err", () => {
        const actual = result;

        const expected = "err";
        expect(actual).toBe(expected);
      });
    },
  );
});
