# Version Up

Update project version and create a release commit.

## Steps

1. Run `deno task precommit` to ensure code quality
2. Analyze recent commits to determine appropriate version bump (patch/minor/major)
3. Update `deno.json` version property accordingly
4. Create a commit with the version update and changelog

## Usage

Use this command when you want to bump the project version and create a release commit based on recent changes.

The command will automatically determine the appropriate semantic version bump based on commit history and conventional commit patterns.