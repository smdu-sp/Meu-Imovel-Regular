import { exactly, loadSource, safeAsset } from "../shared/source.ts";
import { lexical, plain } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import { beneficiosList } from "./beneficios.ts";
import { automaticaManualLinks } from "./regularizacao-automatica.ts";
import { automaticaManuals } from "./regularizacao-automatica-content.ts";
import {
  simplificadaAssets,
  simplificadaAdjustments,
  simplificadaPending,
} from "./regularizacao-declaratoria-simplificada-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

export function simplificadaAlert(html: string) {
  const decoded = html.replace(/\\+"/g, '"');
  if (
    !plain(decoded).includes(
      "No procedimento declaratório simplificado não se admite a emissão de comunicado.",
    )
  )
    throw new Error("Aviso de ausência de comunicado divergente.");
  const paragraph = exactly(
    [...decoded.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) =>
      /I - Apresentar Certificado/.test(m[1]),
    ),
    "encaminhamentos Simplificada",
  );
  const cases = paragraph[1].split(/<br\s*\/?\s*>/gi).map(plain);
  if (
    cases.length !== 8 ||
    !cases.every((text, i) =>
      text.startsWith(
        ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i] + " - ",
      ),
    )
  )
    throw new Error("Esperados oito encaminhamentos na origem Simplificada.");
  const content = lexical(
    decoded.replace(paragraph[0], "").replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, ""),
  );
  return {
    root: {
      ...content.root,
      children: [
        ...content.root.children,
        beneficiosList(
          "<ul>" + cases.map((text) => `<li>${text}</li>`).join("") + "</ul>",
        ),
      ],
    },
  };
}
export async function planSimplificada(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "760", 2);
  if (
    post.post_name !== "regularizacao-declaratoria-simplificada" ||
    post.post_title !== "Regularização Declaratória Simplificada"
  )
    throw new Error("Identidade Declaratória Simplificada divergente.");
  const modules = (row: number): Record<string, string>[] =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  if (modules(0).length !== 1 || modules(1).length !== 14)
    throw new Error("Composição Declaratória Simplificada divergente.");
  const body = (index: number) => {
    const value = modules(1)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: Simplificada $[1]/${index}`);
    return value.replace(/\\+"/g, '"').replace(/<br\s*\/?\s*>/gi, " ");
  };
  const positions = [
    [0, 0],
    [1, 2],
    [1, 5],
    [1, 8],
    [1, 11],
  ];
  const assets = await Promise.all(
    simplificadaAssets.map(async (a, i) => {
      if (i < 5) {
        const [row, index] = positions[i];
        if (modules(row)[index]?.image !== a.id)
          throw new Error(`Imagem Simplificada divergente: ${a.id}`);
      }
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Origem do asset divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente da MIR-008: ${a.id}`);
      return { ...a, ...file };
    }),
  );
  automaticaManualLinks(body(12));
  const introHtml = body(0)
    .replace(/<h2\b[^>]*>/gi, "<h1>")
    .replace(/<\/h2>/gi, "</h1>");
  const topics = [
    {
      title: plain(body(1)).replace(/:$/, ""),
      image: "1106",
      variant: "image-right",
      content: lexical(
        "<p>Edificações de uso residencial das categorias R1 e R2h, conforme os critérios da modalidade Declaratória Simplificada.</p>",
      ),
    },
    {
      title: plain(body(3)).replace(/:$/, ""),
      image: "1107",
      variant: "image-left",
      content: lexical(body(4)),
    },
    {
      title: plain(body(6)).replace(/:$/, ""),
      image: "1108",
      variant: "image-right",
      content: lexical(body(7)),
    },
  ];
  const portalParagraph = exactly(
    [...body(12).matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].filter((m) =>
      m[0].includes("portaldelicenciamento.prefeitura.sp.gov.br"),
    ),
    "orientação Portal",
  )[0];
  const request = entendaLexical(
    body(9) +
      body(10) +
      portalParagraph +
      "<p>Este portal orienta e encaminha ao serviço oficial; não cria protocolo nem garante deferimento. O enquadramento e o atendimento aos requisitos devem ser confirmados nos canais competentes.</p>",
  );
  const alert = simplificadaAlert(modules(1)[13].content);
  if (
    /anistia|<(?:iframe|script)\b/i.test(
      [0, 1, 3, 4, 6, 7, 9, 10, 13].map(body).join(""),
    )
  )
    throw new Error("Conteúdo Simplificada não revisado.");
  return {
    assets,
    sections: [],
    cards: [],
    topics,
    intro: entendaLexical(introHtml),
    request,
    alert,
    adjustments: simplificadaAdjustments,
    pending: simplificadaPending,
    metaId: meta("760", "dslc_code").meta_id,
  };
}
export type SimplificadaPlan = Awaited<ReturnType<typeof planSimplificada>>;
export function simplificadaData(
  plan: SimplificadaPlan,
  media: Record<string, number>,
) {
  return {
    title: "Regularização Declaratória Simplificada",
    slug: "regularizacao-declaratoria-simplificada",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "fullWidthImageBanner",
        desktopImage: media["777"],
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
      { blockType: "richText", variant: "default", content: plan.request },
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
        title: "Informações Importantes: Ausência de Comunicado",
        type: "danger",
        content: plan.alert,
      },
    ],
  };
}
export function applySimplificada(
  plan: SimplificadaPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "760",
    slug: "regularizacao-declaratoria-simplificada",
    folders: [
      "MIR",
      "MIR/Modalidades",
      "MIR/Modalidades/DeclaratoriaSimplificada",
      "MIR/Modalidades/DeclaratoriaSimplificada/Imagens",
      "MIR/Modalidades/DeclaratoriaSimplificada/Manuais",
    ],
    build: (media) => simplificadaData(plan, media),
  });
}
