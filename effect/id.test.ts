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
