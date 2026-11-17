import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { planHome } from "./wordpress/pages/home.ts";
import { applyHome } from "./wordpress/shared/apply.ts";
import { SNAPSHOT } from "./wordpress/shared/source.ts";
import type { State } from "./wordpress/shared/migration-manifest.ts";

const uri = process.env.MIR_IMPORT_TEST_URI;
test(
  "PostgreSQL disposable: Payload validation, reexecution, folders, PDFs, audits and concurrent writes",
  { skip: !uri },
  async () => {
    if (new URL(uri!).pathname !== "/mir_import_test")
      throw new Error("Use exclusivamente banco descartável mir_import_test.");
    process.env.DISABLE_PAYLOAD_HMR = "true";
    process.env.DATABASE_URI = uri;
    process.env.LDAP_AUTH_MODE = "external";
    const [{ getPayload }, { default: configuration }] = await Promise.all([
      import("payload"),
      import("../payload.config.ts"),
    ]);
    const config = await configuration;
    const dir = await mkdtemp(path.join(os.tmpdir(), "mir-upload-test-"));
    const { isolatedAdapter } =
      await import("./wordpress/shared/payload-store.ts");
    const setupDb = await isolatedAdapter(uri!, true);
    config.db = setupDb.adapter;
    const users = config.collections.find((c) => c.slug === "users")!;
    users.hooks.beforeValidate = [];
    const mediaConfig = config.collections.find((c) => c.slug === "media")!;
    if (typeof mediaConfig.upload === "object")
      mediaConfig.upload.staticDir = dir;
    const setup = await getPayload({ config, key: "wordpress-setup-test" });
    try {
      const actor = await setup.create({
        collection: "users",
        data: {
          login: "test.import",
          nome: "Teste",
          email: "import@example.test",
          role: "admin",
        },
        overrideAccess: true,
      });
      await setup.destroy();
      await setupDb.close();
      const { connectStore } =
        await import("./wordpress/shared/payload-store.ts");
      const connection = await connectStore(uri!, actor.id);
      const { store } = connection;
      try {
        const plan = await planHome(
          "old-wordpress/db/meuimovelregular.sql",
          "old-wordpress/meuimovelregular/wp-content/uploads",
        );
        const state: State = {
          version: 1,
          target: "test",
          label: "test",
          snapshot: SNAPSHOT,
          entries: {},
        };
        let saves = 0;
        const save = async () => {
          saves++;
        };
        const create = store.create;
        let attempts = 0;
        store.create = async (collection, data, file) => {
          if (collection === "media" && ++attempts === 4)
            throw new Error("Falha parcial simulada");
          return create(collection, data, file);
        };
        await assert.rejects(
          applyHome(plan, store, state, save),
          /Falha parcial/,
        );
        assert.equal(state.pending, undefined);
        assert.equal((await store.find("media", {})).length, 3);
        store.create = create;
        const result = await applyHome(plan, store, state, save);
        assert.equal(Object.keys(result.media).length, 17);
        const page = await store.get("pages", result.pageId, true);
        assert.equal(page._status, "draft");
        const firstSaves = saves;
        await applyHome(plan, store, state, save);
        assert.equal(saves, firstSaves);
        assert.equal((await store.find("media", {})).length, 17);
        assert.equal((await store.find("payload-folders", {})).length, 4);
        const audits = await store.find("audit-logs", {});
        assert(audits.length > 0);
        assert.equal(audits[0].actor, actor.id);
        await assert.rejects(
          applyHome(plan, store, { ...state, entries: {} }, save),
          /preexistente/,
        );
        // A real concurrent Admin write must wait on the table lock, then survive.
        const { default: pg } = await import("pg");
        const client = new pg.Client({ connectionString: uri! });
        await client.connect();
        try {
          await store.transaction(async () => {
            await client.query("SET lock_timeout='100ms'");
            await assert.rejects(
              client.query("UPDATE pages SET title='Concurrent' WHERE id=$1", [
                result.pageId,
              ]),
              /lock timeout/,
            );
          });
        } finally {
          await client.end();
        }
        await store.transaction(() =>
          store.update(result.pageId, { title: "Editada no Admin" }),
        );
        await assert.rejects(applyHome(plan, store, state, save), /Conflito/);
        const { planEntenda, applyEntenda } =
          await import("./wordpress/pages/entenda.ts");
        const entendaPlan = await planEntenda(
          "old-wordpress/db/meuimovelregular.sql",
          "old-wordpress/meuimovelregular/wp-content/uploads",
        );
        const homeEntry = structuredClone(state.entries["page:87"]);
        const entenda = await applyEntenda(entendaPlan, store, state, save);
        assert.equal(entenda.media["712"], result.media["712"]);
        assert.equal(entenda.media["776"], result.media["776"]);
        assert.equal((await store.find("media", {})).length, 20);
        assert.equal((await store.find("payload-folders", {})).length, 6);
        assert.deepEqual(state.entries["page:87"], homeEntry);
        assert.equal(
          (await store.get("pages", result.pageId, true)).title,
          "Editada no Admin",
        );
        const savedEntenda = await store.get("pages", entenda.pageId, true);
        assert.equal(savedEntenda.slug, "entenda");
        assert.equal(savedEntenda._status, "draft");
        assert.equal((savedEntenda.layout as unknown[]).length, 8);
        const checkpoints = saves;
        await applyEntenda(entendaPlan, store, state, save);
        assert.equal(saves, checkpoints);
        const withoutEntenda = structuredClone(state);
        delete withoutEntenda.entries["page:172"];
        await assert.rejects(
          applyEntenda(entendaPlan, store, withoutEntenda, save),
          /preexistente/,
        );
        assert(
          state.reviews?.["172"].some((s) => s.includes("Destino temporário")),
        );
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        await connection.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);
