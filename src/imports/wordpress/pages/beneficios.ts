import { loadSource, safeAsset, exactly } from "../shared/source.ts";
import { plain, lexical } from "./home.ts";
import { entendaLexical } from "./entenda.ts";
import {
  beneficiosImages,
  beneficiosAdjustments,
  beneficiosPending,
} from "./beneficios-content.ts";
import { applyPage, type Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";

// The validated snapshot contains flat unordered lists with optional strong text.
export function beneficiosList(html: string) {
  const list = exactly(
    [...html.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi)],
    "lista de benefícios",
  )[1];
  const items = [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  if (!items.length) throw new Error("Lista de benefícios vazia.");
  const children = items.map((m, i) => {
    const parts = m[1]
      .replace(/<br\s*\/?\s*>/gi, " ")
      .split(/(<strong\b[^>]*>[\s\S]*?<\/strong>)/gi);
    return {
      type: "listitem",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      value: i + 1,
      children: parts.filter(Boolean).map((part) => ({
        type: "text",
        version: 1,
        text: plain(part) + " ",
        format: /^<strong/i.test(part) ? 1 : 0,
        detail: 0,
        mode: "normal",
        style: "",
      })),
    };
  });
  return {
    type: "list",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    listType: "bullet",
    tag: "ul",
    start: 1,
    children,
  };
}
export async function planBeneficios(source: string, uploads: string) {
  const { post, lc, meta } = await loadSource(source, "210", 6);
  if (
    post.post_name !== "beneficios-de-regularizar-o-imovel" ||
    post.post_title !== "Benefícios de Regularizar o imóvel"
  )
    throw new Error("Identidade Benefícios divergente.");
  const modules = (row: number) =>
    lc[row].content.flatMap(
      (a: { content: Record<string, string>[] }) => a.content,
    );
  const body = (row: number, index: number) => {
    const value = modules(row)[index]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: Benefícios $[${row}]/${index}`);
    return value.replace(/\\+"/g, '"');
  };
  const assets = await Promise.all(
    beneficiosImages.map(async (a, i) => {
      const row = i === 0 ? 0 : i + 1;
      if (
        modules(row)[0]?.image !== a.id ||
        meta(a.id, "_wp_attached_file").meta_value !== a.relative
      )
        throw new Error(`Origem da imagem divergente: ${a.id}`);
      const file = await safeAsset(uploads, a.relative);
      if (
        file.hash !== a.hash ||
        file.size !== a.size ||
        file.mimeType !== "image/jpeg"
      )
        throw new Error(`Asset divergente da MIR-003: ${a.id}`);
      return {
        ...a,
        ...file,
        usage: "content",
        folder: "MIR/Beneficios/Imagens",
      };
    }),
  );
  const introHtml = (body(1, 0) + body(1, 1)).replace(
    "tem como principal objetivo dar ao munícipe total posse e garantia sobre seu imóvel, tornando a edificação, tanto de residências quanto de comércios, completamente regular.",
    "estabelece condições para solicitar a regularização de edificações residenciais e comerciais, conforme os requisitos legais e a análise dos órgãos competentes.",
  );
  if (
    /total posse e garantia|completamente regular|anistia/i.test(
      plain(introHtml),
    )
  )
    throw new Error("Introdução Benefícios não revisada.");
  const sections = [2, 3, 4, 5].map((row, i) => {
    const html = body(row, 1).replace(
      "<strong>Regularizar</strong> sem incidência de Outorga Onerosa (inclusive para os imóveis que prestam serviços conveniados à Prefeitura)",
      "<strong>Verificar a possibilidade de regularização</strong> sem incidência de Outorga Onerosa, nas hipóteses legais aplicáveis aos imóveis institucionais e aos que prestam serviços conveniados à Prefeitura",
    );
    if (/anistia/i.test(plain(html)))
      throw new Error("Terminologia Benefícios não revisada.");
    const title = plain(
      exactly(
        [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)],
        "título de benefício",
      )[1],
    );
    if (title.length > 100) throw new Error("Título excede schema.");
    const content = lexical(
      "<p>Os benefícios dependem do enquadramento do imóvel e do atendimento aos requisitos legais e administrativos aplicáveis.</p>",
    );
    return {
      title,
      image: beneficiosImages[i + 1].id,
      variant: i % 2 === 0 ? "image-right" : "image-left",
      content: {
        root: {
          ...content.root,
          children: [...content.root.children, beneficiosList(html)],
        },
      },
    };
  });
  return {
    assets,
    sections,
    cards: [],
    intro: entendaLexical(introHtml),
    adjustments: beneficiosAdjustments,
    pending: beneficiosPending,
    metaId: meta("210", "dslc_code").meta_id,
  };
}
export type BeneficiosPlan = Awaited<ReturnType<typeof planBeneficios>>;
export function beneficiosData(
  plan: BeneficiosPlan,
  media: Record<string, number>,
) {
  return {
    title: "Benefícios de Regularizar o Imóvel",
    slug: "beneficios-de-regularizar-o-imovel",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      {
        blockType: "mirBanner",
        desktopImage: media["736"],
        imageHeight: "auto",
        overlay: "none",
        imageFit: "contain",
        focalPoint: "center",
      },
      { blockType: "richText", variant: "default", content: plan.intro },
      ...plan.sections.map((s) => ({
        blockType: "mirCards",
        style: "benefit",
        items: [{
          title: s.title,
          content: s.content,
          image: media[s.image],
          imagePresentation: { size: "large", aspectRatio: "original", fit: "cover" },
          imagePosition: s.variant === "image-right" ? "right" : "left",
        }],
      })),
    ],
  };
}
export function applyBeneficios(
  plan: BeneficiosPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) {
  // Benefits have no action links to resolve; section URLs belong to other converters.
  return applyPage({ ...plan, sections: [] }, store, state, save, {
    id: "210",
    slug: "beneficios-de-regularizar-o-imovel",
    folders: ["MIR", "MIR/Beneficios", "MIR/Beneficios/Imagens"],
    build: (media) => beneficiosData(plan, media),
  });
}
