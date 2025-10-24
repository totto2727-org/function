import { Cuid } from "npm:@typed/id@0.17.2";
import { Array, Context, Effect, Layer, Schema } from "../effect.ts";
// @ts-types="npm:@types/seedrandom@3.0.8"
import SR from "npm:seedrandom@3.0.5";
import BaseX from "npm:base-x@5.0.1";
import { init } from "npm:@paralleldrive/cuid2@3.1.0";

export { Cuid } from "npm:@typed/id@0.17.2";
export {
  createId,
  getConstants,
  init,
  isCuid,
} from "npm:@paralleldrive/cuid2@3.1.0";

const CUIDTagClass: Context.TagClass<
  CUID,
  "CUID",
  () => typeof Cuid.Type
> = Context.Tag("CUID")();

export class CUID extends CUIDTagClass {}

export const CUIDProductionLive: Layer.Layer<
  CUID,
  never,
  never
> = Layer.effect(
  CUID,
  // deno-lint-ignore require-yield
  Effect.gen(function* () {
    const createId = init();
    return () => Cuid.make(createId());
  }),
);

const CUIDSeedTagClass: Context.TagClass<
  CUIDSeed,
  "CUIDSeed",
  SR.PRNG
> = Context.Tag("CUIDSeed")();

export class CUIDSeed extends CUIDSeedTagClass {}

const base26 = BaseX("abcdefghijklmnopqrstuvwxyz");
const base36 = BaseX("0123456789abcdefghijklmnopqrstuvwxyz");
const decode = Schema.decodeSync(Cuid);

export const CUIDTestLive: Layer.Layer<CUID, never, CUIDSeed> = Layer.effect(
  CUID,
  Effect.gen(function* () {
    const seed = yield* CUIDSeed;
    return () => {
      const [r, ...rArray] = Array.makeBy(20, () => seed.int32());
      return decode(
        `${base26.encode([r])}${base36.encode(rArray)}`.substring(0, 24).padEnd(
          24,
          "0",
        ),
      );
    };
  }),
);

export function createCUIDSeed(
  seed: string,
): Layer.Layer<CUIDSeed, never, never> {
  return Layer.succeed(
    CUIDSeed,
    CUIDSeed.of(SR(seed)),
  );
}
