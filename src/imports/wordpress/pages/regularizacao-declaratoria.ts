import { assets } from "./regularizacao-declaratoria-content.ts";
import {
  planComplex,
  complexData,
  applyComplex,
  type ComplexConfig,
  type ComplexPlan,
} from "../shared/complex-modality.ts";
import type { Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";
export const declaratoriaConfig: ComplexConfig = {
  id: "204",
  slug: "regularizacao-declaratoria",
  title: "Regularização Declaratória",
  folder: "Declaratoria",
  count: 23,
  assets,
  positions: [-1, 3, 6, 9, 12, 15, 17, 20],
  intro: [0, 1],
  topics: [
    {
      title: "Tipos de uso",
      image: "1113",
      text: "Usos residenciais unifamiliares e multifamiliares, HIS e HMP, usos mistos, comércios, escritórios, pousadas e locais de culto, conforme os critérios apresentados nesta modalidade.",
    },
    { title: "Exigências", image: "1111", body: 5 },
    { title: "Anuências obrigatórias", image: "1117", body: 8 },
    { title: "Impedimentos", image: "1119", body: 11 },
    { title: "Outorga Onerosa", image: "1116", body: 14 },
    { title: "Cálculo da Outorga Onerosa", image: "1120", body: 16 },
  ],
  requestTitle: 18,
  request: 19,
  manuals: 21,
  alert: 22,
};
export const planDeclaratoria = (source: string, uploads: string) =>
  planComplex(declaratoriaConfig, source, uploads);
export const declaratoriaData = (
  plan: ComplexPlan,
  media: Record<string, number>,
) => complexData(declaratoriaConfig, plan, media);
export const applyDeclaratoria = (
  plan: ComplexPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) => applyComplex(declaratoriaConfig, plan, store, state, save);
