import { exactly, loadSource, safeAsset } from "../shared/source.ts";
import { lexical, plain } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import {
  faqImages,
  faqManuals,
  faqTitles,
  faqNotice,
  faqAdjustments,
  faqPending,
} from "./faq-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

export const faqDecode = (html: string) =>
  html.replace(/\\+"/g, '"').replace(/<br\s*\/?\s*>/gi, " ");
export function reviewFaq(html: string) {
  return faqDecode(html)
    .replace(
      /O termo “anistia”, comumente utilizado nos processos de regularização, deve ser evitado\./g,
      "A denominação informal usada para esses processos deve ser evitada.",
    )
    .replace(
      /Lei de Anistia de imóveis/gi,
      "Lei de Regularização de Edificações",
    )
    .replace(/\s*\(anistia\)/gi, "")
    .replace(/anistiar/gi, "regularizar")
    .replace(/anistia/gi, "regularização");
}
export function faqAnswer(html: string) {
  const reviewed = reviewFaq(html).replace(
    /<a\b[^>]*>\s*Lei nº 15\.889\/13\s*<\/a>/gi,
    '<a href="http://legislacao.prefeitura.sp.gov.br/leis/lei-15889-de-05-de-novembro-de-2013">Lei nº 15.889/13</a>',
  );
  if (/<(?:script|iframe)\b/i.test(reviewed))
    throw new Error("HTML FAQ inesperado.");
  for (const m of reviewed.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)) {
    let url: URL;
    try {
      url = new URL(m[1]);
    } catch {
      throw new Error("URL FAQ inválida.");
    }
    if (
      !["http:", "https:", "mailto:"].includes(url.protocol) ||
      m[1].includes('"')
    )
      throw new Error("Protocolo FAQ inválido.");
  }
  const content = lexical(reviewed);
  if (!content.root.children.length) throw new Error("Resposta FAQ vazia.");
  return content;
}
export function parseFaq(nav: string, answers: string) {
  const questions = nav.split("(dslc_sep)").map((s) => plain(reviewFaq(s)));
  const bodies = answers.split("(dslc_sep)");
  if (questions.length !== 29 || bodies.length !== 29)
    throw new Error("FAQ exige exatamente 29 perguntas e 29 respostas.");
  return questions.map((question, i) => {
    if (!question || question.length > 140)
      throw new Error(
        `Pergunta FAQ ${i + 1} inválida ou acima de 140 caracteres.`,
      );
    return { question, answer: faqAnswer(bodies[i]) };
  });
}
export async function planFaq(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "174", 6);
  if (post.post_name !== "faq" || post.post_title !== "Dúvidas frequentes")
    throw new Error("Identidade FAQ divergente.");
  const modules = (row: number): Record<string, string>[] =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  const body = (row: number, index: number) => {
    const value = modules(row)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: FAQ $[${row}]/${index}`);
    return faqDecode(value);
  };
  if (modules(4).length || modules(5).length)
    throw new Error("Seções finais FAQ inesperadas.");
  const accordion = exactly(
    modules(1).filter(
      (m: Record<string, string>) => m.module_id === "DSLC_Accordion",
    ),
    "acordeão FAQ",
  );
  if (
    typeof accordion.accordion_nav !== "string" ||
    typeof accordion.accordion_content !== "string"
  )
    throw new Error("Acordeão FAQ incompleto.");
  const items = parseFaq(accordion.accordion_nav, accordion.accordion_content);
  const positions = [
    [0, 0],
    [2, 0],
    [2, 2],
    [2, 4],
    [2, 6],
    [3, 0],
  ];
  const assets = await Promise.all(
    faqImages.map(async (a, i) => {
      const [row, index] = positions[i];
      if (
        modules(row)[index]?.image !== a.id ||
        meta(a.id, "_wp_attached_file").meta_value !== a.relative
      )
        throw new Error(`Origem da imagem FAQ divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== a.mimeType
      )
        throw new Error(`Asset divergente da MIR-005: ${a.id}`);
      return {
        ...a,
        ...file,
        alt: a.title,
        usage: "content",
        folder: "MIR/FAQ/Imagens",
      };
    }),
  );
  const manuals = await Promise.all(
    faqManuals.map(async (a) => {
      if (meta(a.id, "_wp_attached_file").meta_value !== a.relative)
        throw new Error(`Origem do manual FAQ divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== "application/pdf"
      )
        throw new Error(`Manual FAQ divergente: ${a.id}`);
      return {
        ...a,
        ...file,
        alt: "",
        usage: "document",
        folder: "MIR/FAQ/Manuais",
      };
    }),
  );
  const channels = [
    [2, 3, "733"],
    [2, 5, "800"],
    [2, 7, "732"],
    [3, 1, "734"],
  ] as const;
  const support = channels.map(([row, index, image]) => {
    const html = reviewFaq(body(row, index));
    const title = plain(
      exactly(
        [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)],
        "título canal FAQ",
      )[1],
    );
    const link = exactly(
      [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)],
      "link canal FAQ",
    );
    const url = new URL(link[1]);
    if (!["http:", "https:", "mailto:"].includes(url.protocol))
      throw new Error("Destino canal FAQ inválido.");
    const description = plain(
      html
        .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "")
        .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ""),
    );
    if (title.length > 80 || description.length > 300 || !description)
      throw new Error("Canal FAQ excede schema.");
    return {
      title,
      description,
      image,
      url: link[1],
      label: plain(link[2]),
      clickable: url.protocol !== "mailto:",
    };
  });
  return {
    assets: [...assets, ...manuals],
    sections: [],
    cards: [],
    items,
    support,
    intro: entendaLexical(reviewFaq(body(1, 0)) + `<p>${faqNotice}</p>`),
    adjustments: faqAdjustments,
    pending: faqPending,
    metaId: meta("174", "dslc_code").meta_id,
  };
}
export type FaqPlan = Awaited<ReturnType<typeof planFaq>>;
export function faqData(
  plan: FaqPlan,
  media: Record<string, number>,
  documentURLs: Record<string, string> = {},
) {
  const replaceLinks = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(replaceLinks);
    if (!value || typeof value !== "object") return value;
    const node = value as Record<string, unknown>;
    if (node.type === "link") {
      const fields = node.fields as { linkType?: string; url?: string };
      if (fields?.linkType === "custom" && fields.url) {
        const url = new URL(fields.url);
        const pathname = decodeURIComponent(url.pathname).replace(/\/+/g, "/");
        const manual = faqManuals.find(
          (a) =>
            url.hostname === "meuimovelregular.prefeitura.sp.gov.br" &&
            pathname === "/wp-content/uploads/" + a.legacy,
        );
        if (manual && documentURLs[manual.id])
          return {
            ...node,
            fields: { ...fields, url: documentURLs[manual.id] },
          };
      }
    }
    return Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, replaceLinks(child)]),
    );
  };
  const items = plan.items.map((item) => ({
    ...item,
    answer: replaceLinks(item.answer),
  }));
  return {
    title: "Dúvidas Frequentes",
    slug: "faq",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "mirBanner",
        desktopImage: media["731"],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      {
        blockType: "mirCards",
        title: "Canais de atendimento",
        style: "contact",
        items: plan.support.map((s) => ({
          title: s.title,
          content: lexical(`<p>${s.description}</p>`),
          image: media[s.image],
          imagePresentation: { size: "small", aspectRatio: "1:1", fit: "cover" },
          ...(s.clickable ? {
            link: { type: "external", url: s.url, label: s.label, newTab: true },
          } : {}),
        })),
      },
      ...[items.slice(0, 15), items.slice(15)].map((items, i) => ({
        blockType: "faqAccordion",
        title: faqTitles[i],
        variant: "default",
        items,
      })),
      {
        blockType: "imageBlock",
        media: media["1096"],
        imagePresentation: {
          size: "small",
          aspectRatio: "original",
          fit: "contain",
        },
      },
    ],
  };
}
export function applyFaq(
  plan: FaqPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  return applyPage(plan, store, state, save, {
    id: "174",
    slug: "faq",
    folders: ["MIR", "MIR/FAQ", "MIR/FAQ/Imagens", "MIR/FAQ/Manuais"],
    // Include URLs so an imported FAQ with legacy links is updated even when all other text is identical.
    sourceFingerprint: (data) => JSON.stringify(data),
    build: async (media) => {
      const urls: Record<string, string> = {};
      for (const manual of faqManuals) {
        const document = await store.get("media", media[manual.id]);
        if (
          document.mimeType !== "application/pdf" ||
          typeof document.url !== "string" ||
          !document.url
        )
          throw new Error(`Media PDF sem URL: ${manual.id}`);
        urls[manual.id] = document.url;
      }
      return faqData(plan, media, urls);
    },
  });
}
