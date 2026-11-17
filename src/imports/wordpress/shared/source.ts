import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const SNAPSHOT =
  "ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b";
export const hash = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");
export type Row = Record<string, string>;

// Lexer for the explicit-column VALUES format of this snapshot, never executable SQL.
export function* sqlRows(source: string, offset: number): Generator<string[]> {
  let i = offset;
  const fail = (): never => {
    throw new Error(`SQL inválido na posição ${i}.`);
  };
  const skip = () => {
    while (/\s/.test(source[i] || "") && i < source.length) i++;
  };
  while (i < source.length) {
    skip();
    if (source[i] === ";") return;
    if (source[i] === ",") {
      i++;
      skip();
    }
    if (source[i++] !== "(") fail();
    const row: string[] = [];
    for (;;) {
      skip();
      let value = "";
      if (source[i] === "'" || source[i] === '"') {
        const quote = source[i++];
        let closed = false;
        while (i < source.length) {
          const c = source[i++];
          if (c === "\\") {
            const next = source[i++];
            if (next === undefined) fail();
            value +=
              (
                {
                  n: "\n",
                  r: "\r",
                  t: "\t",
                  "0": "\0",
                  b: "\b",
                  Z: "\x1a",
                } as Record<string, string>
              )[next] ?? next;
          } else if (c === quote) {
            if (source[i] === quote) {
              value += quote;
              i++;
            } else {
              closed = true;
              break;
            }
          } else value += c;
        }
        if (!closed) fail();
      } else {
        const start = i;
        while (i < source.length && source[i] !== "," && source[i] !== ")") i++;
        value = source.slice(start, i).trim();
        if (!/^(?:NULL|-?\d+)$/.test(value)) fail();
      }
      row.push(value);
      skip();
      if (source[i] === ")") {
        i++;
        break;
      }
      if (source[i++] !== ",") fail();
    }
    yield row;
  }
  fail();
}
export function readTables(source: string): Record<string, Row[]> {
  const tables: Record<string, Row[]> = { wp_posts: [], wp_postmeta: [] };
  const header =
    /^(?:REPLACE|INSERT) INTO `(wp_posts|wp_postmeta)`\s*\(([^)]+)\)\s*VALUES\s*/gm;
  for (const match of source.matchAll(header)) {
    const columns = [...match[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    for (const values of sqlRows(source, match.index! + match[0].length)) {
      if (columns.length !== values.length)
        throw new Error("Quantidade de colunas SQL divergente.");
      tables[match[1]].push(
        Object.fromEntries(columns.map((name, i) => [name, values[i]])),
      );
    }
  }
  return tables;
}
export function exactly<T>(items: T[], label: string): T {
  if (items.length !== 1)
    throw new Error(`Origem ausente ou ambígua: ${label}.`);
  return items[0];
}
export async function safeAsset(root: string, relative: string) {
  const base = await realpath(root);
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes(".."))
    throw new Error("Asset fora de uploads.");
  const filename = await realpath(path.resolve(base, relative));
  if (!filename.startsWith(base + path.sep))
    throw new Error("Asset/symlink fora de uploads.");
  const data = await readFile(filename);
  const mimeType =
    data.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
        ? "image/jpeg"
        : data
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : null;
  if (!mimeType) throw new Error(`Assinatura não suportada: ${relative}`);
  return { filename, relative, hash: hash(data), mimeType, size: data.length };
}
export async function loadSource(
  filename: string,
  pageId = "87",
  expectedSections = 11,
) {
  const data = await readFile(filename);
  if (hash(data) !== SNAPSHOT)
    throw new Error(
      "Snapshot divergente: revalide a fonte e o mapeamento antes de aplicar.",
    );
  const tables = readTables(data.toString("utf8"));
  const post = exactly(
    tables.wp_posts.filter((p) => p.ID === pageId),
    `wp_posts ${pageId}`,
  );
  if (post.post_type !== "page" || post.post_status !== "publish")
    throw new Error(`Página de origem inesperada: ${pageId}.`);
  const meta = (id: string, key: string) =>
    exactly(
      tables.wp_postmeta.filter((m) => m.post_id === id && m.meta_key === key),
      `wp_postmeta ${id}/${key}`,
    );
  const lc = JSON.parse(meta(pageId, "dslc_code").meta_value);
  if (!Array.isArray(lc) || lc.length !== expectedSections)
    throw new Error(`Composição divergente: ${pageId}.`);
  return { post, meta, lc };
}
