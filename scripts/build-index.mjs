#!/usr/bin/env node
// 生成 `personas.json`：人设库的**索引文件**。
//
// 为什么要有这个文件：Metis 导入时要先知道"仓库里有哪些人设"。
// 用 GitHub 的 contents API 查一次就要消耗一次限流额度（未认证 60/小时），
// 而 `raw.githubusercontent.com` 是 CDN，没有这个限制 ——
// 所以把"有哪些文件"预先算好放进一个静态文件，客户端只下载、不查 API。
//
// 这个脚本由 `.github/workflows/index.yml` 在每次 push 时自动跑，
// 不需要人工维护。

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const PERSONA_DIR = join(ROOT, "personas");

/// 人设文件名 → 是否是文档（README/LICENSE 之类不是人设）。
function isDocumentation(stem) {
  return [
    "readme", "license", "licence", "changelog", "contributing",
    "notice", "authors", "code_of_conduct", "security",
  ].includes(stem.toLowerCase());
}

/// 从 front-matter 里读一个键（只支持顶层的 `key: value`）。
function frontMatter(text, key) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const line = match[1].split(/\r?\n/).find((l) => l.startsWith(`${key}:`));
  if (!line) return null;
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

/// 收集所有 .md，跳过文档文件。
function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collect(full));
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    if (isDocumentation(entry.name.slice(0, -3))) continue;
    out.push(full);
  }
  return out;
}

if (!statSync(PERSONA_DIR, { throwIfNoEntry: false })) {
  console.error("找不到 personas/ 目录");
  process.exit(1);
}

const personas = collect(PERSONA_DIR)
  .map((file) => {
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).split(sep).join("/");
    return {
      id: frontMatter(text, "id") || file.split(sep).pop().replace(/\.md$/, ""),
      name: frontMatter(text, "name") || null,
      description: frontMatter(text, "description") || null,
      file: rel,
      bytes: Buffer.byteLength(text, "utf8"),
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

// 重复 id 是错误：客户端按 id 去重，重复会悄悄丢掉一份。
const seen = new Set();
for (const p of personas) {
  if (seen.has(p.id)) {
    console.error(`重复的 id：${p.id}`);
    process.exit(1);
  }
  seen.add(p.id);
}

const index = {
  v: 1,
  description: "Metis 人设库索引。由 scripts/build-index.mjs 自动生成，不要手改。",
  count: personas.length,
  personas,
};

writeFileSync(join(ROOT, "personas.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`personas.json：${personas.length} 份人设`);
for (const p of personas) console.log(`  ${p.id.padEnd(12)} ${p.file}`);