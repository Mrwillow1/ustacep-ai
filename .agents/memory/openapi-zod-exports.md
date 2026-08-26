---
name: OpenAPI Zod export collisions
description: How to keep regenerated API Zod exports type-safe when schema and generated type names overlap.
---

The Zod generator can emit a runtime schema and a TypeScript interface with the same exported response name. Its generated barrel then conflicts under TypeScript's isolated module checks.

**Why:** Runtime Zod schemas and compile-time API types are both useful, but TypeScript cannot re-export same-named values and types from separate wildcard barrels.

**How to apply:** Keep OpenAPI code generation followed by the repository's Zod barrel post-processing step. It re-exports every generated Zod runtime schema and only type exports whose names do not conflict.