---
name: EAS monorepo pnpm builds
description: EAS Android builds for the nested Expo app must retain the repository workspace root while using the app as the build working directory.
---

EAS monorepo builds should source the repository root so the nested Expo app can resolve the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`; configure the workflow under the actual Expo project root, pass its app directory to `eas/build`, and pin a compatible PNPM version.

**Why:** A frozen pnpm install succeeds from the nested app when the workspace root is present, but fails with `ERR_PNPM_NO_LOCKFILE` when EAS packages only the app directory. PNPM 8 rejects this workspace's lockfile format, while the EAS SDK 54 image's PNPM 10.14.0 accepts it. A duplicate root workflow can hide fixes when EAS resolves the app-root workflow instead.

**How to apply:** Keep the monorepo root as the EAS source, update the workflow under the Expo app root, set `eas/build`'s `working_directory` to `.`, pin PNPM in the workflow and root `packageManager` metadata, and verify frozen install from that directory before rebuilding.