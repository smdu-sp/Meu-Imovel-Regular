import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Store } from "../shared/apply.ts";
import {
  assertIntact,
  canonical,
  projection,
  RolledBack,
  type Doc,
  type State,
} from "../shared/migration-manifest.ts";
import {
  exactly,
  hash,
  readTables,
  safeAsset,
  SNAPSHOT,
  type Row,
} from "../shared/source.ts";
import { headerAssets, headerMenu } from "./header-content.ts";

const folders = ["MIR", "MIR/Compartilhado", "MIR/Compartilhado/Identidade"];
const identityFolder = folders[2];
const globalKey = "global:header";

const metaFor = (tables: Record<string, Row[]>, postId: string, key: string) =>
  exactly(
    tables.wp_postmeta.filter((row) => row.post_id === postId && row.meta_key === key),
    `wp_postmeta ${postId}/${key}`,
  );

export function extractHeaderMenu(tables: Record<string, Row[]>) {
  const option = exactly(
    tables.wp_options.filter(
      (row) => row.option_id === "233" && row.option_name === "theme_mods_lc-blank-master",
    ),
    "opção do menu principal",
  );
  if (!/s:13:"dslc_mainmenu";i:3;/.test(option.option_value))
    throw new Error("Localização do menu principal divergente.");
  const taxonomy = exactly(
    tables.wp_term_taxonomy.filter((row) => row.term_taxonomy_id === "3"),
    "taxonomia do menu principal",
  );
  if (taxonomy.taxonomy !== "nav_menu" || taxonomy.count !== "5")
    throw new Error("Taxonomia do menu principal divergente.");
  const memberIds = tables.wp_term_relationships
    .filter((row) => row.term_taxonomy_id === "3")
    .map((row) => row.object_id);
  if (
    memberIds.length !== headerMenu.length ||
    new Set(memberIds).size !== headerMenu.length ||
    headerMenu.some((item) => !memberIds.includes(item.id))
  )
    throw new Error("Itens do menu principal divergentes.");

  return headerMenu.map((expected) => {
    const item = exactly(
      tables.wp_posts.filter((row) => row.ID === expected.id),
      `item do menu ${expected.id}`,
    );
    if (
      item.post_type !== "nav_menu_item" ||
      item.post_status !== "publish" ||
      item.menu_order !== String(expected.order)
    )
      throw new Error(`Ordem ou estado do menu divergente: ${expected.id}.`);
    if (
      metaFor(tables, expected.id, "_menu_item_type").meta_value !== "post_type" ||
      metaFor(tables, expected.id, "_menu_item_object").meta_value !== "page" ||
      metaFor(tables, expected.id, "_menu_item_menu_item_parent").meta_value !== "0" ||
      metaFor(tables, expected.id, "_menu_item_object_id").meta_value !== expected.pageId
    )
      throw new Error(`Destino do menu divergente: ${expected.id}.`);
    const page = exactly(
      tables.wp_posts.filter((row) => row.ID === expected.pageId),
      `página de menu ${expected.pageId}`,
    );
    if (
      page.post_type !== "page" ||
      page.post_status !== "publish" ||
      page.post_name !== expected.slug
    )
      throw new Error(`Página de menu divergente: ${expected.pageId}.`);
    const label = item.post_title.trim() || page.post_title.trim();
    if (label !== expected.label)
      throw new Error(`Rótulo do menu divergente: ${expected.id}.`);
    return {
      id: expected.id,
      order: expected.order,
      pageId: expected.pageId,
      slug: expected.slug,
      label,
    };
  });
}

export async function planHeader(source: string, uploads: string) {
  const bytes = await readFile(source);
  if (hash(bytes) !== SNAPSHOT)
    throw new Error("Snapshot divergente: revalide a fonte e o mapeamento antes de aplicar.");
  const tables = readTables(bytes.toString("utf8"));
  const post = exactly(tables.wp_posts.filter((row) => row.ID === "100"), "Header 100");
  if (post.post_type !== "dslc_hf" || post.post_status !== "publish" || post.post_title !== "Header")
    throw new Error("Template Header divergente.");
  const meta = metaFor(tables, "100", "dslc_code");
  if (meta.meta_id !== "4075") throw new Error("Composição Header divergente.");
  const layout = JSON.parse(meta.meta_value);
  if (!Array.isArray(layout) || layout.length !== 1 || layout[0]?.content?.length !== 4)
    throw new Error("Estrutura Header divergente.");
  const areas = layout[0].content as Array<{ size?: string; content?: Record<string, string>[] }>;
  const expectedModules = ["DSLC_Html", "DSLC_Image", "DSLC_Navigation", "DSLC_Image"];
  const expectedSizes = ["12", "2", "8", "2"];
  for (let index = 0; index < areas.length; index++) {
    if (
      areas[index].size !== expectedSizes[index] ||
      areas[index].content?.length !== 1 ||
      areas[index].content?.[0]?.module_id !== expectedModules[index]
    )
      throw new Error(`Área do Header divergente: ${index}.`);
  }
  if (
    areas[1].content?.[0]?.image !== "356" ||
    areas[2].content?.[0]?.location !== "dslc_mainmenu" ||
    areas[3].content?.[0]?.image !== "1183"
  )
    throw new Error("Logos ou menu do Header divergentes.");
  const menu = extractHeaderMenu(tables);
  const assets = await Promise.all(headerAssets.map(async (asset) => {
    const attachment = exactly(
      tables.wp_posts.filter((row) => row.ID === asset.id),
      `anexo ${asset.id}`,
    );
    if (
      attachment.post_type !== "attachment" ||
      attachment.post_mime_type !== "image/png" ||
      metaFor(tables, asset.id, "_wp_attached_file").meta_value !== asset.relative
    )
      throw new Error(`Anexo do Header divergente: ${asset.id}.`);
    const file = await safeAsset(uploads, asset.relative);
    if (file.hash !== asset.hash || file.size !== asset.size || file.mimeType !== "image/png")
      throw new Error(`Arquivo do Header divergente: ${asset.id}.`);
    return { ...asset, ...file, usage: "content" as const, folder: identityFolder };
  }));
  return { assets, menu, postId: "100", metaId: "4075", folders };
}

export type HeaderPlan = Awaited<ReturnType<typeof planHeader>>;

export function headerData(
  plan: HeaderPlan,
  media: Record<string, number>,
  pages: Record<string, number>,
) {
  return {
    appearance: { scheme: "default" },
    logo: media["356"],
    navigationMode: "normal",
    enableSearch: false,
    navigation: plan.menu.map((item) => ({ label: item.label, page: pages[item.slug] })),
    menuItems: [],
  };
}

function pristineHeader(doc: Doc) {
  const appearance = doc.appearance as { scheme?: string; colors?: Record<string, unknown> } | undefined;
  return (
    !doc.logo &&
    (!Array.isArray(doc.navigation) || doc.navigation.length === 0) &&
    (!Array.isArray(doc.menuItems) || doc.menuItems.length === 0) &&
    (!doc.navigationMode || doc.navigationMode === "normal") &&
    !doc.enableSearch &&
    (!appearance?.scheme || appearance.scheme === "default") &&
    !Object.values(appearance?.colors || {}).some(Boolean)
  );
}

export async function applyHeader(
  plan: HeaderPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  if (!store.getGlobal || !store.updateGlobal)
    throw new Error("Sessão de importação sem suporte ao Header Global.");
  const getGlobal = store.getGlobal;
  const updateGlobal = store.updateGlobal;
  const relevant = new Set([
    globalKey,
    ...folders.map((folder) => `folder:${folder}`),
    ...plan.assets.map((asset) => `asset:${asset.id}`),
  ]);
  const check = async () => {
    const pages: Record<string, number> = {};
    for (const item of plan.menu) {
      const found = await store.find("pages", {
        slug: { equals: item.slug },
        lifecycleStatus: { equals: "active" },
      });
      if (found.length !== 1)
        throw new Error(`Página necessária ausente ou ambígua: ${item.slug}.`);
      pages[item.slug] = found[0].id;
    }
    const current = await getGlobal();
    const entry = state.entries[globalKey];
    if (entry) assertIntact(current, "header", entry);
    else if (!pristineHeader(current))
      throw new Error("Header preexistente não gerenciado; edição manual preservada.");
    for (const [key, record] of Object.entries(state.entries)) {
      if (!relevant.has(key) || key === globalKey) continue;
      const collection = key.startsWith("asset:") ? "media" : "payload-folders";
      assertIntact(await store.get(collection, record.id, true), collection, record);
      if (collection === "media") {
        const asset = plan.assets.find((candidate) => `asset:${candidate.id}` === key);
        if (asset && asset.hash !== record.source)
          throw new Error(`Asset alterado na origem: ${asset.id}.`);
      }
    }
    return { pages, current };
  };

  // Resolve every required Page and check existing folders before the first write.
  await store.transaction(async () => {
    await check();
    const resolved: Record<string, number> = {};
    for (const folder of folders) {
      const parentPath = folder.split("/").slice(0, -1).join("/");
      const parent = parentPath
        ? state.entries[`folder:${parentPath}`]?.id ?? resolved[parentPath]
        : undefined;
      if (parentPath && parent === undefined) continue;
      const found = await store.find("payload-folders", {
        and: [
          { name: { equals: path.basename(folder) } },
          { folder: parentPath ? { equals: parent } : { exists: false } },
        ],
      });
      if (
        found.length > 1 ||
        found.some((doc) => !Array.isArray(doc.folderType) || !doc.folderType.includes("media"))
      )
        throw new Error(`Pasta ambígua ou incompatível: ${folder}.`);
      if (found[0]) resolved[folder] = found[0].id;
    }
  });
  const record = (key: string, doc: Doc, source?: string) => {
    state.entries[key] = {
      id: doc.id,
      hash: projection(doc, key === globalKey ? "header" : key.startsWith("asset:") ? "media" : "payload-folders"),
      revision: doc.updatedAt,
      source,
    };
  };
  const operation = async (key: string, action: () => Promise<Doc>, source?: string) => {
    state.pending = key;
    await save();
    try {
      const doc = await store.transaction(async () => {
        await check();
        return action();
      });
      record(key, doc, source);
      delete state.pending;
      await save();
      return doc;
    } catch (error) {
      if (error instanceof RolledBack) {
        delete state.pending;
        await save();
      }
      throw error;
    }
  };

  for (const folder of folders) {
    const key = `folder:${folder}`;
    if (state.entries[key]) continue;
    const parentPath = folder.split("/").slice(0, -1).join("/");
    const parent = parentPath ? state.entries[`folder:${parentPath}`]?.id : undefined;
    if (parentPath && !parent) throw new Error(`Pasta pai ausente: ${parentPath}.`);
    await operation(key, async () => {
      const found = await store.find("payload-folders", {
        and: [
          { name: { equals: path.basename(folder) } },
          { folder: parent ? { equals: parent } : { exists: false } },
        ],
      });
      if (
        found.length > 1 ||
        found.some((doc) => !Array.isArray(doc.folderType) || !doc.folderType.includes("media"))
      )
        throw new Error(`Pasta ambígua ou incompatível: ${folder}.`);
      return found[0] ?? store.create("payload-folders", {
        name: path.basename(folder),
        folder: parent,
        folderType: ["media"],
      });
    });
  }
  for (const asset of plan.assets) {
    const key = `asset:${asset.id}`;
    if (state.entries[key]) continue;
    if (hash(await readFile(asset.filename)) !== asset.hash)
      throw new Error(`Asset alterado após preflight: ${asset.id}.`);
    await operation(
      key,
      () => store.create("media", {
        title: asset.title,
        alt: asset.alt,
        usage: asset.usage,
        folder: state.entries[`folder:${asset.folder}`].id,
      }, asset.filename),
      asset.hash,
    );
  }
  const media = Object.fromEntries(
    plan.assets.map((asset) => [asset.id, state.entries[`asset:${asset.id}`].id]),
  );
  const { pages } = await check();
  const data = headerData(plan, media, pages);
  const source = hash(JSON.stringify(canonical(data)));
  if (state.entries[globalKey]?.source !== source) {
    await operation(globalKey, () => updateGlobal(data), source);
  }
  return { globalId: state.entries[globalKey].id, media, pages, content: canonical(data) };
}
