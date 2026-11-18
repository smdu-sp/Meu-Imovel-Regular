import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  argumentsFor,
  preparePage,
  run,
  openImportSession,
  type ImportSession,
} from "./run.ts";
export const importOrder = [
  "home",
  "cartilha",
  "situacao",
  "beneficios",
  "regularizacao-automatica",
  "regularizacao-declaratoria-simplificada",
  "regularizacao-declaratoria",
  "regularizacao-comum",
  "entenda",
  "faq",
] as const;
export async function importAll(
  args = process.argv.slice(2),
  settings: { print?: boolean } = {},
) {
  const options = argumentsFor(["home", ...args]);
  const source = options.source || "old-wordpress/db/meuimovelregular.sql";
  const uploads =
    options.uploads || "old-wordpress/meuimovelregular/wp-content/uploads";
  // Validate every source before the first write, including the two final modalities.
  const plans = [];
  for (const page of importOrder)
    plans.push(await preparePage(page, source, uploads));
  const stateDir = options["state-dir"] || ".local/wordpress-import";
  const batchDir = path.join(
    stateDir,
    "batches",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
  const summaryPath = options.report || path.join(batchDir, "summary.json");
  const protectedPaths = [
    source,
    ...plans.flatMap((p) => p.plan.assets.map((a) => a.filename)),
    path.join(stateDir, "manifest.json"),
    path.join(stateDir, "execution.lock"),
  ].map((p) => path.resolve(p));
  if (protectedPaths.includes(path.resolve(summaryPath)))
    throw new Error(
      "Relatório não pode substituir fonte ou estado operacional.",
    );
  const forwarded: string[] = [];
  for (const key of [
    "source",
    "uploads",
    "state-dir",
    "actor-id",
    "target-label",
  ] as const)
    if (options[key]) forwarded.push("--" + key, options[key]!);
  forwarded.push(options.apply ? "--apply" : "--dry-run");
  const summary: {
    mode: string;
    completed: boolean;
    pages: Record<string, unknown>[];
    error?: string;
  } = {
    mode: options.apply ? "apply" : "dry-run",
    completed: false,
    pages: [],
  };
  let failure: unknown;
  let session: ImportSession | undefined;
  try {
    if (options.apply) session = await openImportSession(options);
    // A second write pass resolves forward references after all ten drafts exist.
    for (let pass = 1; pass <= (options.apply ? 2 : 1); pass++)
      for (const page of importOrder) {
        if (settings.print !== false) console.log(`[${pass}] ${page}`);
        const reportPath = path.join(batchDir, `${pass}-${page}.json`);
        const report = await run([page, ...forwarded, "--report", reportPath], {
          print: false,
          session,
        });
        summary.pages.push({
          page,
          pass,
          pageId: (report.result as { pageId?: number } | undefined)?.pageId,
          report: reportPath,
          linkAudit: report.linkAudit,
        });
      }
    if (session) {
      await session.close();
      session = undefined;
    }
    summary.completed = true;
  } catch (error) {
    failure = error;
    summary.error = String(
      error instanceof Error ? error.message : "Falha na importação",
    ).replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[destino omitido]");
  }
  if (session) {
    try {
      await session.close();
    } catch (error) {
      failure ??= error;
      summary.completed = false;
      summary.error ??= "Falha ao fechar sessão; consulte o manifesto.";
    }
  }
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, JSON.stringify(summary, null, 2) + "\n", {
    mode: 0o600,
  });
  if (settings.print !== false)
    console.log(
      JSON.stringify(
        {
          mode: summary.mode,
          completed: summary.completed,
          report: summaryPath,
          error: summary.error,
        },
        null,
        2,
      ),
    );
  if (failure) throw failure;
  return summary;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  importAll().catch((error) => {
    console.error(
      String(
        error instanceof Error ? error.message : "Falha na importação",
      ).replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[destino omitido]"),
    );
    process.exitCode = 1;
  });
}
