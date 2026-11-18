import { assets } from "./regularizacao-comum-content.ts";
import {
  planComplex,
  complexData,
  applyComplex,
  type ComplexConfig,
  type ComplexPlan,
} from "../shared/complex-modality.ts";
import type { Store } from "../shared/apply.ts";
import type { State } from "../shared/migration-manifest.ts";
export const comumConfig: ComplexConfig = {
  id: "206",
  slug: "regularizacao-comum",
  title: "Regularização Comum",
  folder: "Comum",
  count: 21,
  assets,
  positions: [-1, 2, 7, 10, 13, 15, 18],
  intro: [0],
  requirements: 4,
  topics: [
    {
      title: "Tipos de uso",
      image: "1125",
      text: "Edificações não enquadradas nas modalidades anteriores, incluindo diferentes tipos de uso e área construída acima de 1.500 m², conforme os critérios da modalidade Comum.",
    },
    { title: "Anuências", image: "1126", body: 6 },
    { title: "Impedimentos", image: "1127", body: 9 },
    { title: "Outorga Onerosa", image: "1116", body: 12 },
    { title: "Cálculo da Outorga Onerosa", image: "1120", body: 14 },
  ],
  requestTitle: 16,
  request: 17,
  manuals: 19,
  alert: 20,
};
export const planComum = (source: string, uploads: string) =>
  planComplex(comumConfig, source, uploads);
export const comumData = (plan: ComplexPlan, media: Record<string, number>) =>
  complexData(comumConfig, plan, media);
export const applyComum = (
  plan: ComplexPlan,
  store: Store,
  state: State,
  save: () => Promise<void>,
) => applyComplex(comumConfig, plan, store, state, save);
