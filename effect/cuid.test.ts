import { String } from "npm:effect@3.17.14";
import {
  bufToBigInt,
  createCounter,
  createFingerprint,
  getDefaultConstants,
  init,
  isCUID,
} from "./cuid.ts";
import { expect } from "../test.ts";
import { Array, Effect } from "../effect.ts";
import {
  createCUIDSeed,
  CUID,
  CUIDProductionLive,
  CUIDTestLive,
} from "./id.ts";

Deno.test("CUIDProductionLive", () => {
  Effect.gen(function* () {
    const makeCUID = yield* CUID;

    expect(makeCUID()).not.toBe(makeCUID());
  }).pipe(Effect.provide(CUIDProductionLive), Effect.runSync);
});

Deno.test("CUIDTestLive", async (t) => {
  await t.step("Fixed", () => {
    Effect.gen(function* () {
      const makeCUID = yield* CUID;

      expect(makeCUID()).toBe("gk1pfmhav2vkvudlk25qrot8");
    }).pipe(
      Effect.provide(CUIDTestLive),
      Effect.provide(createCUIDSeed("test")),
      Effect.runSync,
    );
  });

  await t.step("Snapshot", () => {
    Effect.gen(function* () {
      const makeCUID = yield* CUID;
      const actual = Array.makeBy(10, () => makeCUID());

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
      Effect.provide(CUIDTestLive),
      Effect.provide(createCUIDSeed("test")),
      Effect.runSync,
    );
  });
});

Deno.test("Cuid2", async (t) => {
  await t.step("cuid is string", () => {
    const id = init()();

    expect(String.isString(id)).toBeTruthy();
  });

  await t.step("cuid has default length", () => {
    const id = init()();
    const defaultLength = getDefaultConstants().defaultLength;

    expect(id.length).toBe(defaultLength);
  });

  await t.step("cuid has custom length", () => {
    const id = init({ length: 10 })();

    expect(id.length).toBe(10);
  });

  await t.step("cuid has large length", () => {
    const id = init({ length: 32 })();

    expect(id.length).toBe(32);
  });

  await t.step("cuid has length greater than maximum (33)", () => {
    expect(() => init({ length: 33 })()).toThrow(
      "Length must be between 2 and 32. Received: 33",
    );
  });

  await t.step("cuid has length much greater than maximum (100)", () => {
    expect(() => init({ length: 100 })()).toThrow(
      "Length must be between 2 and 32. Received: 100",
    );
  });
});

Deno.test("createCounter", () => {
  const counter = createCounter(10);

  expect([counter(), counter(), counter(), counter()]).toEqual([
    10,
    11,
    12,
    13,
  ]);
});

Deno.test("bufToBigInt", async (t) => {
  await t.step("empty Uint8Array", () => {
    expect(bufToBigInt(new Uint8Array(2)).toString()).toBe("0");
  });

  await t.step("maximum value Uint8Array", () => {
    expect(bufToBigInt(new Uint8Array([0xff, 0xff, 0xff, 0xff])).toString())
      .toBe("4294967295");
  });
});

Deno.test("createFingerprint", async (t) => {
  await t.step("no arguments", () => {
    const fingerprint = createFingerprint();

    expect(fingerprint.length).toBeGreaterThanOrEqual(24);
  });

  await t.step("globalObj is empty object", () => {
    const fingerprint = createFingerprint({ globalObj: {} });

    expect(fingerprint.length).toBeGreaterThanOrEqual(24);
  });
});

Deno.test("isCuid", async (t) => {
  await t.step("valid cuid", () => {
    expect(isCUID(init()())).toBe(true);
  });

  await t.step("cuid is too long", () => {
    expect(isCUID(init()() + init()() + init()())).toBe(false);
  });

  await t.step("cuid is empty string", () => {
    expect(isCUID("")).toBe(false);
  });

  await t.step("cuid is non-CUID string", () => {
    expect(isCUID("42")).toBe(false);
  });

  await t.step("cuid is string with capital letters", () => {
    expect(isCUID("aaaaDLL")).toBe(false);
  });

  await t.step("cuid is valid CUID2 string", () => {
    expect(isCUID("yi7rqj1trke")).toBe(true);
  });

  await t.step("cuid is string with invalid characters", () => {
    expect(isCUID("-x!ha")).toBe(false);
    expect(isCUID("ab*%@#x")).toBe(false);
  });
});

Deno.test("CSPRNG", async (t) => {
  await t.step("multiple cuid2 calls", () => {
    const id1 = init()();
    const id2 = init()();

    expect(id1 !== id2).toBe(true);
  });

  await t.step("100 IDs generated with CSPRNG", () => {
    const ids = Array.makeBy(100, () => init()());
    const allValid = ids.every((id) => isCUID(id));
    const allUnique = new Set(ids).size === ids.length;
    expect(allValid && allUnique).toBe(true);
  });
});
