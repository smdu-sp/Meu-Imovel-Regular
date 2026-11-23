import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planSituacao,
  situacaoData,
  situacaoInstructions,
} from "./wordpress/pages/situacao.ts";
import {
  situacaoImages,
  situacaoCediUrl,
} from "./wordpress/pages/situacao-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";

import {
  resolveSourceFile,
  resolveUploadsRoot,
} from "./wordpress/shared/source.ts";

test("Situação snapshot validates both media and five blocks with official forwarding and portal limits", async () => {
  const plan = await planSituacao(
    resolveSourceFile(),
    resolveUploadsRoot(),
  );
  assert.equal(plan.metaId, "4149");
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
    situacaoImages.map((a) => [a.id, a.hash, a.size, a.mimeType]),
  );
  const page = situacaoData(plan, { "739": 41, "718": 42 });
  assert.equal(page.slug, "situacao");
  assert.equal(page._status, "draft");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    ["fullWidthImageBanner", "richText", "imageBlock", "richText", "cta"],
  );
  assert.equal(page.layout[0].desktopImage, 41);
  assert.equal(page.layout[2].media, 42);
  assert.deepEqual(page.layout[4].action, {
    label: "Acessar Consulta do CEDI",
    type: "external",
    newTab: true,
    url: situacaoCediUrl,
  });
  const json = JSON.stringify(page);
  assert.doesNotMatch(
    json,
    /anistia|comprova a situação|<iframe|<script|captcha/i,
  );
  assert.match(json, /não declara oficialmente/);
  assert.match(json, /não substitui vistoria ou protocolo formal/);
  assert.match(json, /carnê do IPTU/);
  assert.match(json, /sem pontos, vírgulas ou traços/);
  assert.match(json, /"tag":"h1"/);
  assert.match(json, /"tag":"h2"/);
  const list = plan.instructions.root.children.at(-1)! as {
    tag: string;
    children: { value: number }[];
  };
  assert.equal(list.tag, "ol");
  assert.deepEqual(
    list.children.map((n) => n.value),
    [1, 2, 3],
  );
  assert.match(JSON.stringify(list), /"linkType":"custom"/);
  assert.match(JSON.stringify(list), /cediconshistorico.prefeitura.sp.gov.br/);
});
test("Situação rejects missing steps and changed service destination", () => {
  assert.throws(() =>
    situacaoInstructions("<h1>Como consultar?</h1><ul><li>Um passo</li></ul>"),
  );
  assert.throws(
    () =>
      situacaoInstructions(
        '<h1>Como consultar?</h1><ul><li><a href="https://example.test/">Outro destino</a></li><li>SQL</li><li>Resultado</li></ul>',
      ),
    /Destino CEDI/,
  );
});
test("Situação CLI prepares offline without accessing the database", async () => {
  assert.equal(argumentsFor(["situacao"]).page, "situacao");
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run(["situacao", "--dry-run"]);
    assert.equal(report.sourcePage, "176");
    assert.equal(report.sourceMeta, "4149");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
