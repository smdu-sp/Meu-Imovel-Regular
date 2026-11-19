import { readFile } from "node:fs/promises";
import path from "node:path";
import { isSocialIcon } from "../../../domain/icons.ts";
import { validateOfficialHttpsUrl } from "../../../domain/official-url.ts";
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
import {
  footerContact,
  footerInstitutionalLinks,
  footerLogo,
  footerSocial,
} from "./footer-content.ts";

const folders = ["MIR", "MIR/Compartilhado", "MIR/Compartilhado/Identidade"];
const identityFolder = folders[2];
const globalKey = "global:footer";

const metaFor = (tables: Record<string, Row[]>, postId: string, key: string) =>
  exactly(
    tables.wp_postmeta.filter((row) => row.post_id === postId && row.meta_key === key),
    `wp_postmeta ${postId}/${key}`,
  );

type Area = { size?: string; content?: Record<string, string>[] };

export function extractFooterContent(areas: Area[]) {
  const addressHtml = areas[3].content?.[0]?.content || "";
  const addressMatch = addressHtml.match(/<h4>([^<]+)<\/h4><p>([^<]+)<br>([^<]+)<\/p>/i);
  if (!addressMatch) throw new Error("Endereço do rodapé ilegível.");
  const address = `${addressMatch[1].trim()}\n${addressMatch[2].trim()} - ${addressMatch[3].trim()}`;
  const contactHtml = areas[4].content?.[0]?.content || "";
  const email = contactHtml.match(/mailto:([\w.%+-]+@[\w.-]+\.[a-z]{2,})/i)?.[1];
  const phone = contactHtml.match(/<br>\s*Tel:\s*(\d+)\s*<\/p>/i)?.[1];
  if (!email || !phone || !contactHtml.includes(`>${email}</a>`))
    throw new Error("Contatos do rodapé ilegíveis.");
  if (address !== footerContact.address || email !== footerContact.email || phone !== footerContact.phone)
    throw new Error("Dados institucionais do rodapé divergentes da MIR-012.");

  const socialModule = areas[5].content?.[0];
  const socialLinks = footerSocial.map(({ source, label, icon, url }) => {
    const extracted = socialModule?.[source];
    if (extracted !== url) throw new Error(`Perfil social divergente: ${source}.`);
    if (!isSocialIcon(icon) || validateOfficialHttpsUrl(extracted) !== true)
      throw new Error(`Perfil social inválido: ${source}.`);
    return { label, icon, url: extracted };
  });
  const institutionalLinks = footerInstitutionalLinks.map(({ label, url }) => {
    if (validateOfficialHttpsUrl(url) !== true)
      throw new Error(`Link institucional inválido: ${label}.`);
    return { label, url };
  });
  return { address, email, phone, socialLinks, institutionalLinks };
}

export async function planFooter(source: string, uploads: string) {
  const bytes = await readFile(source);
  if (hash(bytes) !== SNAPSHOT)
    throw new Error("Snapshot divergente: revalide a fonte e o mapeamento antes de aplicar.");
  const tables = readTables(bytes.toString("utf8"));
  const post = exactly(tables.wp_posts.filter((row) => row.ID === "178"), "Footer 178");
  if (post.post_type !== "dslc_hf" || post.post_status !== "publish" || post.post_title !== "Rodape")
    throw new Error("Template Footer divergente.");
  const meta = metaFor(tables, "178", "dslc_code");
  if (meta.meta_id !== "4067") throw new Error("Composição Footer divergente.");
  const layout = JSON.parse(meta.meta_value);
  if (!Array.isArray(layout) || layout.length !== 1 || layout[0]?.content?.length !== 7)
    throw new Error("Estrutura Footer divergente.");
  const areas = layout[0].content as Area[];
  const modules = [
    "DSLC_Html", "DSLC_Separator", "DSLC_Image", "DSLC_Text_Simple",
    "DSLC_Text_Simple", "DSLC_Social", "DSLC_Separator",
  ];
  const sizes = ["12", "12", "3", "4", "3", "2", "10"];
  for (let index = 0; index < areas.length; index++) {
    if (
      areas[index].size !== sizes[index] ||
      areas[index].content?.length !== 1 ||
      areas[index].content?.[0]?.module_id !== modules[index]
    )
      throw new Error(`Área do Footer divergente: ${index}.`);
  }
  if (areas[2].content?.[0]?.image !== footerLogo.id)
    throw new Error("Logo do Footer divergente.");
  const content = extractFooterContent(areas);
  const attachment = exactly(
    tables.wp_posts.filter((row) => row.ID === footerLogo.id),
    `anexo ${footerLogo.id}`,
  );
  if (
    attachment.post_type !== "attachment" ||
    attachment.post_mime_type !== "image/png" ||
    metaFor(tables, footerLogo.id, "_wp_attached_file").meta_value !== footerLogo.relative
  )
    throw new Error("Anexo do Footer divergente.");
  const file = await safeAsset(uploads, footerLogo.relative);
  if (file.hash !== footerLogo.hash || file.size !== footerLogo.size || file.mimeType !== "image/png")
    throw new Error("Arquivo do Footer divergente.");
  const asset = { ...footerLogo, ...file, usage: "content" as const, folder: identityFolder };
  return { assets: [asset], content, postId: "178", metaId: "4067", folders };
}

export type FooterPlan = Awaited<ReturnType<typeof planFooter>>;

export function footerData(plan: FooterPlan, media: Record<string, number>) {
  return {
    appearance: { scheme: "muted" },
    logo: media[footerLogo.id],
    phone: plan.content.phone,
    email: plan.content.email,
    address: plan.content.address,
    inPersonService: footerContact.inPersonService,
    socialLinks: plan.content.socialLinks,
    institutionalLinks: plan.content.institutionalLinks,
  };
}

function pristineFooter(doc: Doc) {
  const appearance = doc.appearance as { scheme?: string; colors?: Record<string, unknown> } | undefined;
  return (
    !doc.logo && !doc.phone && !doc.email && !doc.address && !doc.inPersonService &&
    (!Array.isArray(doc.socialLinks) || doc.socialLinks.length === 0) &&
    (!Array.isArray(doc.institutionalLinks) || doc.institutionalLinks.length === 0) &&
    (!appearance?.scheme || appearance.scheme === "muted") &&
    !Object.values(appearance?.colors || {}).some(Boolean)
  );
}

export async function applyFooter(
  plan: FooterPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  if (!store.getGlobal || !store.updateGlobal)
    throw new Error("Sessão de importação sem suporte ao Footer Global.");
  const getGlobal = store.getGlobal;
  const updateGlobal = store.updateGlobal;
  const relevant = new Set([
    globalKey,
    ...folders.map((folder) => `folder:${folder}`),
    ...plan.assets.map((asset) => `asset:${asset.id}`),
  ]);
  const check = async () => {
    const current = await getGlobal("footer");
    const entry = state.entries[globalKey];
    if (entry) assertIntact(current, "footer", entry);
    else if (!pristineFooter(current))
      throw new Error("Footer preexistente não gerenciado; edição manual preservada.");
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
    return current;
  };

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
      hash: projection(doc, key === globalKey ? "footer" : key.startsWith("asset:") ? "media" : "payload-folders"),
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
  await check();
  const data = footerData(plan, media);
  const source = hash(JSON.stringify(canonical(data)));
  if (state.entries[globalKey]?.source !== source)
    await operation(globalKey, () => updateGlobal(data, "footer"), source);
  return { globalId: state.entries[globalKey].id, media, content: canonical(data) };
}
