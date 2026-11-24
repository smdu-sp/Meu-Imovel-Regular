import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planFaq,
  faqData,
  parseFaq,
  faqAnswer,
  reviewFaq,
} from "./wordpress/pages/faq.ts";
import { faqImages, faqManuals } from "./wordpress/pages/faq-content.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import {
  resolveSourceFile,
  resolveUploadsRoot,
} from "./wordpress/shared/source.ts";

test("FAQ real snapshot preserves 29 answers, source links and six media across valid blocks", async () => {
  const plan = await planFaq(
    resolveSourceFile(),
    resolveUploadsRoot(),
  );
  assert.equal(plan.metaId, "4161");
  assert.deepEqual(
    plan.assets.map((a) => [a.id, a.hash, a.size, a.mimeType]),
    [
      ...faqImages.map((a) => [a.id, a.hash, a.size, a.mimeType]),
      ...faqManuals.map((a) => [a.id, a.hash, a.size, "application/pdf"]),
    ],
  );
  const page = faqData(
    plan,
    Object.fromEntries(plan.assets.map((a, i) => [a.id, 100 + i])),
  );
  assert.equal(page._status, "draft");
  assert.equal(page.slug, "faq");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "mirBanner",
      "richText",
      "mirCards",
      "faqAccordion",
      "faqAccordion",
      "imageBlock",
    ],
  );
  const blocks = page.layout.filter((b) => b.blockType === "faqAccordion") as {
    items: typeof plan.items;
  }[];
  assert.deepEqual(
    blocks.map((b) => b.items.length),
    [15, 14],
  );
  assert.deepEqual(
    blocks.flatMap((b) => b.items),
    plan.items,
  );
  assert(
    plan.items.every(
      (i) =>
        i.question.length > 0 &&
        i.question.length <= 140 &&
        i.answer.root.children.length,
    ),
  );
  assert.equal(
    plan.items[0].question,
    "O que é a Lei de Regularização de Edificações? Todos os imóveis podem ser regularizados?",
  );
  assert.equal(
    plan.items[13].question,
    "Com o protocolo de regularização fica suspensa a fiscalização?",
  );
  assert.equal(
    plan.items[16].question,
    "Haverá custo para regularizar os imóveis?",
  );
  assert.equal(
    plan.items[28].question,
    "Quem faz usucapião também pode regularizar?",
  );
  const json = JSON.stringify(page);
  assert.doesNotMatch(
    json,
    /anisti|<iframe|<script|dslc_sep|wplink-url-error|\\\\/i,
  );
  assert.match(json, /denominação informal/);
  assert.match(json, /não está “perdoando”/);
  assert.match(json, /lei-15889-de-05-de-novembro-de-2013/);
  assert.match(
    json,
    /MANUAL-COMO-PREENCHER-O-REQUERIMENTO-Jun2021_compressed.pdf/,
  );
  assert.match(json, /mailto:meuimovelregular@prefeitura.sp.gov.br/);
  assert.match(json, /30 de agosto de 2026/);
  assert.match(json, /R\$ 10,00/);
  assert.match(json, /nem garante deferimento/);
  const cards = page.layout[2] as {
    items: { image: number; link?: { url: string }; content: unknown }[];
  };
  assert.deepEqual(
    cards.items.map((i) => i.image),
    [102, 103, 104, 105],
  );
  assert(cards.items.every((i) => JSON.stringify(i.content).length > 0));
  assert.equal(cards.items[1].link, undefined);
  assert.match(
    JSON.stringify(cards.items[1].content),
    /meuimovelregular@prefeitura.sp.gov.br/,
  );
  assert.match(cards.items[3].link!.url, /sp156.prefeitura.sp.gov.br/);
});
test("FAQ parser rejects mismatched, empty or long content and unsafe links", () => {
  const nav = Array(29).fill("Pergunta?").join("(dslc_sep)");
  const answers = Array(29).fill("<p>Resposta.</p>").join("(dslc_sep)");
  assert.equal(parseFaq(nav, answers).length, 29);
  assert.throws(() => parseFaq(nav, answers + "(dslc_sep)<p>Extra</p>"));
  assert.throws(() =>
    parseFaq(nav.replace("Pergunta?", "x".repeat(141)), answers),
  );
  assert.throws(() =>
    parseFaq(nav, answers.replace("<p>Resposta.</p>", "<p> </p>")),
  );
  assert.throws(() =>
    faqAnswer('<p><a href="javascript:alert(1)">Link</a></p>'),
  );
  assert.throws(() => faqAnswer('<p><a href="http://">Link</a></p>'));
  assert.doesNotMatch(
    reviewFaq("Para a regularização (anistia). Custo para anistiar."),
    /anisti/i,
  );
});
test("FAQ CLI simulates offline without a database", async () => {
  assert.equal(argumentsFor(["faq"]).page, "faq");
  const old = process.env.DATABASE_URI;
  const log = console.log;
  process.env.DATABASE_URI = "invalid-offline";
  console.log = () => {};
  try {
    const report = await run(["faq", "--dry-run"]);
    assert.equal(report.sourceMeta, "4161");
    assert.equal(report.sourcePage, "174");
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (old === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = old;
  }
});

test("FAQ manual links use resolved Media URLs in both answers without changing unrelated links", async () => {
  const plan = await planFaq(
    resolveSourceFile(),
    resolveUploadsRoot(),
  );
  const original = JSON.stringify(plan.items);
  const urls = {
    "1196": "https://cms.example.test/api/media/file/requerimento-2023.pdf",
    "1188": "/api/media/file/aceites.pdf",
    "1187": "/api/media/file/pagamento.pdf",
  };
  const page = faqData(plan, {}, urls);
  const blocks = page.layout.filter((b) => b.blockType === "faqAccordion") as {
    items: { answer: unknown }[];
  }[];
  const items = blocks.flatMap((b) => b.items);
  for (const index of [18, 22]) {
    const json = JSON.stringify(items[index].answer);
    for (const url of Object.values(urls)) assert(json.includes(url));
    assert.doesNotMatch(json, /MANUAL-COMO-|wp-content\/uploads/);
    assert.match(json, /https:\/\/portaldelicenciamento.prefeitura.sp.gov.br/);
  }
  assert.equal(JSON.stringify(plan.items), original);
  assert.equal(
    JSON.stringify(items[0].answer),
    JSON.stringify(plan.items[0].answer),
  );
});
