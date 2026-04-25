import { readdir, readFile, stat } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const coreDist = new URL("packages/core/dist/", root);
const entries = await readdir(coreDist);
const files = entries.filter((entry) => entry.endsWith(".js"));
const forbidden = ["remark-parse", "remark-gfm", "unified", "commander", "tsx"];
let total = 0;

for (const file of files) {
  const path = new URL(file, coreDist);
  const text = await readFile(path, "utf8");
  const { size } = await stat(path);
  total += size;

  for (const token of forbidden) {
    if (text.includes(token)) {
      throw new Error(`Core dist contains forbidden dependency token: ${token}`);
    }
  }
}

const limit = 50_000;
if (total > limit) {
  throw new Error(`Core JavaScript output is ${total} bytes, above ${limit}.`);
}

console.log(`Core JavaScript output: ${total} bytes`);
