import { exactly, loadSource, safeAsset } from "../shared/source.ts";
import { plain } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import {
  cartilhaAssets,
  cartilhaAdjustments,
  cartilhaPending,
} from "./cartilha-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

export function cartilhaEditorial(html: string) {
  const decoded = html.replace(/\\+"/g, '"');
  const link = exactly(
    [...decoded.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)],
    "link da Cartilha",
  );
  const url = new URL(link[1]);
  if (
    url.hostname !== "meuimovelregular.prefeitura.sp.gov.br" ||
    !["http:", "https:"].includes(url.protocol) ||
    decodeURIComponent(url.pathname).replace(/\/+/g, "/") !==
      "/wp-content/uploads/" + cartilhaAssets[1].relative
  )
    throw new Error("Destino da Cartilha divergente.");
  const paragraph = exactly(
    [...decoded.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].filter((m) =>
      m[0].includes(link[0]),
    ),
    "parágrafo de download da Cartilha",
  );
  const editorial = decoded.replace(paragraph[0], "");
  const title = plain(
    exactly(
      [...editorial.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)],
      "título Cartilha",
    )[1],
  );
  if (
    title !== "Entenda a nova Lei de Regularização de Edificações" ||
    /anistia|<(?:iframe|script)\b/i.test(editorial)
  )
    throw new Error("Conteúdo Cartilha divergente ou não revisado.");
  return entendaLexical(editorial);
}
export async function planCartilha(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "1145", 2);
  if (post.post_name !== "cartilha" || post.post_title !== "Cartilha")
    throw new Error("Identidade Cartilha divergente.");
  const modules = (row: number): Record<string, string>[] =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  if (
    modules(0).length !== 1 ||
    modules(0)[0].image !== "1150" ||
    modules(1).length !== 1 ||
    typeof modules(1)[0].content !== "string"
  )
    throw new Error("Composição Cartilha divergente.");
  const assets = await Promise.all(
    cartilhaAssets.map(async (a) => {
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Origem do asset Cartilha divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente da MIR-006: ${a.id}`);
      return { ...a, ...file };
    }),
  );
  return {
    assets,
    sections: [],
    cards: [],
    intro: cartilhaEditorial(modules(1)[0].content),
    adjustments: cartilhaAdjustments,
    pending: cartilhaPending,
    metaId: meta("1145", "dslc_code").meta_id,
  };
}
export type CartilhaPlan = Awaited<ReturnType<typeof planCartilha>>;
export function cartilhaData(
  plan: CartilhaPlan,
  media: Record<string, number>,
) {
  return {
    title: "Cartilha",
    slug: "cartilha",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media["1150"],
        link: {
          enabled: true,
          type: "document",
          document: media["1129"],
          newTab: false,
        },
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      {
        blockType: "cta",
        title: "Cartilha de Regularização de Edificações",
        variant: "default",
        action: {
          label: "Baixar Cartilha Completa (PDF)",
          type: "document",
          document: media["1129"],
          newTab: false,
        },
      },
    ],
  };
}
export function applyCartilha(
  plan: CartilhaPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "1145",
    slug: "cartilha",
    folders: [
      "MIR",
      "MIR/Cartilha",
      "MIR/Cartilha/Imagens",
      "MIR/Cartilha/Documentos",
    ],
    build: (media) => cartilhaData(plan, media),
  });
}
