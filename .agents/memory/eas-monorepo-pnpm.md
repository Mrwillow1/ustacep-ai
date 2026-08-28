---
name: EAS monorepo pnpm builds
description: EAS Android builds for the nested Expo app must retain the repository workspace root while using the app as the build working directory.
---

EAS monorepo builds should source the repository root so the nested Expo app can resolve the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`; pass the app directory directly to the `eas/build` function group rather than relying only on `defaults.run`.

**Why:** A frozen pnpm install succeeds from the nested app when the workspace root is present, but fails with `ERR_PNPM_NO_LOCKFILE` when EAS packages only the app directory. The app also relies on workspace and catalog specifiers that make a standalone lockfile unreliable.

**How to apply:** Keep the monorepo root as the EAS source, set `eas/build`'s `working_directory` to the nested app path, pin the PNPM tool when needed, and verify frozen install from that directory before rebuilding.