import { exactly, loadSource, safeAsset } from "../shared/source.ts";
import { plain, lexical } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import {
  situacaoImages,
  situacaoCediUrl,
  situacaoNotice,
  situacaoAdjustments,
  situacaoPending,
} from "./situacao-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

export function situacaoInstructions(html: string) {
  const heading = exactly(
    [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)],
    "título da consulta",
  )[1];
  const list = exactly(
    [...html.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/gi)],
    "passos da consulta",
  )[1];
  const items = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  if (items.length !== 3)
    throw new Error("Esperados três passos na origem Situação.");
  const links = [...html.matchAll(/href="([^"]+)"/gi)];
  if (exactly(links, "link CEDI")[1] !== situacaoCediUrl)
    throw new Error("Destino CEDI divergente.");
  const content = entendaLexical(`<h2>${plain(heading)}</h2>`);
  return {
    root: {
      ...content.root,
      children: [
        ...content.root.children,
        {
          type: "list",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          listType: "number",
          tag: "ol",
          start: 1,
          children: items.map((m, i) => ({
            type: "listitem",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
            value: i + 1,
            children: lexical(`<p>${m[1].replace(/<br\s*\/?\s*>/gi, " ")}</p>`)
              .root.children[0].children,
          })),
        },
      ],
    },
  };
}
export async function planSituacao(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "176", 2);
  if (
    post.post_name !== "situacao" ||
    post.post_title !== "Como saber a situação do meu imóvel?"
  )
    throw new Error("Identidade Situação divergente.");
  const modules = (row: number) =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  const body = (index: number) => {
    const value = modules(1)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: Situação $[1]/${index}`);
    return value.replace(/\\+"/g, '"');
  };
  const assets = await Promise.all(
    situacaoImages.map(async (a, i) => {
      if (
        modules(i === 0 ? 0 : 1)[i === 0 ? 0 : 2]?.image !== a.id ||
        meta(a.id, "_wp_attached_file").meta_value !== a.relative
      )
        throw new Error(`Origem da imagem divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente da MIR-004: ${a.id}`);
      return {
        ...a,
        ...file,
        usage: "content",
        folder: "MIR/Situacao/Imagens",
      };
    }),
  );
  const introHtml = (body(0) + body(1))
    .replace(
      "que é o documento que comprova a situação da edificação, ou seja, se está regular ou irregular.",
      "que apresenta as informações e os registros da edificação disponíveis no cadastro municipal.",
    )
    .replace("<p>Consulte da seguinte forma:</p>", "");
  if (
    /comprova a situação|regular ou irregular|anistia/i.test(
      plain(introHtml + body(3)),
    )
  )
    throw new Error("Conteúdo Situação não revisado.");
  const instructions = situacaoInstructions(body(3));
  return {
    assets,
    sections: [],
    cards: [],
    intro: entendaLexical(introHtml + `<p>${situacaoNotice}</p>`),
    instructions,
    url: situacaoCediUrl,
    adjustments: situacaoAdjustments,
    pending: situacaoPending,
    metaId: meta("176", "dslc_code").meta_id,
  };
}
export type SituacaoPlan = Awaited<ReturnType<typeof planSituacao>>;
export function situacaoData(
  plan: SituacaoPlan,
  media: Record<string, number>,
) {
  return {
    title: "Como saber a situação do meu imóvel?",
    slug: "situacao",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media["739"],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      {
        blockType: "imageBlock",
        media: media["718"],
        caption:
          "Tela ilustrativa da consulta ao CEDI por SQL; a interface do serviço pode ter mudado.",
        imagePresentation: {
          size: "large",
          aspectRatio: "original",
          fit: "contain",
        },
      },
      { blockType: "richText", variant: "default", content: plan.instructions },
      {
        blockType: "cta",
        title: "Consultar o Histórico da Edificação",
        variant: "default",
        action: {
          label: "Acessar Consulta do CEDI",
          type: "external",
          newTab: true,
          url: plan.url,
        },
      },
    ],
  };
}
export function applySituacao(
  plan: SituacaoPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "176",
    slug: "situacao",
    folders: ["MIR", "MIR/Situacao", "MIR/Situacao/Imagens"],
    build: (media) => situacaoData(plan, media),
  });
}
