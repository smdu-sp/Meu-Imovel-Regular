import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { hash } from "./source.ts";
export type Doc = Record<string, unknown> & { id: number };
export type Entry = {
  id: number;
  hash: string;
  revision: unknown;
  source?: string;
};
export type State = {
  version: 1;
  target: string;
  snapshot: string;
  label: string;
  entries: Record<string, Entry>;
  pending?: string;
  reviews?: Record<string, string[]>;
};
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([k, v]) =>
            ![
              "id",
              "createdAt",
              "updatedAt",
              "url",
              "thumbnailURL",
              "sizes",
              "_isLocked",
              "_userEditing",
            ].includes(k) && v !== undefined,
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function projection(doc: Doc, collection: string) {
  const fields =
    collection === "pages"
      ? ["title", "slug", "layout", "seo", "_status", "lifecycleStatus"]
      : collection === "header"
        ? ["appearance", "logo", "navigationMode", "enableSearch", "navigation", "menuItems"]
      : collection === "media"
        ? [
            "title",
            "alt",
            "caption",
            "usage",
            "folder",
            "filename",
            "mimeType",
            "filesize",
          ]
        : ["name", "folder", "folderType", "tags"];
  return hash(
    JSON.stringify(
      canonical(Object.fromEntries(fields.map((k) => [k, doc[k] ?? null]))),
    ),
  );
}
export function assertIntact(doc: Doc, collection: string, entry: Entry) {
  if (
    doc.id !== entry.id ||
    projection(doc, collection) !== entry.hash ||
    doc.updatedAt !== entry.revision
  )
    throw new Error(`Conflito: ${collection} ID ${entry.id} foi alterado.`);
}
export function targetFingerprint(uri: string) {
  const u = new URL(uri);
  if (!["postgres:", "postgresql:"].includes(u.protocol))
    throw new Error("Destino precisa ser PostgreSQL.");
  return hash(
    JSON.stringify([
      u.hostname,
      u.port || "5432",
      u.pathname,
      u.searchParams.get("options") || "",
      u.searchParams.get("schema") || "public",
    ]),
  );
}
export async function openManifest(
  directory: string,
  target: string,
  label: string,
  snapshot: string,
) {
  await mkdir(directory, { recursive: true });
  const lock = path.join(directory, "execution.lock");
  const handle = await open(lock, "wx").catch(() => {
    throw new Error(
      "Estado em uso ou lock pendente. Verifique a execução anterior antes de remover o lock.",
    );
  });
  const file = path.join(directory, "manifest.json");
  try {
    let state: State;
    try {
      state = JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      state = { version: 1, target, label, snapshot, entries: {} };
    }
    if (
      state.version !== 1 ||
      state.target !== target ||
      state.snapshot !== snapshot
    )
      throw new Error(
        "Manifesto incompatível com destino, contrato ou snapshot.",
      );
    if (state.pending)
      throw new Error(
        `Operação indeterminada: ${state.pending}. Reconciliar antes de repetir.`,
      );
    const save = async () => {
      const tmp = file + ".tmp";
      await writeFile(tmp, JSON.stringify(state, null, 2) + "\n", {
        mode: 0o600,
      });
      await rename(tmp, file);
    };
    return {
      state,
      save,
      close: async () => {
        await handle.close();
        await unlink(lock);
      },
    };
  } catch (e) {
    await handle.close();
    await unlink(lock);
    throw e;
  }
}

export class RolledBack extends Error {}
