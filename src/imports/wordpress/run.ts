import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { planHome, homeData } from "./pages/home.ts";
import { applyHome, type Store } from "./shared/apply.ts";
import { planEntenda, entendaData, applyEntenda } from "./pages/entenda.ts";
import {
  planBeneficios,
  beneficiosData,
  applyBeneficios,
} from "./pages/beneficios.ts";
import { planSituacao, situacaoData, applySituacao } from "./pages/situacao.ts";
import { planFaq, faqData, applyFaq } from "./pages/faq.ts";
import { planCartilha, cartilhaData, applyCartilha } from "./pages/cartilha.ts";
import {
  planAutomatica,
  automaticaData,
  applyAutomatica,
} from "./pages/regularizacao-automatica.ts";
import type { State } from "./shared/migration-manifest.ts";
import {
  openManifest,
  targetFingerprint,
} from "./shared/migration-manifest.ts";
import { SNAPSHOT } from "./shared/source.ts";

export function argumentsFor(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      "dry-run": { type: "boolean" },
      apply: { type: "boolean" },
      "actor-id": { type: "string" },
      "target-label": { type: "string" },
      source: { type: "string" },
      uploads: { type: "string" },
      "state-dir": { type: "string" },
      report: { type: "string" },
    },
  });
  if (
    positionals.length !== 1 ||
    ![
      "home",
      "entenda",
      "beneficios",
      "situacao",
      "faq",
      "cartilha",
      "regularizacao-automatica",
    ].includes(positionals[0])
  )
    throw new Error(
      "Informe somente a página home, entenda, beneficios, situacao, faq, cartilha ou regularizacao-automatica.",
    );
  if (values.apply && values["dry-run"])
    throw new Error("Modos incompatíveis.");
  if (
    values.apply &&
    (!/^[1-9]\d*$/.test(values["actor-id"] || "") || !values["target-label"])
  )
    throw new Error("--apply exige --actor-id e --target-label.");
  return { ...values, page: positionals[0] };
}
export async function run(args = process.argv.slice(2)) {
  const options = argumentsFor(args);
  const source = options.source || "old-wordpress/db/meuimovelregular.sql";
  const uploads =
    options.uploads || "old-wordpress/meuimovelregular/wp-content/uploads";
  const prepared =
    options.page === "home"
      ? await (async () => {
          const plan = await planHome(source, uploads);
          return {
            plan,
            id: "87",
            metaId: "4142",
            sections: [0, 1, 2, 3, 4, 6, 7, 10],
            data: (media: Record<string, number>) => homeData(plan, media),
            apply: (store: Store, state: State, save: () => Promise<void>) =>
              applyHome(plan, store, state, save),
          };
        })()
      : options.page === "regularizacao-automatica"
        ? await (async () => {
            const plan = await planAutomatica(source, uploads);
            return {
              plan,
              id: "193",
              metaId: plan.metaId,
              sections: [0, 1],
              data: (media: Record<string, number>) =>
                automaticaData(plan, media),
              apply: (store: Store, state: State, save: () => Promise<void>) =>
                applyAutomatica(plan, store, state, save),
            };
          })()
        : options.page === "cartilha"
          ? await (async () => {
              const plan = await planCartilha(source, uploads);
              return {
                plan,
                id: "1145",
                metaId: plan.metaId,
                sections: [0, 1],
                data: (media: Record<string, number>) =>
                  cartilhaData(plan, media),
                apply: (
                  store: Store,
                  state: State,
                  save: () => Promise<void>,
                ) => applyCartilha(plan, store, state, save),
              };
            })()
          : options.page === "faq"
            ? await (async () => {
                const plan = await planFaq(source, uploads);
                return {
                  plan,
                  id: "174",
                  metaId: plan.metaId,
                  sections: [0, 1, 2, 3],
                  data: (media: Record<string, number>) => faqData(plan, media),
                  apply: (
                    store: Store,
                    state: State,
                    save: () => Promise<void>,
                  ) => applyFaq(plan, store, state, save),
                };
              })()
            : options.page === "situacao"
              ? await (async () => {
                  const plan = await planSituacao(source, uploads);
                  return {
                    plan,
                    id: "176",
                    metaId: plan.metaId,
                    sections: [0, 1],
                    data: (media: Record<string, number>) =>
                      situacaoData(plan, media),
                    apply: (
                      store: Store,
                      state: State,
                      save: () => Promise<void>,
                    ) => applySituacao(plan, store, state, save),
                  };
                })()
              : options.page === "beneficios"
                ? await (async () => {
                    const plan = await planBeneficios(source, uploads);
                    return {
                      plan,
                      id: "210",
                      metaId: plan.metaId,
                      sections: [0, 1, 2, 3, 4, 5],
                      data: (media: Record<string, number>) =>
                        beneficiosData(plan, media),
                      apply: (
                        store: Store,
                        state: State,
                        save: () => Promise<void>,
                      ) => applyBeneficios(plan, store, state, save),
                    };
                  })()
                : await (async () => {
                    const plan = await planEntenda(source, uploads);
                    return {
                      plan,
                      id: "172",
                      metaId: plan.metaId,
                      sections: [0, 1, 2, 3, 4, 5, 6],
                      data: (media: Record<string, number>) =>
                        entendaData(plan, media),
                      apply: (
                        store: Store,
                        state: State,
                        save: () => Promise<void>,
                      ) => applyEntenda(plan, store, state, save),
                    };
                  })();
  const plan = prepared.plan;
  const symbolic = Object.fromEntries(
    plan.assets.map((a, i) => [a.id, -(i + 1)]),
  );
  const report: Record<string, unknown> = {
    mode: options.apply ? "apply" : "dry-run",
    snapshot: SNAPSHOT,
    converterVersion: 1,
    origin: {
      file: options.source || "old-wordpress/db/meuimovelregular.sql",
      postId: prepared.id,
      metaId: prepared.metaId,
      sections: prepared.sections,
    },
    sourcePage: prepared.id,
    sourceMeta: prepared.metaId,
    destinationState: "não verificado",
    assets: plan.assets.map((a) => ({
      id: a.id,
      title: a.title,
      alt: a.alt,
      relative: a.relative,
      hash: a.hash,
      mimeType: a.mimeType,
      size: a.size,
      usage: a.usage,
      folder: a.folder,
    })),
    layout: prepared.data(symbolic),
    adjustments: plan.adjustments,
    pending: plan.pending,
  };
  if (options.report) {
    const target = path.resolve(options.report);
    const stateDir = path.resolve(
      options["state-dir"] || ".local/wordpress-import",
    );
    if (
      [
        path.resolve(options.source || "old-wordpress/db/meuimovelregular.sql"),
        ...plan.assets.map((a) => a.filename),
        path.join(stateDir, "manifest.json"),
        path.join(stateDir, "execution.lock"),
      ].includes(target)
    )
      throw new Error(
        "Relatório não pode substituir fonte ou estado operacional.",
      );
  }
  let failure: unknown;
  try {
    if (options.apply) {
      // Only the write path loads environment files or imports the Payload runtime.
      if (!process.env.NODE_ENV)
        Object.assign(process.env, { NODE_ENV: "development" });
      // @next/env is CommonJS. require avoids default/named export differences
      // between native Node ESM and the tsx entry point used by this CLI.
      const { loadEnvConfig } = createRequire(import.meta.url)(
        "@next/env",
      ) as typeof import("@next/env");
      loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
        info: () => {},
        error: () => {},
      });
      const uri = process.env.DATABASE_URI;
      if (!uri) throw new Error("Defina DATABASE_URI explicitamente.");
      const target = targetFingerprint(uri);
      const state = await openManifest(
        options["state-dir"] || ".local/wordpress-import",
        target,
        options["target-label"]!,
        SNAPSHOT,
      );
      try {
        const { connectStore } = await import("./shared/payload-store.ts");
        const connection = await connectStore(uri, Number(options["actor-id"]));
        try {
          report.result = await prepared.apply(
            connection.store,
            state.state,
            state.save,
          );
          report.destinationState = "verificado";
        } finally {
          await connection.close();
        }
      } finally {
        await state.close();
      }
    }
  } catch (error) {
    failure = error;
    report.error = String(
      error instanceof Error ? error.message : "Falha na aplicação",
    ).replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[destino omitido]");
    report.destinationState = "falha; consultar checkpoints antes de retomar";
  }
  const output = JSON.stringify(report, null, 2) + "\n";
  if (options.report) {
    await mkdir(path.dirname(options.report), { recursive: true });
    await writeFile(options.report, output, { mode: 0o600 });
  } else if (options.apply) {
    const dir = options["state-dir"] || ".local/wordpress-import";
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `report-${Date.now()}.json`), output, {
      mode: 0o600,
    });
  }
  console.log(output);
  if (failure) throw failure;
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  run().catch((e) => {
    console.error(
      String(e instanceof Error ? e.message : "Falha no importador.").replace(
        /postgres(?:ql)?:\/\/[^\s]+/gi,
        "[destino omitido]",
      ),
    );
    process.exitCode = 1;
  });
}
