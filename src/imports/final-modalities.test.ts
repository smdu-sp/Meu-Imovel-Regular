import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planDeclaratoria,
  declaratoriaData,
} from "./wordpress/pages/regularizacao-declaratoria.ts";
import { planComum, comumData } from "./wordpress/pages/regularizacao-comum.ts";
import {
  complexAlert,
  repairCommonLinks,
} from "./wordpress/shared/complex-modality.ts";
import {
  legacyTarget,
  localizeSiteLinks,
  linkURLs,
  type LinkAudit,
} from "./wordpress/shared/site-links.ts";
import { preparePage } from "./wordpress/run.ts";
import { importOrder } from "./wordpress/all.ts";
const source = "old-wordpress/db/meuimovelregular.sql",
  uploads = "old-wordpress/meuimovelregular/wp-content/uploads";

test("009 and 010 preserve twelve blocks, shared media, document links and the actual notice", async () => {
  for (const [planPage, dataPage, count, meta] of [
    [planDeclaratoria, declaratoriaData, 12, "4112"],
    [planComum, comumData, 11, "4115"],
  ] as const) {
    const plan = await planPage(source, uploads);
    const page = dataPage(
      plan,
      Object.fromEntries(plan.assets.map((a, i) => [a.id, 100 + i])),
    );
    assert.equal(plan.metaId, meta);
    assert.equal(plan.assets.length, count);
    assert.equal(page.layout.length, 12);
    assert.equal(page._status, "draft");
    const json = JSON.stringify(page);
    assert.match(json, /apenas um comunicado/);
    assert.match(json, /prorrogado/);
    assert.match(json, /60 \(sessenta\) dias/);
    assert.match(json, /30 \(trinta\) dias/);
    assert.match(json, /"type":"warning"/);
    assert.doesNotMatch(json, /wp-admin|dslca-|iframe|anistia|improrrogável/);
    assert.match(json, /"tag":"h1"/);
    assert.match(json, /"tag":"h2"/);
    assert.match(json, /"variant":"compact"/);
    assert.equal((json.match(/"type":"document"/g) || []).length, 4);
    assert.match(json, /decreto-59164-de-27-de-dezembro-de-2019/);
    assert.match(json, /modelos de peças gráficas/);
  }
  assert.throws(() => complexAlert("<p>Sem aviso</p>"));
  const repaired = repairCommonLinks(
    '<p><a href="https://meuimovelregular.prefeitura.sp.gov.br/wp-admin/admin.php?page=x">Lei 17.202</a><a href="http://legislacao.prefeitura.sp.gov.br/leis/lei-17202-de-16-de-outubro-de-2019">Decreto 59.164</a></p>',
  );
  assert.doesNotMatch(repaired, /wp-admin/);
  assert.match(repaired, /decreto-59164/);
});
test("Legacy links are mapped only to known routes, preserving query/hash and unrelated services", () => {
  const audit: LinkAudit[] = [];
  const input = {
    rich: {
      type: "link",
      fields: {
        linkType: "custom",
        url: "https://meuimovelregular.prefeitura.sp.gov.br//faq/?a=1#duvidas",
      },
    },
    action: {
      type: "external",
      url: "http://meuimovelregular.prefeitura.sp.gov.br/cartilha/",
      label: "Cartilha",
    },
    other: { url: "https://portaldelicenciamento.prefeitura.sp.gov.br/" },
    file: {
      url: "https://meuimovelregular.prefeitura.sp.gov.br/wp-content/uploads/missing.pdf",
    },
  };
  const result = localizeSiteLinks(input, { cartilha: 7 }, audit);
  assert.equal(result.rich.fields.url, "/faq?a=1#duvidas");
  assert.deepEqual(result.action, {
    type: "internal",
    page: 7,
    url: null,
    label: "Cartilha",
    newTab: false,
  });
  assert.equal(result.other.url, input.other.url);
  assert.equal(result.file.url, input.file.url);
  assert(audit.some((a) => a.status === "legacy-file"));
  assert.equal(input.action.type, "external");
  assert.equal(
    legacyTarget(
      "https://meuimovelregular.prefeitura.sp.gov.br.evil.test/faq/",
    ),
    null,
  );
  assert.equal(
    legacyTarget("https://meuimovelregular.prefeitura.sp.gov.br/?page_id=174")
      ?.path,
    "/faq",
  );
  assert.equal(
    legacyTarget("https://meuimovelregular.prefeitura.sp.gov.br/wp-admin/")
      ?.status,
    "unmapped",
  );
});
test("All ten page compositions audit known legacy page links and localize rich text offline", async () => {
  assert.equal(importOrder.length, 10);
  for (const slug of importOrder) {
    const page = await preparePage(slug, source, uploads);
    const audit: LinkAudit[] = [];
    const data = localizeSiteLinks(
      page.data({}, Object.fromEntries(importOrder.map((s, i) => [s, i + 1]))),
      Object.fromEntries([
        ...[...importOrder.map((s, i) => [s, i + 1])],
        ["beneficios-de-regularizar-o-imovel", 99],
      ]),
      audit,
    );
    const remaining = linkURLs(data).map(legacyTarget).filter(Boolean);
    assert(
      remaining.every((target) => !target?.slug),
      slug + ": unresolved legacy page link",
    );
    assert(
      !audit.some((a) => a.status === "unmapped"),
      slug + ": unmapped destination",
    );
  }
});
