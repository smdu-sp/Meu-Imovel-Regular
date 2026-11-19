import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { test } from "node:test";
import os from "node:os";
import path from "node:path";
import type { Store } from "./wordpress/shared/apply.ts";
import { applyHeader, extractHeaderMenu, headerData, planHeader } from "./wordpress/globals/header.ts";
import { type Doc, type State } from "./wordpress/shared/migration-manifest.ts";
import { readTables, SNAPSHOT } from "./wordpress/shared/source.ts";
import { argumentsFor, run } from "./wordpress/run.ts";

const source = "old-wordpress/db/meuimovelregular.sql";
const uploads = "old-wordpress/mir-web/wp-content/uploads";

test("MIR-011 extracts the five ordered menu items and validates both original logos offline", async () => {
  const plan = await planHeader(source, uploads);
  assert.deepEqual(plan.menu.map((item) => item.id), ["182", "295", "180", "181", "1147"]);
  assert.deepEqual(plan.menu.map((item) => item.label), [
    "Entenda a Lei", "Benefícios", "Estou regular?", "Dúvidas frequentes", "Cartilha",
  ]);
  assert.deepEqual(plan.assets.map((asset) => asset.id), ["356", "1183"]);
  assert(plan.assets.every((asset) => asset.mimeType === "image/png"));
  assert.deepEqual(headerData(plan, { "356": 10, "1183": 11 }, {
    entenda: 1,
    "beneficios-de-regularizar-o-imovel": 2,
    situacao: 3,
    faq: 4,
    cartilha: 5,
  }).navigation.map((item) => item.page), [1, 2, 3, 4, 5]);

  const report = await run(["header", "--dry-run"], { print: false });
  assert.equal(report.destinationState, "não verificado");
  assert.equal(argumentsFor(["header", "--dry-run"]).page, "header");
});

test("MIR-011 rejects a changed menu location or destination", async () => {
  const tables = readTables((await readFile(source)).toString("utf8"));
  const menu = extractHeaderMenu(tables);
  assert.equal(menu.length, 5);
  const option = tables.wp_options.find((row) => row.option_id === "233")!;
  option.option_value = option.option_value.replace("dslc_mainmenu", "other_location");
  assert.throws(() => extractHeaderMenu(tables), /Localização/);
  option.option_value = option.option_value.replace("other_location", "dslc_mainmenu");
  const destination = tables.wp_postmeta.find(
    (row) => row.post_id === "182" && row.meta_key === "_menu_item_object_id",
  )!;
  destination.meta_value = "999";
  assert.throws(() => extractHeaderMenu(tables), /Destino/);
});

function fakeStore(missingPage?: string) {
  let nextId = 100;
  let writes = 0;
  let saves = 0;
  let global: Doc = { id: 1, navigationMode: "normal", enableSearch: false, updatedAt: "initial" };
  const documents = new Map<number, Doc>();
  const pages = new Map([
    ["entenda", 10],
    ["beneficios-de-regularizar-o-imovel", 11],
    ["situacao", 12],
    ["faq", 13],
    ["cartilha", 14],
  ]);
  const state: State = {
    version: 1,
    snapshot: SNAPSHOT,
    target: "fake-target",
    label: "fake-test",
    entries: {},
  };
  const store: Store = {
    find: async (collection, where) => {
      if (collection === "pages") {
        const slug = (where.slug as { equals: string }).equals;
        const id = pages.get(slug);
        return id && slug !== missingPage ? [{ id, slug, lifecycleStatus: "active" }] : [];
      }
      if (collection !== "payload-folders") return [];
      const clauses = (where.and as Array<Record<string, { equals?: unknown; exists?: boolean }>>);
      const name = clauses[0].name.equals;
      const parent = clauses[1].folder;
      return [...documents.values()].filter((doc) =>
        doc.name === name &&
        (parent.equals !== undefined ? doc.folder === parent.equals : !doc.folder),
      );
    },
    get: async (_collection, id) => {
      const document = documents.get(id);
      if (!document) throw new Error(`Documento ausente: ${id}`);
      return document;
    },
    getGlobal: async () => global,
    create: async (_collection, data) => {
      writes++;
      const doc = { ...data, id: nextId++, updatedAt: `revision-${writes}` };
      documents.set(doc.id, doc);
      return doc;
    },
    update: async () => { throw new Error("Atualização de página inesperada."); },
    updateGlobal: async (data) => {
      writes++;
      global = { ...global, ...data, updatedAt: `revision-${writes}` };
      return global;
    },
    transaction: async (fn) => fn(),
  };
  return {
    store,
    state,
    save: async () => { saves++; },
    getGlobal: () => global,
    editGlobal: (change: Record<string, unknown>) => { global = { ...global, ...change, updatedAt: "manual" }; },
    writes: () => writes,
    saves: () => saves,
  };
}

test("MIR-011 refuses missing destination pages before writing media or Header", async () => {
  const plan = await planHeader(source, uploads);
  const target = fakeStore("faq");
  await assert.rejects(
    applyHeader(plan, target.store, target.state, target.save),
    /Página necessária ausente ou ambígua: faq/,
  );
  assert.equal(target.writes(), 0);
  assert.equal(target.saves(), 0);
});

test("MIR-011 writes Header once, reuses checkpoints and protects later manual edits", async () => {
  const plan = await planHeader(source, uploads);
  const target = fakeStore();
  const first = await applyHeader(plan, target.store, target.state, target.save);
  assert.equal(first.globalId, 1);
  assert.equal(first.media["356"] > 0, true);
  assert.equal(first.media["1183"] > 0, true);
  assert.equal(target.getGlobal().logo, first.media["356"]);
  assert.deepEqual(
    (target.getGlobal().navigation as Array<{ label: string; page: number }>).map((item) => item.page),
    [10, 11, 12, 13, 14],
  );
  assert.equal(target.state.entries["global:header"].id, 1);
  const writes = target.writes();
  const saves = target.saves();
  await applyHeader(plan, target.store, target.state, target.save);
  assert.equal(target.writes(), writes);
  assert.equal(target.saves(), saves);

  target.editGlobal({ navigation: [{ label: "Alterado", page: 10 }] });
  await assert.rejects(
    applyHeader(plan, target.store, target.state, target.save),
    /Conflito/,
  );
  assert.equal(target.writes(), writes);
});

test("MIR-011 refuses a manually configured Header without a manifesto", async () => {
  const plan = await planHeader(source, uploads);
  const target = fakeStore();
  target.editGlobal({ logo: 99 });
  await assert.rejects(
    applyHeader(plan, target.store, target.state, target.save),
    /preexistente não gerenciado/,
  );
  assert.equal(target.writes(), 0);
});

test("MIR-011 apply command dispatches to the Header importer with an existing session", async () => {
  const target = fakeStore();
  const directory = await mkdtemp(path.join(os.tmpdir(), "mir-header-report-"));
  try {
    const report = await run([
      "header", "--apply", "--actor-id", "1", "--target-label", "test",
      "--state-dir", directory, "--report", path.join(directory, "report.json"),
    ], {
      print: false,
      session: {
        store: target.store,
        state: target.state,
        save: target.save,
        close: async () => {},
      },
    });
    assert.equal(report.destinationState, "verificado");
    assert.equal((report.result as { globalId: number }).globalId, 1);
    assert.equal(target.getGlobal().logo !== undefined, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
