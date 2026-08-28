---
name: EAS monorepo pnpm builds
description: EAS Android builds for the nested Expo app must retain the repository workspace root while using the app as the build working directory.
---

EAS monorepo builds should source the repository root so the nested Expo app can resolve the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`; configure the workflow under the actual Expo project root, pass its app directory to `eas/build`, and pin a compatible PNPM version.

**Why:** A frozen pnpm install succeeds from the nested app when the workspace root is present, but fails with `ERR_PNPM_NO_LOCKFILE` when EAS packages only the app directory. PNPM 8 rejects this workspace's lockfile format, while the EAS SDK 54 image's PNPM 10.14.0 accepts it. A duplicate root workflow can hide fixes when EAS resolves the app-root workflow instead. If EAS reports manifest specifiers absent from GitHub `main`, do not force the lockfile to match an unknown archive.

**How to apply:** Keep the monorepo root as the EAS source, update the workflow under the Expo app root, set `eas/build`'s `working_directory` to `.`, pin PNPM in the workflow and root `packageManager` metadata, and verify both the archive-reported manifest and frozen install before rebuilding.

Expo prebuild can add the Expo core packages to `dependencies` when they exist only in `devDependencies`, even with `--no-install`; in a pnpm workspace this changes the manifest seen by EAS before its frozen install. Keep `expo`, `react`, and `react-native` in `dependencies` with their existing specifiers and keep the importer categories aligned in the root lockfile. Use `--skip-dependency-update expo,react,react-native` to prevent template patch versions from replacing those specifiers.

**Why:** The native template carries its own recommended core dependency versions, so a managed prebuild can produce a temporary manifest that differs from the committed workspace manifest. A lockfile-only edit cannot represent both manifests without making the committed install stale.

**How to apply:** When a build reports a mismatch that appears only after `Creating native directory` / `Updating package.json`, inspect prebuild side effects first; do not manually replace the committed Expo or React specifiers with the template's patch versions.