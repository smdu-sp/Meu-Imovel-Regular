import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planEntenda,
  entendaData,
  entendaLexical,
} from "./wordpress/pages/entenda.ts";
import { entendaImages } from "./wordpress/pages/entenda-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import { parseVideoEmbedUrl } from "../blocks/VideoBlock/video-embed.ts";
const source = "old-wordpress/db/meuimovelregular.sql";
const uploads = "old-wordpress/meuimovelregular/wp-content/uploads";

test("Entenda extracts five verified images and eight blocks with source headings and external lists", async () => {
  const plan = await planEntenda(source, uploads);
  assert.equal(plan.metaId, "4160");
  assert.equal(plan.assets.length, 5);
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size]),
    entendaImages.map((a) => [a.id, a.hash, a.size]),
  );
  const ids = Object.fromEntries(plan.assets.map((a, i) => [a.id, 100 + i]));
  const page = entendaData(plan, ids);
  assert.equal(page.slug, "entenda");
  assert.equal(page._status, "draft");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "fullWidthImageBanner",
      "richText",
      "videoBlock",
      "richText",
      "imageText",
      "imageText",
      "imageText",
      "imageText",
    ],
  );
  const json = JSON.stringify(page);
  assert.doesNotMatch(json, /anistia|<iframe|<script/i);
  assert.match(json, /"tag":"h1"/);
  assert.match(json, /"tag":"h2"/);
  assert.match(
    json,
    /Lei-de-Regularizacao-de-Edificacoes-Edificacoes-Regularizadas-Automatico.pdf/,
  );
  assert.match(
    json,
    /Lei-de-Regularizacao-de-Edificacoes-Edificacoes-Regularizadas-Automatico.xls/,
  );
  assert.match(json, /lei-17202-de-16-de-outubro-de-2019/);
  assert.equal(parseVideoEmbedUrl(plan.video.url)?.id, "ECumpvJ-Yb8");
  assert.equal(
    plan.sections[1].url,
    "https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria-simplificada/",
  );
  const linked = entendaData(plan, ids, {
    "regularizacao-declaratoria-simplificada": 81,
  });
  const linkedModality = linked.layout[5];
  assert("cta" in linkedModality);
  assert.equal(linkedModality.cta?.page, 81);
  const legacyModality = page.layout[5];
  assert("cta" in legacyModality);
  assert.equal(legacyModality.cta?.type, "external");
  assert.deepEqual(
    plan.sections.map((s) => s.variant),
    ["image-right", "image-left", "image-right", "image-left"],
  );
});
test("Entenda text conversion preserves headings, paragraphs and links and refuses empty input", () => {
  const rich = entendaLexical(
    '<h1>Título</h1><p>Leia <a href="https://example.test/list.pdf">a lista</a>.</p>',
  );
  assert.match(JSON.stringify(rich), /"type":"heading"/);
  assert.match(JSON.stringify(rich), /https:\/\/example.test\/list.pdf/);
  assert.throws(() => entendaLexical("<h1> </h1>"));
});
test("Entenda CLI simulates offline without loading a database", async () => {
  assert.equal(argumentsFor(["entenda"]).page, "entenda");
  assert.throws(() => argumentsFor(["outra"]));
  const old = process.env.DATABASE_URI;
  process.env.DATABASE_URI = "invalid-offline";
  const log = console.log;
  console.log = () => {};
  try {
    const report = await run(["entenda", "--dry-run"]);
    assert.equal(report.sourcePage, "172");
    assert.equal(report.sourceMeta, "4160");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
