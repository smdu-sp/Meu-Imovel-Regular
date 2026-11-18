import { exactly, loadSource, safeAsset } from "./source.ts";
import { lexical, plain } from "../pages/home.ts";
import { entendaLexical } from "../pages/entenda.ts";
import { automaticaManualLinks } from "../pages/regularizacao-automatica.ts";
import { automaticaManuals } from "../pages/regularizacao-automatica-content.ts";
import { applyPage, type Store } from "./apply.ts";
import type { State } from "./migration-manifest.ts";
export type ComplexConfig = {
  id: string;
  slug: string;
  title: string;
  folder: string;
  count: number;
  assets: readonly {
    id: string;
    relative: string;
    hash: string;
    size: number;
    mimeType: string;
    title: string;
    alt: string;
    usage: string;
    folder: string;
  }[];
  positions: number[];
  intro: number[];
  topics: { title: string; image: string; body?: number; text?: string }[];
  requirements?: number;
  requestTitle: number;
  request: number;
  manuals: number;
  alert: number;
};
const law =
  "http://legislacao.prefeitura.sp.gov.br/leis/lei-17202-de-16-de-outubro-de-2019";
const decree =
  "http://legislacao.prefeitura.sp.gov.br/leis/decreto-59164-de-27-de-dezembro-de-2019";
export function repairCommonLinks(html: string) {
  return html
    .replace(
      /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      (anchor, url, label) => {
        if (url.includes("/wp-admin/") && plain(label) === "Lei 17.202")
          return `<a href="${law}">${label}</a>`;
        if (url === law && plain(label).includes("Decreto"))
          return `<a href="${decree}">${label}</a>`;
        return anchor;
      },
    )
    .replace(/Lei 17\.\/2019/g, "Lei 17.202/2019");
}
export function complexAlert(html: string) {
  const converted = html
    .replace(/<h[12]\b[^>]*>[\s\S]*?<\/h[12]>/gi, "")
    .replace(/<h5\b[^>]*>/gi, "<p>")
    .replace(/<\/h5>/gi, "</p>");
  const text = plain(converted);
  if (
    !/apenas\s+um comunicado/.test(text) ||
    !text.includes("30 (trinta) dias") ||
    !text.includes("prorrogado") ||
    !text.includes("60 (sessenta) dias")
  )
    throw new Error("Alerta de comunicado único divergente.");
  return lexical(converted);
}
export async function planComplex(
  config: ComplexConfig,
  source: string,
  uploads: string,
) {
  const { post, lc, meta } = await loadSource(source, config.id, 2);
  if (post.post_name !== config.slug || post.post_title !== config.title)
    throw new Error("Identidade da modalidade divergente.");
  const modules = (row: number): Record<string, string>[] =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  if (modules(0).length !== 1 || modules(1).length !== config.count)
    throw new Error("Composição da modalidade divergente.");
  const body = (index: number) => {
    const value = modules(1)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Texto ausente: ${config.slug}/${index}`);
    const decoded = value.replace(/\\+"/g, '"').replace(/<br\s*\/?\s*>/gi, " ");
    return config.id === "206" ? repairCommonLinks(decoded) : decoded;
  };
  const assets = await Promise.all(
    config.assets.map(async (a, i) => {
      if (i < config.positions.length) {
        const index = config.positions[i];
        if ((index === -1 ? modules(0)[0] : modules(1)[index])?.image !== a.id)
          throw new Error(`Imagem divergente: ${a.id}`);
      }
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Anexo divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente: ${a.id}`);
      return { ...a, ...file };
    }),
  );
  automaticaManualLinks(body(config.manuals));
  const rawIntro = config.intro.map(body).join("");
  const intro =
    config.id === "204" ? `<h1>${config.title}</h1>` + body(1) : rawIntro;
  const portal = exactly(
    [...body(config.manuals).matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].filter(
      (m) => m[0].includes("portaldelicenciamento.prefeitura.sp.gov.br"),
    ),
    "orientação Portal",
  )[0];
  const request = entendaLexical(
    `<h2>${plain(body(config.requestTitle))}</h2>` +
      body(config.request) +
      portal +
      "<p>Este portal informa e orienta; não cria protocolo nem garante deferimento. Confirme os requisitos e procedimentos nos canais oficiais.</p>",
  );
  const topics = config.topics.map((t, i) => ({
    ...t,
    variant: i % 2 === 0 ? "image-right" : "image-left",
    content: lexical(t.body === undefined ? `<p>${t.text}</p>` : body(t.body)),
  }));
  const content = JSON.stringify({
    intro,
    topics,
    request,
    alert: body(config.alert),
  });
  if (/anistia|wp-admin|<(?:iframe|script)\b/i.test(content))
    throw new Error("Conteúdo da modalidade não revisado.");
  return {
    assets,
    sections: [],
    cards: [],
    intro: entendaLexical(intro),
    topics,
    requirements:
      config.requirements === undefined
        ? undefined
        : entendaLexical("<h2>Exigências</h2>" + body(config.requirements)),
    request,
    alert: complexAlert(body(config.alert)),
    metaId: meta(config.id, "dslc_code").meta_id,
    adjustments: [
      "Manuais legados indisponíveis convertidos em quatro relações Documento com os PDFs usados na Home.",
      "Alerta preserva comunicado único, 30 dias, possibilidade de prorrogação e recurso de 60 dias presentes no backup; o resumo da spec sobre prazo improrrogável não foi reproduzido.",
      ...(config.id === "206"
        ? [
            "Link administrativo da Lei corrigido, destino do Decreto corrigido e título Como solicitar extraído sem os wrappers do builder.",
          ]
        : []),
    ],
    pending: [
      "Revisar requisitos, anuências, imagens, fórmulas ilustrativas, valores e prazos históricos antes de publicar; a origem não comprova vigência.",
      "Conferir créditos, alternativas, preview desktop/mobile, links oficiais e downloads.",
    ],
  };
}
export type ComplexPlan = Awaited<ReturnType<typeof planComplex>>;
export function complexData(
  config: ComplexConfig,
  plan: ComplexPlan,
  media: Record<string, number>,
) {
  const topicBlocks: Record<string, unknown>[] = plan.topics.map((t) => ({
    blockType: "imageText",
    title: t.title,
    image: media[t.image],
    variant: t.variant,
    content: t.content,
  }));
  if (plan.requirements)
    topicBlocks.splice(1, 0, {
      blockType: "richText",
      content: plan.requirements,
      variant: "default",
    });
  return {
    title: config.title,
    slug: config.slug,
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media[config.assets[0].id],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      ...topicBlocks,
      { blockType: "richText", variant: "default", content: plan.request },
      {
        blockType: "imageBlock",
        media: media["223"],
        caption:
          "Fluxo ilustrativo; confira as orientações atuais no serviço oficial.",
        imagePresentation: {
          size: "large",
          aspectRatio: "original",
          fit: "contain",
        },
      },
      {
        blockType: "iconGrid",
        title: "Manuais de apoio",
        variant: "compact",
        appearance: { spacing: "compact", scheme: "default" },
        items: automaticaManuals.map((id) => ({
          iconSource: "standard",
          standardIcon: "document",
          description: plan.assets.find((a) => a.id === id)!.title,
          link: { type: "document", document: media[id], label: "Baixar PDF" },
        })),
      },
      {
        blockType: "alertBox",
        type: "warning",
        title: "Informações Importantes: Comunicado Único",
        content: plan.alert,
      },
    ],
  };
}
export function applyComplex(
  config: ComplexConfig,
  plan: ComplexPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: config.id,
    slug: config.slug,
    folders: [
      "MIR",
      "MIR/Modalidades",
      `MIR/Modalidades/${config.folder}`,
      `MIR/Modalidades/${config.folder}/Imagens`,
      `MIR/Modalidades/${config.folder}/Manuais`,
    ],
    build: (media) => complexData(config, plan, media),
  });
}
