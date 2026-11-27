import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { importAll } from "./wordpress/all.ts";
import { legacyTarget, linkURLs } from "./wordpress/shared/site-links.ts";
const uri = process.env.MIR_IMPORT_BATCH_TEST_URI;
test(
  "Complete batch imports ten drafts, local links, shared media and reruns without new revisions",
  { skip: !uri },
  async () => {
    if (new URL(uri!).pathname !== "/mir_import_test")
      throw new Error("Use banco descartável mir_import_test.");
    process.env.DISABLE_PAYLOAD_HMR = "true";
    process.env.DATABASE_URI = uri;
    process.env.LDAP_AUTH_MODE = "external";
    const [
      { getPayload },
      { default: configuration },
      { isolatedAdapter, connectStore },
    ] = await Promise.all([
      import("payload"),
      import("../payload.config.ts"),
      import("./wordpress/shared/payload-store.ts"),
    ]);
    const dir = await mkdtemp(path.join(os.tmpdir(), "mir-batch-test-"));
    const config = await configuration;
    const database = await isolatedAdapter(uri!, true);
    config.db = database.adapter;
    config.collections.find((c) => c.slug === "users")!.hooks.beforeValidate =
      [];
    const media = config.collections.find((c) => c.slug === "media")!;
    if (typeof media.upload === "object")
      media.upload.staticDir = path.join(dir, "media");
    const setup = await getPayload({ config, key: "batch-setup-test" });
    let actorId: number;
    try {
      assert.equal(
        (await setup.find({ collection: "pages", limit: 1 })).totalDocs,
        0,
      );
      const actor = await setup.create({
        collection: "users",
        data: {
          login: "test.batch",
          nome: "Teste",
          email: "batch@example.test",
          role: "admin",
        },
        overrideAccess: true,
      });
      actorId = actor.id;
    } finally {
      await setup.destroy();
      await database.close();
    }
    try {
      const args = [
        "--apply",
        "--actor-id",
        String(actorId),
        "--target-label",
        "test",
        "--state-dir",
        path.join(dir, "state"),
      ];
      const first = await importAll(args, { print: false });
      assert(first.completed);
      assert.equal(first.pages.length, 22);
      assert.deepEqual(
        first.pages.slice(-2).map((item) => item.page),
        ["header", "footer"],
      );
      let connection = await connectStore(uri!, actorId);
      const revisions: Record<string, unknown> = {};
      try {
        const pages = await connection.store.find("pages", {});
        assert.equal(pages.length, 10);
        assert.equal((await connection.store.find("media", {})).length, 57);
        assert.equal(
          (await connection.store.find("payload-folders", {})).length,
          31,
        );
        for (const page of pages) {
          assert.equal(page._status, "draft");
          revisions[String(page.id)] = page.updatedAt;
          assert(
            !linkURLs(page.layout).some((url) => legacyTarget(url)),
            String(page.slug) +
              ": legacy URL remains: " +
              linkURLs(page.layout)
                .filter((url) => legacyTarget(url))
                .join(", "),
          );
        }
        const home = pages.find((p) => p.slug === "home")!;
        assert.match(JSON.stringify(home.layout), /"type":"internal"/);
        for (const slug of ["header", "footer"] as const) {
          const global = await connection.store.getGlobal!(slug);
          assert(global.logo);
          revisions[slug] = global.updatedAt;
          if (slug === "footer") {
            assert.equal(global.phone, "156");
            assert.equal((global.socialLinks as unknown[]).length, 3);
          }
        }
        const audits = await connection.store.find("audit-logs", {});
        assert(audits.length > 0);
        assert(audits.every((a) => a.actor === actorId));
      } finally {
        await connection.close();
      }
      const second = await importAll(args, { print: false });
      assert(second.completed);
      connection = await connectStore(uri!, actorId);
      try {
        for (const page of await connection.store.find("pages", {}))
          assert.equal(page.updatedAt, revisions[String(page.id)]);
        assert.equal((await connection.store.find("media", {})).length, 57);
        for (const slug of ["header", "footer"] as const)
          assert.equal(
            (await connection.store.getGlobal!(slug)).updatedAt,
            revisions[slug],
          );
      } finally {
        await connection.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);
