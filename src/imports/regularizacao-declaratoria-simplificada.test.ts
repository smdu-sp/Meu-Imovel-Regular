import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planSimplificada,
  simplificadaData,
  simplificadaAlert,
} from "./wordpress/pages/regularizacao-declaratoria-simplificada.ts";
import { simplificadaAssets } from "./wordpress/pages/regularizacao-declaratoria-simplificada-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import {
  resolveSourceFile,
  resolveUploadsRoot,
} from "./wordpress/shared/source.ts";

test("Simplificada snapshot preserves source requirements, nine assets and the critical notice", async () => {
  const plan = await planSimplificada(
    resolveSourceFile(),
    resolveUploadsRoot(),
  );
  assert.equal(plan.metaId, "4109");
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
    simplificadaAssets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
  );
  const page = simplificadaData(
    plan,
    Object.fromEntries(plan.assets.map((a, i) => [a.id, 100 + i])),
  );
  assert.equal(page.slug, "regularizacao-declaratoria-simplificada");
  assert.equal(page._status, "draft");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "fullWidthImageBanner",
      "richText",
      "imageText",
      "imageText",
      "imageText",
      "richText",
      "imageBlock",
      "iconGrid",
      "alertBox",
    ],
  );
  assert.deepEqual(
    plan.topics.map((t) => t.variant),
    ["image-right", "image-left", "image-right"],
  );
  const json = JSON.stringify(page);
  assert.doesNotMatch(
    json,
    /anisti|wp-content|_compressed.pdf|indeferimento sumário|<iframe|<script/i,
  );
  assert.match(json, /"tag":"h1"/);
  assert.match(json, /"tag":"h2"/);
  assert.match(json, /500 m²/);
  assert.match(json, /31 de julho de 2014/);
  assert.match(json, /transcrição ou matrícula/);
  assert.match(json, /R\$ 10,00/);
  assert.match(json, /profissional habilitado/);
  assert.match(json, /não cria protocolo nem garante deferimento/);
  assert.match(json, /portaldelicenciamento.prefeitura.sp.gov.br/);
  assert.match(json, /não se admite a emissão de comunicado/);
  assert.match(json, /CCIR/);
  assert.match(json, /Certificado de Quitação de ISS/);
  assert.match(json, /parcelamento do solo/);
  const grid = page.layout[7] as {
    variant: string;
    items: { link: unknown }[];
  };
  assert.equal(grid.variant, "compact");
  assert.deepEqual(
    grid.items.map((i) => i.link),
    [105, 106, 107, 108].map((document) => ({
      type: "document",
      document,
      label: "Baixar PDF",
    })),
  );
  const alert = page.layout[8];
  assert("type" in alert);
  assert.equal(alert.type, "danger");
  const cases = plan.alert.root.children.at(-1)!;
  assert.equal(cases.children.length, 8);
});
test("Simplificada refuses a missing warning or changed referral list", () => {
  assert.throws(
    () => simplificadaAlert("<p>Outro aviso</p>"),
    /ausência de comunicado/,
  );
  assert.throws(
    () =>
      simplificadaAlert(
        "<p>No procedimento declaratório simplificado não se admite a emissão de comunicado.</p><p>I - Apresentar Certificado</p>",
      ),
    /oito encaminhamentos/,
  );
});
test("Simplificada CLI simulates offline without a database", async () => {
  assert.equal(
    argumentsFor(["regularizacao-declaratoria-simplificada"]).page,
    "regularizacao-declaratoria-simplificada",
  );
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run([
      "regularizacao-declaratoria-simplificada",
      "--dry-run",
    ]);
    assert.equal(report.sourcePage, "760");
    assert.equal(report.sourceMeta, "4109");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
