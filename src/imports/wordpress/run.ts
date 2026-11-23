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
import {
  planSimplificada,
  simplificadaData,
  applySimplificada,
} from "./pages/regularizacao-declaratoria-simplificada.ts";
import {
  planDeclaratoria,
  declaratoriaData,
  applyDeclaratoria,
} from "./pages/regularizacao-declaratoria.ts";
import {
  planComum,
  comumData,
  applyComum,
} from "./pages/regularizacao-comum.ts";
import {
  localizeSiteLinks,
  sitePages,
  type LinkAudit,
} from "./shared/site-links.ts";
import type { State } from "./shared/migration-manifest.ts";
import {
  openManifest,
  targetFingerprint,
} from "./shared/migration-manifest.ts";
import {
  SNAPSHOT,
  resolveSourceFile,
  resolveUploadsRoot,
} from "./shared/source.ts";
import { applyHeader, headerData, planHeader } from "./globals/header.ts";
import { applyFooter, footerData, planFooter } from "./globals/footer.ts";

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
    !["header", "footer"].includes(positionals[0]) &&
    !Object.keys(sitePages).some(
      (key) =>
        key === positionals[0] ||
        (key === "beneficios-de-regularizar-o-imovel" &&
          positionals[0] === "beneficios"),
    )
  )
    throw new Error(
      "Informe uma página suportada, header ou footer: home, entenda, beneficios, situacao, faq, cartilha ou uma modalidade de regularizacao.",
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
export async function preparePage(
  page: string,
  source: string,
  uploads: string,
) {
  const factories = {
    home: async () => {
      const plan = await planHome(source, uploads);
      return {
        plan,
        id: "87",
        metaId: "4142",
        sections: [0, 1, 2, 3, 4, 6, 7, 10],
        data: (
          media: Record<string, number>,
          pages: Record<string, number> = {},
        ) => homeData(plan, media, pages),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyHome(plan, store, state, save),
      };
    },
    entenda: async () => {
      const plan = await planEntenda(source, uploads);
      return {
        plan,
        id: "172",
        metaId: plan.metaId,
        sections: [0, 1, 2, 3, 4, 5, 6],
        data: (
          media: Record<string, number>,
          pages: Record<string, number> = {},
        ) => entendaData(plan, media, pages),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyEntenda(plan, store, state, save),
      };
    },
    beneficios: async () => {
      const plan = await planBeneficios(source, uploads);
      return {
        plan,
        id: "210",
        metaId: plan.metaId,
        sections: [0, 1, 2, 3, 4, 5],
        data: (media: Record<string, number>) => beneficiosData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyBeneficios(plan, store, state, save),
      };
    },
    situacao: async () => {
      const plan = await planSituacao(source, uploads);
      return {
        plan,
        id: "176",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => situacaoData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applySituacao(plan, store, state, save),
      };
    },
    faq: async () => {
      const plan = await planFaq(source, uploads);
      return {
        plan,
        id: "174",
        metaId: plan.metaId,
        sections: [0, 1, 2, 3],
        data: (media: Record<string, number>) => faqData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyFaq(plan, store, state, save),
      };
    },
    cartilha: async () => {
      const plan = await planCartilha(source, uploads);
      return {
        plan,
        id: "1145",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => cartilhaData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyCartilha(plan, store, state, save),
      };
    },
    "regularizacao-automatica": async () => {
      const plan = await planAutomatica(source, uploads);
      return {
        plan,
        id: "193",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => automaticaData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyAutomatica(plan, store, state, save),
      };
    },
    "regularizacao-declaratoria-simplificada": async () => {
      const plan = await planSimplificada(source, uploads);
      return {
        plan,
        id: "760",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => simplificadaData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applySimplificada(plan, store, state, save),
      };
    },
    "regularizacao-declaratoria": async () => {
      const plan = await planDeclaratoria(source, uploads);
      return {
        plan,
        id: "204",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => declaratoriaData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyDeclaratoria(plan, store, state, save),
      };
    },
    "regularizacao-comum": async () => {
      const plan = await planComum(source, uploads);
      return {
        plan,
        id: "206",
        metaId: plan.metaId,
        sections: [0, 1],
        data: (media: Record<string, number>) => comumData(plan, media),
        apply: (store: Store, state: State, save: () => Promise<void>) =>
          applyComum(plan, store, state, save),
      };
    },
  };
  const factory = factories[page as keyof typeof factories];
  if (!factory) throw new Error("Página não suportada.");
  return factory();
}
export type ImportSession = {
  store: Store;
  state: State;
  save: () => Promise<void>;
  close: () => Promise<void>;
};
export async function openImportSession(
  options: ReturnType<typeof argumentsFor>,
): Promise<ImportSession> {
  if (!process.env.NODE_ENV)
    Object.assign(process.env, { NODE_ENV: "development" });
  const { loadEnvConfig } = createRequire(import.meta.url)(
    "@next/env",
  ) as typeof import("@next/env");
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
    info: () => {},
    error: () => {},
  });
  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error("Defina DATABASE_URI explicitamente.");
  const manifest = await openManifest(
    options["state-dir"] || ".local/wordpress-import",
    targetFingerprint(uri),
    options["target-label"]!,
    SNAPSHOT,
  );
  try {
    const { connectStore } = await import("./shared/payload-store.ts");
    const connection = await connectStore(
      uri,
      Number(options["actor-id"]),
      options.page === "footer" ? "footer" : "header",
    );
    return {
      store: connection.store,
      state: manifest.state,
      save: manifest.save,
      close: async () => {
        try {
          await connection.close();
        } finally {
          await manifest.close();
        }
      },
    };
  } catch (error) {
    await manifest.close();
    throw error;
  }
}
export async function run(
  args = process.argv.slice(2),
  settings: { print?: boolean; session?: ImportSession } = {},
) {
  const options = argumentsFor(args);
  const source = resolveSourceFile(options.source);
  const uploads = resolveUploadsRoot(options.uploads);
  if (options.page === "header" || options.page === "footer") {
    const prepared = options.page === "header"
      ? await (async () => {
          const plan = await planHeader(source, uploads);
          const symbolicMedia = Object.fromEntries(plan.assets.map((asset, index) => [asset.id, -(index + 1)]));
          const symbolicPages = Object.fromEntries(plan.menu.map((item, index) => [item.slug, -(index + 1)]));
          return {
            plan,
            origin: { file: source, postId: plan.postId, metaId: plan.metaId, menuIds: plan.menu.map((item) => item.id) },
            data: headerData(plan, symbolicMedia, symbolicPages),
            apply: (store: Store, state: State, save: () => Promise<void>) => applyHeader(plan, store, state, save),
          };
        })()
      : await (async () => {
          const plan = await planFooter(source, uploads);
          const symbolicMedia = Object.fromEntries(plan.assets.map((asset, index) => [asset.id, -(index + 1)]));
          return {
            plan,
            origin: { file: source, postId: plan.postId, metaId: plan.metaId },
            data: footerData(plan, symbolicMedia),
            apply: (store: Store, state: State, save: () => Promise<void>) => applyFooter(plan, store, state, save),
          };
        })();
    const { plan } = prepared;
    const report: Record<string, unknown> = {
      mode: options.apply ? "apply" : "dry-run",
      snapshot: SNAPSHOT,
      converterVersion: 1,
      origin: prepared.origin,
      destinationState: "não verificado",
      assets: plan.assets.map(({ id, title, alt, relative, hash, mimeType, size, usage, folder }) => ({
        id, title, alt, relative, hash, mimeType, size, usage, folder,
      })),
      ...(options.page === "header" ? { menu: (plan as Awaited<ReturnType<typeof planHeader>>).menu } : {}),
      [options.page]: prepared.data,
    };
    if (options.report) {
      const target = path.resolve(options.report);
      const stateDir = path.resolve(options["state-dir"] || ".local/wordpress-import");
      if ([
        path.resolve(source),
        ...plan.assets.map((asset) => asset.filename),
        path.join(stateDir, "manifest.json"),
        path.join(stateDir, "execution.lock"),
      ].includes(target))
        throw new Error("Relatório não pode substituir fonte ou estado operacional.");
    }
    let failure: unknown;
    try {
      if (options.apply) {
        const session = settings.session || (await openImportSession(options));
        try {
          report.result = await prepared.apply(session.store, session.state, session.save);
          report.destinationState = "verificado";
        } finally {
          if (!settings.session) await session.close();
        }
      }
    } catch (error) {
      failure = error;
      report.error = String(error instanceof Error ? error.message : "Falha na aplicação")
        .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[destino omitido]");
      report.destinationState = "falha; consultar checkpoints antes de retomar";
    }
    const output = JSON.stringify(report, null, 2) + "\n";
    if (options.report) {
      await mkdir(path.dirname(options.report), { recursive: true });
      await writeFile(options.report, output, { mode: 0o600 });
    } else if (options.apply) {
      const dir = options["state-dir"] || ".local/wordpress-import";
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `report-${Date.now()}.json`), output, { mode: 0o600 });
    }
    if (settings.print !== false) console.log(output);
    if (failure) throw failure;
    return report;
  }
  const prepared = await preparePage(options.page, source, uploads);
  const plan = prepared.plan;
  const symbolic = Object.fromEntries(
    plan.assets.map((a, i) => [a.id, -(i + 1)]),
  );
  const linkAudit: LinkAudit[] = [];
  const symbolicPages = Object.fromEntries(
    Object.keys(sitePages).map((slug, index) => [slug, -(index + 1)]),
  );
  const layout = localizeSiteLinks(
    prepared.data(symbolic, symbolicPages),
    symbolicPages,
    linkAudit,
  );
  const report: Record<string, unknown> = {
    mode: options.apply ? "apply" : "dry-run",
    snapshot: SNAPSHOT,
    converterVersion: 1,
    origin: {
      file: source,
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
    layout,
    linkAudit,
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
        path.resolve(source),
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
      const session = settings.session || (await openImportSession(options));
      try {
        report.result = await prepared.apply(
          session.store,
          session.state,
          session.save,
        );
        report.linkAudit = (
          report.result as { linkAudit: LinkAudit[] }
        ).linkAudit;
        report.destinationState = "verificado";
      } finally {
        if (!settings.session) await session.close();
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
  if (settings.print !== false) console.log(output);
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
