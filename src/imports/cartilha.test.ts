import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planCartilha,
  cartilhaData,
  cartilhaEditorial,
} from "./wordpress/pages/cartilha.ts";
import { cartilhaAssets } from "./wordpress/pages/cartilha-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import { resolveLink } from "../lib/navigation/resolve-link.ts";
import type { Media } from "../payload-types";

test("Cartilha snapshot validates the JPEG/PDF, preserves introduction and relates the download CTA", async () => {
  const plan = await planCartilha(
    "old-wordpress/db/meuimovelregular.sql",
    "old-wordpress/meuimovelregular/wp-content/uploads",
  );
  assert.equal(plan.metaId, "4133");
  assert.deepEqual(
    plan.assets.map((a) => [
      a.id,
      a.hash,
      a.size,
      a.mimeType,
      a.usage,
      a.folder,
    ]),
    cartilhaAssets.map((a) => [
      a.id,
      a.hash,
      a.size,
      a.mimeType,
      a.usage,
      a.folder,
    ]),
  );
  const page = cartilhaData(plan, { "1150": 71, "1129": 72 });
  assert.equal(page.slug, "cartilha");
  assert.equal(page._status, "draft");
  assert.equal(page.lifecycleStatus, "active");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    ["fullWidthImageBanner", "richText", "cta"],
  );
  assert.equal(page.layout[0].desktopImage, 71);
  assert.deepEqual(page.layout[2].action, {
    label: "Baixar Cartilha Completa (PDF)",
    type: "document",
    document: 72,
    newTab: false,
  });
  const intro = JSON.stringify(plan.intro);
  assert.match(intro, /"tag":"h1"/);
  assert.match(intro, /SMUL/);
  assert.match(intro, /59.164\/2019/);
  assert.match(intro, /1º de janeiro de 2020/);
  assert.match(intro, /documentação exigida/);
  assert.doesNotMatch(
    JSON.stringify(page),
    /anistia|Clique aqui|wp-content|https?:\/\/|iframe|script/i,
  );
  const action = page.layout[2].action!;
  assert.deepEqual(
    resolveLink({
      ...action,
      type: "document",
      document: {
        id: 72,
        mimeType: "application/pdf",
        url: "/api/media/file/cartilha.pdf",
      } as Media,
    }),
    {
      download: true,
      href: "/api/media/file/cartilha.pdf",
      label: action.label,
      rel: undefined,
      target: undefined,
    },
  );
});
test("Cartilha refuses a missing, ambiguous or mismatched download destination", () => {
  const title = "<h1>Entenda a nova Lei de Regularização de Edificações</h1>";
  const paragraph =
    '<p><a href="https://meuimovelregular.prefeitura.sp.gov.br//wp-content/uploads/2020/01/Cartilha_Lei_de_Regulariza%C3%A7%C3%A3o.pdf">Clique aqui</a> e veja a Cartilha.</p>';
  assert.throws(() => cartilhaEditorial(title));
  assert.throws(() => cartilhaEditorial(title + paragraph + paragraph));
  assert.throws(() =>
    cartilhaEditorial(
      title +
        paragraph.replace(
          "meuimovelregular.prefeitura.sp.gov.br",
          "example.test",
        ),
    ),
  );
  assert.throws(() =>
    cartilhaEditorial(title + paragraph.replace("2020/01/", "2020/02/")),
  );
  assert.throws(() =>
    cartilhaEditorial(title + paragraph + "<script>alert(1)</script>"),
  );
});
test("Cartilha CLI simulates offline without loading a database", async () => {
  assert.equal(argumentsFor(["cartilha"]).page, "cartilha");
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run(["cartilha", "--dry-run"]);
    assert.equal(report.sourcePage, "1145");
    assert.equal(report.sourceMeta, "4133");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});
