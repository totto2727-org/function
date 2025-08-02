# @totto/function

A comprehensive collection of TypeScript utilities and Effect ecosystem
integrations, optimized for modern JavaScript runtimes including Deno, Node.js,
Bun, and browsers.

## Installation

```bash
# Using JSR
npx jsr add @totto/function
yarn add jsr:@totto/function
pnpm add jsr:@totto/function
bun add @totto/function
deno add jsr:@totto/function
```

## Core Modules

### Effect Ecosystem

- **`effect`** - Core Effect library re-exports
- **`effect/ai`** - AI integrations for Anthropic and OpenAI
- **`effect/platform`** - Platform-specific implementations (Node.js, Bun,
  Browser)
- **`effect/test`** - Enhanced testing utilities for Deno and Vitest
- **`effect/rpc`** - Remote procedure call utilities
- **`effect/printer`** - Console printing and ANSI utilities
- **`effect/util`** - TypeScript type helpers and Effect utilities

### Utility Libraries

- **`type`** - Type-fest utilities for advanced TypeScript types
- **`option-t`** - Option-t library with Effect bridge functionality
- **`temporal`** - Temporal API utilities
- **`memo`** - Memoization utilities (moize)
- **`case`** - String case conversion utilities
- **`di`** - Dependency injection utilities (velona)
- **`test`** - Deno testing utilities

### TypeScript Configurations

- **`tsconfig/base`** - Base TypeScript configuration with strict settings
- **`tsconfig/node22`** - Node.js 22 optimized configuration
- **`tsconfig/node24`** - Node.js 24 optimized configuration
- **`tsconfig/react`** - React/Vite optimized configuration
- **`tsconfig/react-router`** - React Router/Remix optimized configuration
- **`tsconfig/expo`** - Expo/React Native optimized configuration

## Usage

### Type-safe Option Handling

```typescript
import { Option } from "@totto/function/option-t";
import { pipe } from "@totto/function/effect";

const result = pipe(
  Option.some(42),
  Option.map((x) => x * 2),
  Option.getOrElse(() => 0),
);
```

## License

MIT
