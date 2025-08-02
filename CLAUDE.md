# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

This project is a Deno-based TypeScript library. Use the following commands:

```bash
# Code quality check, format, and lint
deno task fix

# Run tests
deno task test

# Build (dry-run publish)
deno task build

# Full check (precommit)
deno task precommit
```

Individual commands:

- `deno check **/*.ts` - TypeScript type checking
- `deno fmt` - Code formatting
- `deno lint` - Linting
- `deno test **/*.test.ts` - Run unit test files

## Codebase Architecture

### Project Structure

- **Root Level**: Main export files for each functional area
  - `effect.ts` - Effect library re-exports
  - `type.ts` - Type-fest utilities
  - `option-t.ts` - Option-t utilities
  - `temporal.ts`, `memo.ts`, `case.ts`, `di.ts`, etc.

- **effect/ Directory**: Effect ecosystem-related utilities
  - `ai/` - AI integrations (Anthropic, OpenAI)
  - `platform/` - Platform-specific implementations (Node.js, Bun, Browser)
  - `test/` - Testing utilities (Deno, Vitest support)
  - `rpc/`, `printer/` - Specialized features

### Key Design Patterns

1. **Re-export Strategy**: Each module provides external library re-exports +
   custom utilities
2. **JSR Support**: Explicit module publishing via `deno.json` exports
3. **Effect Integration**: Bridge functionality between Effect library ecosystem
   and Option-t library
4. **Test Isolation**: Effect-specific test utilities (including TestClock leak
   mitigation)

### Commit Conventions

- Use Conventional Commits format
- Write commit messages in English
- Examples: `feat: add non empty array helper`, `fix: improve slow types`

### Development Notes

- Effect library version is pinned to 3.17.1
- Optimized for Deno and JSR ecosystem
- `effect/test/deno.ts` disables sanitizers for TestClock leak mitigation
- Rich TypeScript type helpers (see `effect/util.ts`)
