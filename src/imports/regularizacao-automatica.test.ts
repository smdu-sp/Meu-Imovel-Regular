import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planAutomatica,
  automaticaData,
  automaticaManualLinks,
} from "./wordpress/pages/regularizacao-automatica.ts";
import { automaticaAssets } from "./wordpress/pages/regularizacao-automatica-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import {
  resolveSourceFile,
  resolveUploadsRoot,
} from "./wordpress/shared/source.ts";

test("Automática validates nine assets, source content and four local document actions", async () => {
  const plan = await planAutomatica(
    resolveSourceFile(),
    resolveUploadsRoot(),
  );
  assert.equal(plan.metaId, "4106");
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
    automaticaAssets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
  );
  const page = automaticaData(
    plan,
    Object.fromEntries(plan.assets.map((a, i) => [a.id, 100 + i])),
  );
  assert.equal(page.slug, "regularizacao-automatica");
  assert.equal(page._status, "draft");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "mirBanner",
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
    page.layout
      .slice(2, 5)
      .map((block) => ("variant" in block ? block.variant : undefined)),
    ["image-bottom", "image-bottom", "image-bottom"],
  );
  assert.deepEqual(
    plan.topics.map((t) => t.variant),
    ["image-right", "image-left", "image-right"],
  );
  const json = JSON.stringify(page);
  assert.doesNotMatch(
    json,
    /anisti|<iframe|<script|_compressed.pdf|wp-content|\.xls/i,
  );
  assert.match(json, /Edificacoes-Regularizadas-Automatico.pdf/);
  assert.match(json, /"tag":"h1"/);
  assert.match(json, /"tag":"h2"/);
  assert.match(json, /isenção total/);
  assert.match(json, /31 de julho de 2014/);
  assert.match(json, /"type":"list"/);
  assert.match(json, /ZOE/);
  assert.match(json, /ZEPAM/);
  assert.match(json, /ZLT/);
  assert.match(json, /não emite certificado/);
  assert.match(json, /prefeitura.sp.gov.br\/situacao/);
  assert.match(json, /não será cobrado qualquer tipo de taxa/);
  assert.match(json, /regularizacao-declaratoria/);
  assert.match(json, /regularizacao-comum/);
  const grid = page.layout[7] as {
    variant: string;
    items: { link: { type: string; document: number } }[];
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
  assert.equal(alert.type, "info");
  assert(
    plan.adjustments.some((a) => a.includes("1196") && a.includes("1191")),
  );
});
test("Automática refuses missing or changed original manual destinations", () => {
  assert.throws(() =>
    automaticaManualLinks(
      '<p><a href="https://example.test/manual.pdf">Manual</a></p>',
    ),
  );
  assert.throws(() => automaticaManualLinks("<p>Sem manuais</p>"));
});
test("Automática CLI simulates without a database", async () => {
  assert.equal(
    argumentsFor(["regularizacao-automatica"]).page,
    "regularizacao-automatica",
  );
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run(["regularizacao-automatica", "--dry-run"]);
    assert.equal(report.sourcePage, "193");
    assert.equal(report.sourceMeta, "4106");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
