import { expect } from "../test.ts";
import { Cause, Exit } from "../effect.ts";
import { Result } from "../option-t.ts";
import { fromExit } from "./effect.ts";

Deno.test("Convert Success type to Ok", async (t) => {
  await t.step("Data First", () => {
    const actual = fromExit(
      Exit.succeed("success value"),
      (cause) => cause,
    );

    const expected = Result.createOk("success value");
    expect(actual).toEqual(expected);
  });

  await t.step("Data Last", () => {
    const fn = fromExit(
      (cause) => cause,
    );
    const actual = fn(Exit.succeed("success value"));

    const expected = Result.createOk("success value");
    expect(actual).toEqual(expected);
  });
});

Deno.test("Convert Failure type to Err", async (t) => {
  await t.step("Data First", () => {
    const actual = fromExit(
      Exit.fail("error message"),
      (cause) => Cause.squash(cause),
    );

    const expected = Result.createErr("error message");
    expect(actual).toEqual(expected);
  });

  await t.step("Data Last", () => {
    const fn = fromExit(
      (cause) => Cause.squash(cause),
    );
    const actual = fn(Exit.fail("error message"));

    const expected = Result.createErr("error message");
    expect(actual).toEqual(expected);
  });
});
