import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planBeneficios,
  beneficiosData,
  beneficiosList,
} from "./wordpress/pages/beneficios.ts";
import { beneficiosImages } from "./wordpress/pages/beneficios-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";

test("Benefícios: snapshot validates images, original lists, link, alternation and reviewed claims", async () => {
  const plan = await planBeneficios(
    "old-wordpress/db/meuimovelregular.sql",
    "old-wordpress/meuimovelregular/wp-content/uploads",
  );
  assert.equal(plan.metaId, "4081");
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size]),
    beneficiosImages.map((a) => [a.id, a.hash, a.size]),
  );
  const page = beneficiosData(plan, {
    "736": 1,
    "711": 2,
    "712": 72,
    "713": 4,
    "325": 5,
  });
  assert.equal(page._status, "draft");
  assert.equal(page.lifecycleStatus, "active");
  assert.equal(page.slug, "beneficios-de-regularizar-o-imovel");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "fullWidthImageBanner",
      "richText",
      "imageText",
      "imageText",
      "imageText",
      "imageText",
    ],
  );
  assert.deepEqual(
    plan.sections.map((s) => s.variant),
    ["image-right", "image-left", "image-right", "image-left"],
  );
  assert.deepEqual(
    plan.sections.map((s) => s.content.root.children.at(-1)!.children.length),
    [4, 4, 5, 3],
  );
  assert.equal((page.layout[3] as { image: number }).image, 72);
  const json = JSON.stringify(page);
  assert.doesNotMatch(
    json,
    /anistia|total posse e garantia|completamente regular|<script/i,
  );
  assert.match(json, /hipóteses legais/);
  assert.match(json, /inventários e testamentos/);
  assert.match(json, /associações setoriais/);
  assert.equal((json.match(/"tag":"h1"/g) || []).length, 1);
  const intro = JSON.stringify(plan.intro);
  assert.match(
    intro,
    /http:\/\/legislacao.prefeitura.sp.gov.br\/leis\/lei-17202-de-16-de-outubro-de-2019/,
  );
});
test("Benefícios lists retain bold and line breaks and reject absent or duplicate lists", () => {
  const list = beneficiosList(
    "<ul><li>Pedido <strong>de licença</strong><br>municipal</li></ul>",
  );
  assert.equal(list.tag, "ul");
  assert.equal(list.children[0].value, 1);
  assert.equal(list.children[0].children[1].format, 1);
  assert.match(
    list.children[0].children.map((n) => n.text).join(""),
    /licença municipal/,
  );
  assert.throws(() => beneficiosList("<ul></ul>"));
  assert.throws(() => beneficiosList("<p>Sem lista</p>"));
  assert.throws(() => beneficiosList("<ul><li>A</li></ul><ul><li>B</li></ul>"));
});
test("Benefícios CLI runs offline with an invalid database URI", async () => {
  assert.equal(argumentsFor(["beneficios"]).page, "beneficios");
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run(["beneficios", "--dry-run"]);
    assert.equal(report.sourcePage, "210");
    assert.equal(report.sourceMeta, "4081");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
