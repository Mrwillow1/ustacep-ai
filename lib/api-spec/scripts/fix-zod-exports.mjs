import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const zodSource = path.resolve(import.meta.dirname, "../../api-zod/src");
const apiSource = await readFile(path.join(zodSource, "generated/api.ts"), "utf8");
const typeIndex = await readFile(path.join(zodSource, "generated/types/index.ts"), "utf8");

const schemaNames = new Set(
  [...apiSource.matchAll(/export const\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]),
);
const typeModules = [...typeIndex.matchAll(/export \* from ['"]\.\/([^'"]+)['"]/g)].map((match) => match[1]);
const typeNames = new Set();

for (const moduleName of typeModules) {
  const content = await readFile(path.join(zodSource, "generated/types", `${moduleName}.ts`), "utf8");
  for (const match of content.matchAll(/export (?:interface|type) ([A-Za-z0-9_]+)/g)) {
    if (!schemaNames.has(match[1])) typeNames.add(match[1]);
  }
}

const exports = [...typeNames].sort().join(",\n  ");
const barrel = `export * from "./generated/api";\n${exports ? `export type {\n  ${exports},\n} from "./generated/types";\n` : ""}`;
await writeFile(path.join(zodSource, "index.ts"), barrel);