import { automaticaAssets } from "./regularizacao-automatica-content.ts";
export const simplificadaAssets = [
  {
    id: "777",
    relative: "2019/12/declaratoria-simplificada-banner.jpg",
    hash: "580288ca3254240e06fe82d627e41716b8b2206779395c08fac817f086a53254",
    mimeType: "image/jpeg",
    size: 36339,
    title: "Banner Regularização Declaratória Simplificada",
    alt: "Banner Regularização Declaratória Simplificada",
    usage: "content",
    folder: "MIR/Modalidades/DeclaratoriaSimplificada/Imagens",
  },
  {
    id: "1106",
    relative: "2020/01/Declaratória-Simplificada_tipo-de-uso.png",
    hash: "f8330e44155de2cd9b29e72d7f5bc2770d3fc972476c843cd4469d56368420bc",
    mimeType: "image/png",
    size: 25541,
    title: "Tipos de uso — Declaratória Simplificada",
    alt: "Tipos de uso — Declaratória Simplificada",
    usage: "content",
    folder: "MIR/Modalidades/DeclaratoriaSimplificada/Imagens",
  },
  {
    id: "1107",
    relative: "2020/01/Declaratória-Simplificada_exigências.png",
    hash: "341eb8255ae31496ffd86a02166637c70f535450bbb8662a2353446c0bab1dd3",
    mimeType: "image/png",
    size: 6657,
    title: "Exigências — Declaratória Simplificada",
    alt: "Exigências — Declaratória Simplificada",
    usage: "content",
    folder: "MIR/Modalidades/DeclaratoriaSimplificada/Imagens",
  },
  {
    id: "1108",
    relative: "2020/01/Declaratória-Simplificada_impedimentos.png",
    hash: "df672cefbff31be6ccbbc7caf68b760a4d84b752015f51c94219a24e48171544",
    mimeType: "image/png",
    size: 19180,
    title: "Impedimentos — Declaratória Simplificada",
    alt: "Impedimentos — Declaratória Simplificada",
    usage: "content",
    folder: "MIR/Modalidades/DeclaratoriaSimplificada/Imagens",
  },
  ...automaticaAssets
    .filter((a) => ["223", "1196", "1191", "1188", "1187"].includes(a.id))
    .map((a) => ({
      ...a,
      folder:
        "MIR/Modalidades/DeclaratoriaSimplificada/" +
        (a.usage === "document" ? "Manuais" : "Imagens"),
    })),
];
export const simplificadaAdjustments = [
  "Título principal convertido de H2 para H1; tópicos organizados em Mídia e Texto sem alteração de schema.",
  "Manuais Inicial e Peças Gráficas com caminhos legados indisponíveis substituídos pelos anexos 1196 (2023) e 1191 (2021) usados na Home.",
  "Infográfico 223 e quatro PDFs reutilizados pelo manifesto, preservando IDs, pastas e metadados existentes.",
  "Aviso crítico usa type=danger e preserva a ausência de comunicado e os oito casos de encaminhamento para a modalidade comum; indeferimento sumário não consta da fonte e não foi inventado.",
];
export const simplificadaPending = [
  "Revisar critérios, áreas, datas, taxas, impostos, documentos e regras do procedimento antes de publicar; o backup não comprova vigência nem elegibilidade.",
  "Conferir conteúdo e alternativas das imagens, créditos, leitura do infográfico, links do Portal, downloads e preview desktop/mobile.",
];
