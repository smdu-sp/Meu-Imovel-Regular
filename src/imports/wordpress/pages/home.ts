import { images, documents, adjustments, pending } from "./home-content.ts";
import { exactly, loadSource, safeAsset } from "../shared/source.ts";

const decode = (s: string) =>
  s
    .replace(/\\"/g, '"')
    .replace(
      /&(?:nbsp|amp|quot|lt|gt|apos);/g,
      (x) =>
        ({
          "&nbsp;": " ",
          "&amp;": "&",
          "&quot;": '"',
          "&lt;": "<",
          "&gt;": ">",
          "&apos;": "'",
        })[x]!,
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
export const plain = (s: string) =>
  decode(s.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
const textNode = (text: string) => ({
  type: "text",
  version: 1,
  text,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
});
export function lexical(html: string) {
  const paragraphs = [
    ...decode(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi),
  ].map((m) => m[1]);
  if (!paragraphs.length) throw new Error("Texto editorial sem parágrafos.");
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: paragraphs
        .filter((p) => plain(p))
        .map((p) => {
          const children: object[] = [];
          let end = 0;
          for (const m of p.matchAll(
            /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
          )) {
            const before = plain(p.slice(end, m.index));
            if (before) children.push(textNode(before + " "));
            children.push({
              type: "link",
              version: 3,
              direction: null,
              format: "",
              indent: 0,
              fields: { linkType: "custom", url: m[1], newTab: false },
              children: [textNode(plain(m[2]))],
            });
            end = m.index! + m[0].length;
          }
          const tail = plain(p.slice(end));
          if (tail) children.push(textNode((end ? " " : "") + tail));
          return {
            type: "paragraph",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
            textFormat: 0,
            textStyle: "",
            children,
          };
        }),
    },
  };
}
export type HomePlan = Awaited<ReturnType<typeof planHome>>;
export async function planHome(source: string, uploads: string) {
  const { lc, meta } = await loadSource(source);
  const body = (row: number, area = 0, module = 0): string => {
    const value = lc[row]?.content?.[area]?.content?.[module]?.content;
    if (typeof value !== "string")
      throw new Error(`Conteúdo ausente: $[${row}]/${area}/${module}`);
    return decode(value);
  };
  const manualHtml = body(1);
  const manualLinks = [
    ...manualHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
  ];
  if (manualLinks.length !== 8) throw new Error("Esperados oito manuais.");
  const specs = [
    ...images.map(([id, title, alt]) => ({ id, title, alt })),
    ...documents.map((id, i) => ({
      id,
      title: plain(manualLinks[i][2]),
      alt: "",
    })),
  ];
  const assets = await Promise.all(
    specs.map(async (a) => {
      const relative = meta(a.id, "_wp_attached_file").meta_value;
      const file = await safeAsset(uploads, relative);
      const pdf = documents.includes(a.id);
      if ((file.mimeType === "application/pdf") !== pdf)
        throw new Error(`Tipo divergente do asset ${a.id}`);
      if (
        pdf &&
        decodeURIComponent(
          new URL(manualLinks[documents.indexOf(a.id)][1]).pathname,
        ).replace(/\/+/g, "/") !==
          "/wp-content/uploads/" + relative
      )
        throw new Error("Documento fora da ordem mapeada.");
      return {
        ...a,
        ...file,
        usage: pdf ? "document" : "content",
        folder: pdf ? "MIR/Home/Manuais" : "MIR/Home/Imagens",
      };
    }),
  );
  const modalityRows = [3, 4, 6, 7];
  const sections = modalityRows.map((row, i) => {
    const html = body(row, 0, i % 2 === 0 ? 0 : 1);
    const title = plain(
      exactly(
        [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)],
        `título ${row}`,
      )[1],
    );
    const url = exactly(
      [...html.matchAll(/href="([^"]+)"/g)],
      `link ${row}`,
    )[1];
    const content = html
      .replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, "")
      .replace(/<p[^>]*>\s*<a\b[\s\S]*?<\/p>/gi, "");
    return {
      title,
      url,
      content: lexical(content),
      image: images[i + 2][0],
      variant: i % 2 === 0 ? "image-right" : "image-left",
    };
  });
  const cards = [0, 1, 2].map((i) => {
    const html = body(10, i, 1);
    const url = exactly([...html.matchAll(/href="([^"]+)"/g)], "card link")[1];
    const title = plain(
      [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)][0]?.[1] || "",
    );
    return { title, url, image: images[i + 6][0] };
  });
  let intro = body(2)
    .replace(/,\s*também conhecida como Lei de Anistia,/g, ",")
    .replace(/poderão sre/g, "poderão ser");
  if (/anistia/i.test(plain(intro)))
    throw new Error("Terminologia institucional não revisada.");
  // Keep original parameters; only the explicitly documented editorial corrections apply.
  intro = intro.trim();
  const plan = {
    assets,
    sections,
    cards,
    intro: lexical(intro),
    portal: lc[0].content[0].content[1].link_url as string,
    heading: plain(manualHtml.split(/<br\s*\/?\s*>/i)[0]),
    adjustments,
    pending,
  };
  for (const section of sections)
    if (section.title.length > 100)
      throw new Error("Título de modalidade excede schema.");
  for (const card of cards)
    if (card.title.length > 80)
      throw new Error("Título de card excede schema.");
  return plan;
}
export function homeData(
  plan: HomePlan,
  media: Record<string, number>,
  pages: Record<string, number> = {},
) {
  const action = (url: string, label: string) => {
    const slug = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    return pages[slug]
      ? { type: "internal", page: pages[slug], label }
      : { type: "external", url, label };
  };
  const banner = (id: string) => ({
    blockType: "mirBanner",
    desktopImage: media[id],
    imageHeight: "auto",
    overlay: "none",
    imageFit: "contain",
    focalPoint: "center",
  });
  return {
    title: "Home",
    slug: "home",
    _status: "draft",
    lifecycleStatus: "active",
    layout: [
      banner("737"),
      {
        ...banner("791"),
        link: {
          enabled: true,
          type: "external",
          url: plan.portal,
          newTab: true,
        },
      },
      {
        blockType: "iconGrid",
        title: plan.heading,
        variant: "compact",
        appearance: { spacing: "compact", scheme: "default" },
        items: documents.map((id) => ({
          iconSource: "standard",
          standardIcon: "document",
          description: plan.assets.find((a) => a.id === id)!.title,
          link: { type: "document", document: media[id], label: "Baixar PDF" },
        })),
      },
      { blockType: "richText", content: plan.intro, variant: "default" },
      ...plan.sections.map((s) => ({
        blockType: "mirCards",
        style: "homeModality",
        items: [{
          title: s.title,
          content: s.content,
          image: media[s.image],
          imagePresentation: { size: "large", aspectRatio: "4:3", fit: "cover" },
          imagePosition: s.variant === "image-right" ? "left" : "right",
          link: action(s.url, "Saiba mais"),
        }],
      })),
      {
        blockType: "mirCards",
        style: "homeAction",
        items: plan.cards.map((c) => ({
          title: c.title,
          image: media[c.image],
          imagePresentation: { size: "large", aspectRatio: "4:3", fit: "cover" },
          link: action(c.url, "Confira aqui"),
        })),
      },
    ],
  };
}
