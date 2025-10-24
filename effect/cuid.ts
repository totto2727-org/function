/*
 * MIT License
 * Copyright (c) 2022 Eric Elliott
 * <https://github.com/paralleldrive/cuid2/blob/e2391a06836226249ed2ca1a287516d2c459dab7/LICENSE>
 * <https://github.com/paralleldrive/cuid2/blob/e2391a06836226249ed2ca1a287516d2c459dab7/src/index.js>
 */
import { sha3_512 } from "npm:@noble/hashes@2.0.1/sha3.js";
import BigNumber from "npm:bignumber.js@9.3.1";
import { Array, Context, Effect, Layer, Schema } from "npm:effect@3.17.14";
import SR from "npm:seedrandom@3.0.5";
import BaseX from "npm:base-x@5.0.1";
import type { ParseOptions } from "npm:effect@3.17.14/SchemaAST";

const defaultLength = 24;
const bigLength = 32;

export const schema: Schema.brand<
  Schema.filter<Schema.filter<Schema.filter<typeof Schema.String>>>,
  "@totto/function/effect/cuid/Cuid"
> = Schema.String.pipe(
  Schema.pattern(/^[a-z][0-9a-z]+$/),
  Schema.minLength(2),
  Schema.maxLength(bigLength),
  Schema.brand("@totto/function/effect/cuid/Cuid"),
);

export type CUID = typeof schema.Type;

export const is: (
  value: unknown,
  overrideOptions?: ParseOptions | number,
) => value is CUID = Schema.is(
  schema,
);

const decodeSync = Schema.decodeSync(schema);

export function getDefaultConstants(): {
  defaultLength: number;
  bigLength: number;
} {
  return { defaultLength, bigLength };
}

function createRandom(): number {
  // Generate a random 32-bit unsigned integer
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  // Convert to a float in [0, 1) by dividing by 2^32
  return buffer[0] / 0x100000000;
}

function createEntropy(length = 4, random = createRandom): string {
  let entropy = "";

  while (entropy.length < length) {
    entropy = entropy + Math.floor(random() * 36).toString(36);
  }
  return entropy;
}

/*
 * Adapted from https://github.com/juanelas/bigint-conversion
 * MIT License Copyright (c) 2018 Juan Hernández Serrano
 */
export function bufToBigInt(buf: Uint8Array): BigNumber {
  let value = new BigNumber(0);

  for (const i of buf.values()) {
    // Multiply by 256 (left shift by 8 bits) and add the current byte
    value = value.multipliedBy(256).plus(i);
  }
  return value;
}

function hash(input: string): string {
  // Drop the first character because it will bias the histogram
  // to the left.
  const encoder = new TextEncoder();
  return bufToBigInt(sha3_512(encoder.encode(input)))
    .toString(36)
    .slice(1);
}

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function randomLetter(rand: () => number): string {
  return alphabet[Math.floor(rand() * alphabet.length)];
}
/*
This is a fingerprint of the host environment. It is used to help
prevent collisions when generating ids in a distributed system.
If no global object is available, you can pass in your own, or fall back
on a random string.
*/
export function createFingerprint({
  globalObj = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
    ? window
    : {},
  random = createRandom,
}: {
  globalObj?: Record<string, unknown>;
  random?: () => number;
} = {}): string {
  const globals = Object.keys(globalObj).toString();
  const sourceString = globals.length
    ? globals + createEntropy(bigLength, random)
    : createEntropy(bigLength, random);

  return hash(sourceString).substring(0, bigLength);
}

export function createCounter(count: number): () => number {
  return () => {
    return count++;
  };
}

// ~22k hosts before 50% chance of initial counter collision
// with a remaining counter range of 9.0e+15 in JavaScript.
const initialCountMax = 476782367;

export function init({
  length = defaultLength,
}: {
  length?: number;
} = {}): () => CUID {
  const random = createRandom;
  const counter = createCounter(Math.floor(random() * initialCountMax));
  const fingerprint = createFingerprint({ random });

  if (length > bigLength) {
    throw new Error(
      `Length must be between 2 and ${bigLength}. Received: ${length}`,
    );
  }
  return function cuid2() {
    const firstLetter = randomLetter(random);

    // If we're lucky, the `.toString(36)` calls may reduce hashing rounds
    // by shortening the input to the hash function a little.
    const time = Date.now().toString(36);
    const count = counter().toString(36);

    // The salt should be long enough to be globally unique across the full
    // length of the hash. For simplicity, we use the same length as the
    // intended id output.
    const salt = createEntropy(length, random);
    const hashInput = `${time + salt + count + fingerprint}`;

    return decodeSync(`${firstLetter + hash(hashInput).substring(1, length)}`);
  };
}

const GeneratorClass: Context.TagClass<
  Generator,
  "@totto/function/effect/cuid/Generator",
  () => typeof schema.Type
> = Context.Tag("@totto/function/effect/cuid/Generator")();

export class Generator extends GeneratorClass {}

export const generatorProductionLive: Layer.Layer<
  Generator,
  never,
  never
> = Layer.effect(
  Generator,
  // deno-lint-ignore require-yield
  Effect.gen(function* () {
    return init();
  }),
);

const SeedClass: Context.TagClass<
  Seed,
  "@totto/function/effect/cuid/Seed",
  SR.PRNG
> = Context.Tag("@totto/function/effect/cuid/Seed")();

export class Seed extends SeedClass {}

const base26 = BaseX("abcdefghijklmnopqrstuvwxyz");
const base36 = BaseX("0123456789abcdefghijklmnopqrstuvwxyz");

export const generatorTestLive: Layer.Layer<Generator, never, Seed> = Layer
  .effect(
    Generator,
    Effect.gen(function* () {
      const seed = yield* Seed;
      return () => {
        const [r, ...rArray] = Array.makeBy(20, () => seed.int32());
        return decodeSync(
          `${base26.encode([r])}${base36.encode(rArray)}`.substring(0, 24)
            .padEnd(
              24,
              "0",
            ),
        );
      };
    }),
  );

export function createSeed(
  seed: string,
): Layer.Layer<Seed, never, never> {
  return Layer.succeed(
    Seed,
    Seed.of(SR(seed)),
  );
}
