export type BlockSummaryData = {
  banners?: unknown[];
  blockType?: string;
  images?: unknown[];
  items?: unknown[];
  style?: string;
  title?: string;
};

const blockLabels: Record<string, string> = {
  actionBanners: "Faixas de ação",
  alertBox: "Caixa de aviso",
  carousel: "Carrossel",
  cards: "Cards e grades de benefícios",
  cta: "Chamada para ação",
  faqAccordion: "Perguntas frequentes",
  fullWidthImageBanner: "Banner de imagem full-width",
  gallery: "Galeria de imagens",
  hero: "Destaque principal",
  imageBlock: "Imagem",
  iconGrid: "Grade de ícones e informações",
  imageText: "Mídia e texto / imagem de destaque",
  mirBanner: "MIR: banner",
  mirCards: "MIR: cards",
  mirTextMedia: "MIR: texto e mídia",
  richText: "Texto editorial",
};

const mirCardStyleLabels: Record<string, string> = {
  homeModality: "MIR: modalidades da Home",
  homeAction: "MIR: chamadas da Home",
  lawModality: "MIR: modalidades de Entenda a Lei",
  benefit: "MIR: benefícios",
  contact: "MIR: atendimento",
};

const countLabels: Record<string, [string, string, keyof BlockSummaryData]> = {
  actionBanners: ["chamada", "chamadas", "banners"],
  carousel: ["slide", "slides", "items"],
  cards: ["item", "itens", "items"],
  faqAccordion: ["pergunta", "perguntas", "items"],
  gallery: ["imagem", "imagens", "images"],
  iconGrid: ["item", "itens", "items"],
  mirCards: ["card", "cards", "items"],
};

export function getBlockSummary(data: BlockSummaryData, rowNumber = 0): string {
  const blockType = data.blockType ?? "";
  const label = blockType === "mirCards" && data.style
    ? mirCardStyleLabels[data.style] ?? blockLabels.mirCards
    : blockLabels[blockType] ?? `Bloco ${rowNumber + 1}`;
  const parts = [label];

  if (typeof data.title === "string" && data.title.trim()) {
    parts.push(data.title.trim());
  } else if (blockType === "mirCards" && data.items?.length === 1) {
    const firstItem = data.items[0];
    if (firstItem && typeof firstItem === "object" && "title" in firstItem &&
      typeof firstItem.title === "string" && firstItem.title.trim()) {
      parts.push(firstItem.title.trim());
    }
  }

  const countConfig = countLabels[blockType];
  if (countConfig) {
    const [singular, plural, field] = countConfig;
    const count = Array.isArray(data[field]) ? data[field].length : 0;
    if (count > 0) {
      parts.push(`${count} ${count === 1 ? singular : plural}`);
    }
  }

  return parts.join(" — ");
}
