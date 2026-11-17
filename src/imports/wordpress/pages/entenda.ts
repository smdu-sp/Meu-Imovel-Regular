import { loadSource, safeAsset, exactly } from "../shared/source.ts";
import { lexical, plain } from "./home.ts";
import { parseVideoEmbedUrl } from "../../../blocks/VideoBlock/video-embed.ts";
import {
  entendaImages,
  entendaDestinations,
  entendaVideo,
  entendaAdjustments,
  entendaPending,
} from "./entenda-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

// Deliberately limited to the headings/paragraphs present in the validated snapshot.
export function entendaLexical(html: string) {
  const children: object[] = [];
  for (const m of html.matchAll(/<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (!plain(m[2])) continue;
    if (m[1].toLowerCase() === "p")
      children.push(...lexical(m[0]).root.children);
    else
      children.push({
        type: "heading",
        tag: m[1].toLowerCase(),
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            text: plain(m[2]),
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      });
  }
  if (!children.length) throw new Error("Conteúdo Entenda vazio.");
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children,
    },
  };
}
export async function planEntenda(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "172", 8);
  if (post.post_name !== "entenda" || post.post_title !== "Entenda a Lei")
    throw new Error("Identidade Entenda divergente.");
  const body = (row: number, module: number) => {
    const value = lc[row]?.content?.[0]?.content?.[module]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: Entenda $[${row}]/${module}`);
    return value.replace(/\\"/g, '"');
  };
  const assets = await Promise.all(
    entendaImages.map(async (a) => {
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Caminho divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== "image/jpeg"
      )
        throw new Error(`Asset divergente da MIR-002: ${a.id}`);
      return { ...a, ...file, usage: "content", folder: "MIR/Entenda/Imagens" };
    }),
  );
  if (lc[0]?.content?.[0]?.content?.[0]?.image !== "735")
    throw new Error("Capa Entenda divergente.");
  const iframe = exactly(
    [...body(2, 0).matchAll(/src="([^"]+)"/g)],
    "vídeo Entenda",
  )[1];
  const video = parseVideoEmbedUrl(iframe);
  if (
    video?.provider !== "youtube" ||
    video.id !== "ECumpvJ-Yb8" ||
    parseVideoEmbedUrl(entendaVideo.url)?.id !== video.id
  )
    throw new Error("Vídeo Entenda divergente.");
  const concept = body(2, 1)
    .replace(
      /O que é a Lei de Anistia de imóveis\? Todos os imóveis podem ser regularizados\?/g,
      "O que é a Lei de Regularização de Edificações?",
    )
    .replace(
      /O termo “anistia”, comumente utilizado nos processos de regularização, deve ser evitado\./g,
      "A denominação informal usada para esses processos deve ser evitada.",
    )
    .replace(/pedidos de anistia/g, "pedidos de regularização")
    .replace(/<h1>/g, "<h2>")
    .replace(/<\/h1>/g, "</h2>");
  const introHtml = body(1, 0);
  if (/anistia/i.test(plain(introHtml + concept)))
    throw new Error("Terminologia Entenda não revisada.");
  const sections = [3, 4, 5, 6].map((row, i) => {
    if (lc[row]?.content?.[0]?.content?.[0]?.image !== entendaImages[i + 1].id)
      throw new Error("Imagem da modalidade divergente.");
    const html = body(row, 2);
    const title = plain(
      exactly(
        [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)],
        "título modalidade",
      )[1],
    );
    const url = exactly(
      [...body(row, 1).matchAll(/href="([^"]+)"/g)],
      "CTA modalidade",
    )[1];
    if (
      new URL(url).pathname.replace(/^\/+|\/+$/g, "") !== entendaDestinations[i]
    )
      throw new Error("Destino da modalidade divergente.");
    if (title.length > 100)
      throw new Error("Título de modalidade excede schema.");
    return {
      title,
      url,
      content: entendaLexical(html.replace(/<h3[^>]*>[\s\S]*?<\/h3>/i, "")),
      image: entendaImages[i + 1].id,
      variant: i % 2 === 0 ? "image-right" : "image-left",
    };
  });
  return {
    assets,
    sections,
    cards: [],
    intro: entendaLexical(introHtml),
    concept: entendaLexical(concept),
    video: entendaVideo,
    adjustments: entendaAdjustments,
    pending: entendaPending,
    metaId: meta("172", "dslc_code").meta_id,
  };
}
export type EntendaPlan = Awaited<ReturnType<typeof planEntenda>>;
export function entendaData(
  plan: EntendaPlan,
  media: Record<string, number>,
  pages: Record<string, number> = {},
) {
  return {
    title: "Entenda a Lei",
    slug: "entenda",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media["735"],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      {
        blockType: "videoBlock",
        ...plan.video,
        provider: "youtube",
        aspectRatio: "16:9",
      },
      { blockType: "richText", variant: "default", content: plan.concept },
      ...plan.sections.map((s) => {
        const slug = new URL(s.url).pathname.replace(/^\/+|\/+$/g, "");
        return {
          blockType: "imageText",
          title: s.title,
          content: s.content,
          image: media[s.image],
          variant: s.variant,
          cta: pages[slug]
            ? { type: "internal", page: pages[slug], label: "Saiba mais" }
            : { type: "external", url: s.url, label: "Saiba mais" },
        };
      }),
    ],
  };
}
export function applyEntenda(
  plan: EntendaPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "172",
    slug: "entenda",
    folders: ["MIR", "MIR/Entenda", "MIR/Entenda/Imagens"],
    build: (media, pages) => entendaData(plan, media, pages),
  });
}
