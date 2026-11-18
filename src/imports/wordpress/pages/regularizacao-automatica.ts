import { exactly, loadSource, safeAsset } from "../shared/source.ts";
import { lexical, plain } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import { beneficiosList } from "./beneficios.ts";
import {
  automaticaAssets,
  automaticaManuals,
  automaticaAdjustments,
  automaticaPending,
} from "./regularizacao-automatica-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

export function automaticaManualLinks(html: string) {
  const urls = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)].map(
    (m) => new URL(m[1]),
  );
  const paths = urls
    .filter((u) => u.hostname === "meuimovelregular.prefeitura.sp.gov.br")
    .map((u) => decodeURIComponent(u.pathname).replace(/\/+/g, "/"));
  const expected = [
    "/wp-content/uploads/2021/06/MANUAL-COMO-PREENCHER-O-REQUERIMENTO-Jun2021_compressed.pdf",
    "/wp-content/uploads/2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf",
    "/wp-content/uploads/2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf",
    "/wp-content/uploads/2020/03/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf",
  ];
  if (
    JSON.stringify(paths) !== JSON.stringify(expected) ||
    urls.length !== 5 ||
    !urls.some(
      (u) => u.hostname === "portaldelicenciamento.prefeitura.sp.gov.br",
    )
  )
    throw new Error("Manuais de origem Automática divergentes.");
}
export async function planAutomatica(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "193", 3);
  if (
    post.post_name !== "regularizacao-automatica" ||
    post.post_title !== "Regularização Automática"
  )
    throw new Error("Identidade Automática divergente.");
  const modules = (row: number): Record<string, string>[] =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  if (modules(0).length !== 1 || modules(1).length !== 14 || modules(2).length)
    throw new Error("Composição Automática divergente.");
  const body = (index: number) => {
    const value = modules(1)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: Automática $[1]/${index}`);
    return value.replace(/\\+"/g, '"').replace(/<br\s*\/?\s*>/gi, " ");
  };
  const imagePositions = [
    [0, 0],
    [1, 2],
    [1, 5],
    [1, 7],
    [1, 11],
  ];
  const assets = await Promise.all(
    automaticaAssets.map(async (a, i) => {
      if (i < 5) {
        const [row, index] = imagePositions[i];
        if (modules(row)[index]?.image !== a.id)
          throw new Error(`Imagem Automática divergente: ${a.id}`);
      }
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Origem do asset divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente da MIR-007: ${a.id}`);
      return { ...a, ...file };
    }),
  );
  automaticaManualLinks(body(12));
  const introHtml = body(0)
    .replace(/<h2\b[^>]*>/gi, "<h1>")
    .replace(/<\/h2>/gi, "</h1>");
  const external = exactly(
    [...introHtml.matchAll(/href="([^"]+)"/gi)],
    "lista externa Automática",
  )[1];
  if (
    !external.endsWith(
      "/Lei-de-Regularizacao-de-Edificacoes-Edificacoes-Regularizadas-Automatico.pdf",
    )
  )
    throw new Error("Lista externa Automática divergente.");
  const impediments = entendaLexical(
    body(6).replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "") +
      body(8).replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, ""),
  );
  const sections = [
    {
      title: plain(body(1)).replace(/:$/, ""),
      image: "1102",
      variant: "image-right",
      content: lexical(
        "<p>Imóveis residenciais das categorias de uso R1 e R2h: residências unifamiliares e residências agrupadas horizontalmente, com frente e acesso independente.</p>",
      ),
    },
    {
      title: plain(body(3)).replace(/:$/, ""),
      image: "1104",
      variant: "image-left",
      content: lexical(
        body(4)
          .replace(/<h3[^>]*>/gi, "<p>")
          .replace(/<\/h3>/gi, "</p>"),
      ),
    },
    {
      title: "Impedimentos",
      image: "1105",
      variant: "image-right",
      content: {
        root: {
          ...impediments.root,
          children: [...impediments.root.children, beneficiosList(body(8))],
        },
      },
    },
  ];
  const heading = plain(body(9));
  const portalParagraph = exactly(
    [...body(12).matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].filter((m) =>
      m[0].includes("portaldelicenciamento.prefeitura.sp.gov.br"),
    ),
    "orientação Portal",
  )[0];
  const certificate = entendaLexical(
    `<h2>${heading}</h2>` +
      body(10) +
      '<p>Este portal orienta e encaminha aos serviços oficiais; não emite certificado nem declara oficialmente que um imóvel está regular. Consulte também as orientações de <a href="https://meuimovelregular.prefeitura.sp.gov.br/situacao/">Como saber a situação do meu imóvel?</a>.</p>' +
      portalParagraph,
  );
  const alert = lexical(body(13).replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, ""));
  if (
    /anistia|<(?:iframe|script)\b/i.test(
      introHtml + body(6) + body(8) + body(13),
    )
  )
    throw new Error("Conteúdo Automática não revisado.");
  return {
    assets,
    sections: [],
    cards: [],
    topics: sections,
    intro: entendaLexical(introHtml),
    certificate,
    alert,
    adjustments: automaticaAdjustments,
    pending: automaticaPending,
    metaId: meta("193", "dslc_code").meta_id,
  };
}
export type AutomaticaPlan = Awaited<ReturnType<typeof planAutomatica>>;
export function automaticaData(
  plan: AutomaticaPlan,
  media: Record<string, number>,
) {
  return {
    title: "Regularização Automática",
    slug: "regularizacao-automatica",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media["727"],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      ...plan.topics.map((s) => ({
        blockType: "imageText",
        title: s.title,
        image: media[s.image],
        variant: s.variant,
        content: s.content,
      })),
      { blockType: "richText", variant: "default", content: plan.certificate },
      {
        blockType: "imageBlock",
        media: media["223"],
        caption:
          "Fluxo ilustrativo do processo de obtenção do certificado; confira as orientações atuais no serviço oficial.",
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
        title: "Informações Importantes",
        type: "info",
        content: plan.alert,
      },
    ],
  };
}
export function applyAutomatica(
  plan: AutomaticaPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "193",
    slug: "regularizacao-automatica",
    folders: [
      "MIR",
      "MIR/Modalidades",
      "MIR/Modalidades/Automatica",
      "MIR/Modalidades/Automatica/Imagens",
      "MIR/Modalidades/Automatica/Manuais",
    ],
    build: (media) => automaticaData(plan, media),
  });
}
