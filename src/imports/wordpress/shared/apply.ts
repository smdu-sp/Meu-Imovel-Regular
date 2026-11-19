import { localizeSiteLinks, sitePages, type LinkAudit } from "./site-links.ts";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { homeData, type HomePlan } from "../pages/home.ts";
import {
  RolledBack,
  assertIntact,
  canonical,
  projection,
  type Doc,
  type State,
} from "./migration-manifest.ts";
import { hash } from "./source.ts";
export interface Store {
  find(collection: string, where: Record<string, unknown>): Promise<Doc[]>;
  get(collection: string, id: number, draft?: boolean): Promise<Doc>;
  getGlobal?(): Promise<Doc>;
  create(
    collection: string,
    data: Record<string, unknown>,
    file?: string,
  ): Promise<Doc>;
  update(id: number, data: Record<string, unknown>): Promise<Doc>;
  updateGlobal?(data: Record<string, unknown>): Promise<Doc>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
const collectionFor = (key: string) =>
  key.startsWith("page:")
    ? "pages"
    : key.startsWith("asset:")
      ? "media"
      : "payload-folders";
export type ImportPlan = {
  assets: HomePlan["assets"];
  sections: { url: string }[];
  cards: { url: string }[];
  pending?: readonly string[];
};
export type PageImport = {
  id: string;
  slug: string;
  folders: string[];
  build: (
    media: Record<string, number>,
    pages: Record<string, number>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  sourceFingerprint?: (data: Record<string, unknown>) => string;
};
export async function applyHome(
  plan: HomePlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "87",
    slug: "home",
    folders: ["MIR", "MIR/Home", "MIR/Home/Imagens", "MIR/Home/Manuais"],
    build: (media, pages) => homeData(plan, media, pages),
  });
}
export async function applyPage(
  plan: ImportPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
  page: PageImport,
) {
  const pageKey = "page:" + page.id;
  const relevant = new Set([
    pageKey,
    ...plan.assets.map((a) => "asset:" + a.id),
    ...page.folders.map((f) => "folder:" + f),
  ]);
  const check = async () => {
    for (const [key, entry] of Object.entries(state.entries)) {
      if (!relevant.has(key)) continue;
      const collection = collectionFor(key);
      const doc = await store.get(collection, entry.id, true);
      assertIntact(doc, collection, entry);
      if (collection === "pages") {
        if (doc._status !== "draft")
          throw new Error("Página publicada: importação recusada.");
        const published = await store.get("pages", entry.id, false);
        if (published._status === "published")
          throw new Error("Página já possui versão publicada.");
      }
      if (key.startsWith("asset:")) {
        const asset = plan.assets.find((a) => "asset:" + a.id === key);
        if (asset && asset.hash !== entry.source)
          throw new Error(`Asset alterado na origem: ${asset.id}`);
      }
    }
    const home = await store.find("pages", { slug: { equals: page.slug } });
    if (home.some((d) => d.id !== state.entries[pageKey]?.id))
      throw new Error(
        `${page.slug === "home" ? "Home" : page.slug} preexistente não gerenciada; nenhuma adoção automática.`,
      );
  };
  const pages: Record<string, number> = {};
  for (const slug of Object.keys(sitePages)) {
    const found = await store.find("pages", {
      slug: { equals: slug },
      lifecycleStatus: { equals: "active" },
    });
    if (found.length > 1) throw new Error("Destino interno ambíguo: " + slug);
    if (found[0]) pages[slug] = found[0].id;
  }
  state.reviews ??= {};
  state.reviews[page.id] = [
    ...(plan.pending || []),
    ...[...plan.sections, ...plan.cards]
      .filter((s) => !pages[new URL(s.url).pathname.replace(/^\/+|\/+$/g, "")])
      .map((s) => `Destino temporário no legado: ${s.url}`),
  ];
  const folderPaths = page.folders;
  // Full preflight, including folder ambiguity, before first mutation.
  await store.transaction(async () => {
    await check();
    const resolved: Record<string, number> = {};
    for (const folderPath of folderPaths) {
      const parentPath = folderPath.split("/").slice(0, -1).join("/");
      const parentEntry = state.entries["folder:" + parentPath];
      const parent = parentEntry?.id ?? resolved[parentPath];
      if (parentPath && parent === undefined) continue;
      const found = await store.find("payload-folders", {
        and: [
          { name: { equals: path.basename(folderPath) } },
          {
            folder: parentPath
              ? { equals: parentEntry?.id ?? parent }
              : { exists: false },
          },
        ],
      });
      if (
        found.length > 1 ||
        found.some(
          (d) =>
            !Array.isArray(d.folderType) || !d.folderType.includes("media"),
        )
      )
        throw new Error(`Pasta ambígua ou incompatível: ${folderPath}`);
      if (found[0]) resolved[folderPath] = found[0].id;
    }
  });
  const record = (key: string, doc: Doc, source?: string) => {
    state.entries[key] = {
      id: doc.id,
      hash: projection(doc, collectionFor(key)),
      revision: doc.updatedAt,
      source,
    };
  };
  const operation = async (
    key: string,
    fn: () => Promise<Doc>,
    source?: string,
  ) => {
    state.pending = key;
    await save();
    let doc: Doc;
    try {
      doc = await store.transaction(async () => {
        await check();
        return fn();
      });
    } catch (error) {
      if (error instanceof RolledBack) {
        delete state.pending;
        await save();
      }
      throw error;
    }
    record(key, doc, source);
    delete state.pending;
    await save();
    return doc.id;
  };
  for (const folderPath of folderPaths) {
    const key = "folder:" + folderPath;
    if (state.entries[key]) continue;
    const parentPath = folderPath.split("/").slice(0, -1).join("/");
    const parent = parentPath
      ? state.entries["folder:" + parentPath].id
      : undefined;
    await operation(key, async () => {
      const matches = await store.find("payload-folders", {
        and: [
          { name: { equals: path.basename(folderPath) } },
          { folder: parent ? { equals: parent } : { exists: false } },
        ],
      });
      if (
        matches.length > 1 ||
        matches.some(
          (d) =>
            !Array.isArray(d.folderType) || !d.folderType.includes("media"),
        )
      )
        throw new Error("Conflito de pasta.");
      return (
        matches[0] ??
        store.create("payload-folders", {
          name: path.basename(folderPath),
          folder: parent,
          folderType: ["media"],
        })
      );
    });
  }
  for (const asset of plan.assets) {
    const key = "asset:" + asset.id;
    if (state.entries[key]) continue;
    // Verify again immediately before upload (source files may change after planning).
    if (hash(await readFile(asset.filename)) !== asset.hash)
      throw new Error("Asset alterado após preflight.");
    await operation(
      key,
      () =>
        store.create(
          "media",
          {
            title: asset.title,
            alt: asset.alt,
            usage: asset.usage,
            folder: state.entries["folder:" + asset.folder].id,
          },
          asset.filename,
        ),
      asset.hash,
    );
  }
  const media = Object.fromEntries(
    plan.assets.map((a) => [a.id, state.entries["asset:" + a.id].id]),
  );
  const linkAudit: LinkAudit[] = [];
  const data = localizeSiteLinks(
    await page.build(media, pages),
    pages,
    linkAudit,
  );
  const key = pageKey;
  const inputHash = hash(
    page.sourceFingerprint
      ? page.sourceFingerprint(data)
      : JSON.stringify(data),
  );
  const entry = state.entries[key];
  if (entry) {
    const originalEntry = { ...entry };
    try {
      await store.transaction(async () => {
        await check();
        const current = await store.get("pages", entry.id, true);

        if (entry.source === inputHash) return;
        // Preserve block/item IDs by position while still comparing content without IDs.
        const retain = (next: unknown, old: unknown): unknown =>
          Array.isArray(next)
            ? next.map((v, i) =>
                retain(v, Array.isArray(old) ? old[i] : undefined),
              )
            : next && typeof next === "object"
              ? Object.fromEntries([
                  ...Object.entries(next).map(([k, v]) => [
                    k,
                    retain(
                      v,
                      old && typeof old === "object"
                        ? (old as Record<string, unknown>)[k]
                        : undefined,
                    ),
                  ]),
                  ...(old && typeof old === "object" && "id" in old
                    ? [["id", old.id]]
                    : []),
                ])
              : next;
        state.pending = key;
        await save();
        const doc = await store.update(
          entry.id,
          retain(data, current) as Record<string, unknown>,
        );
        record(key, doc, inputHash);
      });
    } catch (error) {
      if (error instanceof RolledBack) {
        state.entries[key] = originalEntry;
        delete state.pending;
        await save();
      }
      throw error;
    }
    if (state.pending) {
      delete state.pending;
      await save();
    }
  } else await operation(key, () => store.create("pages", data), inputHash);
  return {
    pageId: state.entries[key].id,
    media,
    pages,
    content: canonical(data),
    linkAudit,
  };
}
