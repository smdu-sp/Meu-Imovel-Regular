import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { test } from "node:test";
import os from "node:os";
import path from "node:path";
import { validateOfficialHttpsUrl } from "../domain/official-url.ts";
import { applyFooter, extractFooterContent, footerData, planFooter } from "./wordpress/globals/footer.ts";
import { projection, type Doc, type State } from "./wordpress/shared/migration-manifest.ts";
import { readTables, SNAPSHOT, resolveSourceFile, resolveUploadsRoot } from "./wordpress/shared/source.ts";
import type { Store } from "./wordpress/shared/apply.ts";
import { argumentsFor, run } from "./wordpress/run.ts";

const source = resolveSourceFile();
const uploads = resolveUploadsRoot();

test("MIR-012 extracts contact and social links and validates the original logo offline", async () => {
  const plan = await planFooter(source, uploads);
  assert.equal(plan.assets[0].id, "179");
  assert.equal(plan.assets[0].mimeType, "image/png");
  assert.equal(plan.content.phone, "156");
  assert.equal(plan.content.email, "meuimovelregular@prefeitura.sp.gov.br");
  assert.deepEqual(plan.content.socialLinks.map((item) => item.icon), ["x-social", "facebook", "instagram"]);
  assert(plan.content.socialLinks.every((item) => validateOfficialHttpsUrl(item.url) === true));
  assert(plan.content.institutionalLinks.every((item) => validateOfficialHttpsUrl(item.url) === true));
  assert.equal(footerData(plan, { "179": 25 }).logo, 25);
  assert.equal(footerData(plan, { "179": 25 }).appearance.scheme, "inverse");
  assert.equal(argumentsFor(["footer", "--dry-run"]).page, "footer");

  const report = await run(["footer", "--dry-run"], { print: false });
  assert.equal(report.destinationState, "não verificado");
  assert.equal((report.footer as { logo: number }).logo, -1);
});

test("MIR-012 rejects changed contacts or insecure social URLs", async () => {
  const tables = readTables((await readFile(source)).toString("utf8"));
  const meta = tables.wp_postmeta.find((row) => row.meta_id === "4067")!;
  const areas = JSON.parse(meta.meta_value)[0].content;
  assert.equal(extractFooterContent(areas).phone, "156");
  areas[4].content[0].content = areas[4].content[0].content.replace("Tel: 156", "Tel: 999");
  assert.throws(() => extractFooterContent(areas), /divergentes/);
  areas[4].content[0].content = areas[4].content[0].content.replace("Tel: 999", "Tel: 156");
  areas[5].content[0].twitter = "http://twitter.com/urbanismopref";
  assert.throws(() => extractFooterContent(areas), /Perfil social divergente/);
  assert.notEqual(validateOfficialHttpsUrl("http://twitter.com/urbanismopref"), true);
});

function fakeStore() {
  let nextId = 100;
  let writes = 0;
  let saves = 0;
  let footer: Doc = { id: 1, appearance: { scheme: "muted" }, updatedAt: "initial" };
  const documents = new Map<number, Doc>();
  const state: State = {
    version: 1,
    snapshot: SNAPSHOT,
    target: "fake-target",
    label: "fake-test",
    entries: {},
  };
  const store: Store = {
    find: async (collection, where) => {
      if (collection !== "payload-folders") return [];
      const clauses = where.and as Array<Record<string, { equals?: unknown; exists?: boolean }>>;
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
    getGlobal: async (slug) => {
      assert.equal(slug, "footer");
      return footer;
    },
    create: async (_collection, data) => {
      writes++;
      const doc = { ...data, id: nextId++, updatedAt: `revision-${writes}` };
      documents.set(doc.id, doc);
      return doc;
    },
    update: async () => { throw new Error("Atualização de página inesperada."); },
    updateGlobal: async (data, slug) => {
      assert.equal(slug, "footer");
      writes++;
      footer = { ...footer, ...data, updatedAt: `revision-${writes}` };
      return footer;
    },
    transaction: async (fn) => fn(),
  };
  const seedSharedFolders = () => {
    const names = ["MIR", "MIR/Compartilhado", "MIR/Compartilhado/Identidade"];
    names.forEach((name, index) => {
      const doc: Doc = {
        id: index + 10,
        name: name.split("/").at(-1),
        folder: index ? index + 9 : undefined,
        folderType: ["media"],
        updatedAt: `shared-${index}`,
      };
      documents.set(doc.id, doc);
      state.entries[`folder:${name}`] = {
        id: doc.id,
        hash: projection(doc, "payload-folders"),
        revision: doc.updatedAt,
      };
    });
  };
  return {
    store,
    state,
    save: async () => { saves++; },
    getFooter: () => footer,
    editFooter: (change: Record<string, unknown>) => { footer = { ...footer, ...change, updatedAt: "manual" }; },
    seedSharedFolders,
    writes: () => writes,
    saves: () => saves,
  };
}

test("MIR-012 reuses the identity folder and writes Footer only once", async () => {
  const plan = await planFooter(source, uploads);
  const target = fakeStore();
  target.seedSharedFolders();
  const first = await applyFooter(plan, target.store, target.state, target.save);
  assert.equal(first.globalId, 1);
  assert.equal(target.getFooter().logo, first.media["179"]);
  assert.equal(target.writes(), 2);
  assert.equal(target.state.entries["global:footer"].id, 1);
  const saves = target.saves();
  await applyFooter(plan, target.store, target.state, target.save);
  assert.equal(target.writes(), 2);
  assert.equal(target.saves(), saves);

  target.editFooter({ phone: "999" });
  await assert.rejects(applyFooter(plan, target.store, target.state, target.save), /Conflito/);
  assert.equal(target.writes(), 2);
});

test("MIR-012 preserves an unmanaged Footer edited manually", async () => {
  const plan = await planFooter(source, uploads);
  const target = fakeStore();
  target.editFooter({ address: "Endereço novo" });
  await assert.rejects(applyFooter(plan, target.store, target.state, target.save), /preexistente não gerenciado/);
  assert.equal(target.writes(), 0);
});

test("MIR-012 apply command dispatches to Footer with an existing session", async () => {
  const target = fakeStore();
  const directory = await mkdtemp(path.join(os.tmpdir(), "mir-footer-report-"));
  try {
    const report = await run([
      "footer", "--apply", "--actor-id", "1", "--target-label", "test",
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
    assert.equal(target.getFooter().logo !== undefined, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
