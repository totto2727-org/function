import { String } from "npm:effect@3.17.14";
import { expect } from "../test.ts";
import { Array, Effect } from "../effect.ts";
import * as CUID from "./cuid.ts";

Deno.test("generatorProductionLive", () => {
  Effect.gen(function* () {
    const makeCUID = yield* CUID.Generator;

    expect(yield* makeCUID).not.toBe(yield* makeCUID);
  }).pipe(Effect.provide(CUID.generatorProductionLive), Effect.runSync);
});

Deno.test("generatorTestLive", async (t) => {
  await t.step("Fixed", () => {
    Effect.gen(function* () {
      const makeCUID = yield* CUID.Generator;

      expect(yield* makeCUID).toBe("gk1pfmhav2vkvudlk25qrot8");
    }).pipe(
      Effect.provide(CUID.generatorTestLive),
      Effect.provide(CUID.createSeed("test")),
      Effect.runSync,
    );
  });

  await t.step("Snapshot", () => {
    Effect.gen(function* () {
      const makeCUID = yield* CUID.Generator;
      const actual = Array.makeBy(10, () => makeCUID.pipe(Effect.runSync));

      expect(actual).toEqual(
        [
          "gk1pfmhav2vkvudlk25qrot8",
          "dk3p231wqtob3kin8dt7p6sv",
          "p1o29mevenep5ehytgf7slsz",
          "cl2ag2azhfpn6gvbjiol9wrv",
          "fw2odl6k7umbv8kpyf1pl4vj",
          "gu480f94gvmqfx44ugeeaed7",
          "u8pozhspgav0zp048uvqw7im",
          "ci2whviybacarg4p69xnzdlg",
          "eh42helbpmmlw7jmco41rpcy",
          "dl1dsmlxhq6tba02sofl2apd",
        ],
      );
    }).pipe(
      Effect.provide(CUID.generatorTestLive),
      Effect.provide(CUID.createSeed("test")),
      Effect.runSync,
    );
  });
});

Deno.test("Cuid2", async (t) => {
  await t.step("cuid is string", () => {
    const id = CUID.init()();

    expect(String.isString(id)).toBeTruthy();
  });

  await t.step("cuid has default length", () => {
    const id = CUID.init()();
    const defaultLength = CUID.getDefaultConstants().defaultLength;

    expect(id.length).toBe(defaultLength);
  });

  await t.step("cuid has custom length", () => {
    const id = CUID.init({ length: 10 })();

    expect(id.length).toBe(10);
  });

  await t.step("cuid has large length", () => {
    const id = CUID.init({ length: 32 })();

    expect(id.length).toBe(32);
  });

  await t.step("cuid has length greater than maximum (33)", () => {
    expect(() => CUID.init({ length: 33 })()).toThrow(
      "Length must be between 2 and 32. Received: 33",
    );
  });

  await t.step("cuid has length much greater than maximum (100)", () => {
    expect(() => CUID.init({ length: 100 })()).toThrow(
      "Length must be between 2 and 32. Received: 100",
    );
  });
});

Deno.test("createCounter", () => {
  const counter = CUID.createCounter(10);

  expect([counter(), counter(), counter(), counter()]).toEqual([
    10,
    11,
    12,
    13,
  ]);
});

Deno.test("bufToBigInt", async (t) => {
  await t.step("empty Uint8Array", () => {
    expect(CUID.bufToBigInt(new Uint8Array(2)).toString()).toBe("0");
  });

  await t.step("maximum value Uint8Array", () => {
    expect(
      CUID.bufToBigInt(new Uint8Array([0xff, 0xff, 0xff, 0xff])).toString(),
    )
      .toBe("4294967295");
  });
});

Deno.test("createFingerprint", async (t) => {
  await t.step("no arguments", () => {
    const fingerprint = CUID.createFingerprint();

    expect(fingerprint.length).toBeGreaterThanOrEqual(24);
  });

  await t.step("globalObj is empty object", () => {
    const fingerprint = CUID.createFingerprint({ globalObj: {} });

    expect(fingerprint.length).toBeGreaterThanOrEqual(24);
  });
});

Deno.test("isCuid", async (t) => {
  await t.step("valid cuid", () => {
    expect(CUID.is(CUID.init()())).toBe(true);
  });

  await t.step("cuid is too long", () => {
    expect(CUID.is(CUID.init()() + CUID.init()() + CUID.init()())).toBe(
      false,
    );
  });

  await t.step("cuid is empty string", () => {
    expect(CUID.is("")).toBe(false);
  });

  await t.step("cuid is non-CUID string", () => {
    expect(CUID.is("42")).toBe(false);
  });

  await t.step("cuid is string with capital letters", () => {
    expect(CUID.is("aaaaDLL")).toBe(false);
  });

  await t.step("cuid is valid CUID2 string", () => {
    expect(CUID.is("yi7rqj1trke")).toBe(true);
  });

  await t.step("cuid is string with invalid characters", () => {
    expect(CUID.is("-x!ha")).toBe(false);
    expect(CUID.is("ab*%@#x")).toBe(false);
  });
});

Deno.test("CSPRNG", async (t) => {
  await t.step("multiple cuid2 calls", () => {
    const id1 = CUID.init()();
    const id2 = CUID.init()();

    expect(id1 !== id2).toBe(true);
  });

  await t.step("100 IDs generated with CSPRNG", () => {
    const ids = Array.makeBy(100, () => CUID.init()());
    const allValid = ids.every((id) => CUID.is(id));
    const allUnique = new Set(ids).size === ids.length;
    expect(allValid && allUnique).toBe(true);
  });
});
