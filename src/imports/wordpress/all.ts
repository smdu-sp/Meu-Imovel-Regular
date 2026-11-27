import { planHeader } from "./globals/header.ts";
import { planFooter } from "./globals/footer.ts";
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
import { resolveSourceFile, resolveUploadsRoot } from "./shared/source.ts";
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
export const globalImportOrder = ["header", "footer"] as const;
export async function importAll(
  args = process.argv.slice(2),
  settings: { print?: boolean } = {},
) {
  const options = argumentsFor(["home", ...args]);
  const source = resolveSourceFile(options.source);
  const uploads = resolveUploadsRoot(options.uploads);
  // Validate every source before the first write, including the two final modalities.
  const plans = [];
  for (const page of importOrder)
    plans.push(await preparePage(page, source, uploads));
  const globals = [
    await planHeader(source, uploads),
    await planFooter(source, uploads),
  ];
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
    ...globals.flatMap((plan) => plan.assets.map((asset) => asset.filename)),
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
    if (options.apply) session = await openImportSession(options, "both");
    const execute = async (target: string, pass: number) => {
      if (settings.print !== false) console.log(`[${pass}] ${target}`);
      const reportPath = path.join(batchDir, `${pass}-${target}.json`);
      const report = await run([target, ...forwarded, "--report", reportPath], {
        print: false,
        session,
      });
      const result = report.result as
        { pageId?: number; globalId?: number } | undefined;
      summary.pages.push({
        page: target,
        pass,
        pageId: result?.pageId,
        globalId: result?.globalId,
        report: reportPath,
        linkAudit: report.linkAudit,
      });
    };
    // Resolve all page references before importing the site shell once.
    for (let pass = 1; pass <= (options.apply ? 2 : 1); pass++)
      for (const page of importOrder) await execute(page, pass);
    for (const global of globalImportOrder)
      await execute(global, options.apply ? 3 : 1);
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
