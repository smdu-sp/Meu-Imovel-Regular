import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  sqlRows,
  readTables,
  safeAsset,
  loadSource,
} from "./wordpress/shared/source.ts";
import { argumentsFor, run } from "./wordpress/run.ts";
import {
  assertIntact,
  projection,
  targetFingerprint,
  openManifest,
  type Doc,
} from "./wordpress/shared/migration-manifest.ts";
import { planHome, homeData } from "./wordpress/pages/home.ts";

test("apply CLI loads CommonJS next/env and development overrides before connecting", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mir-env-"));
  try {
    await writeFile(
      path.join(dir, ".env"),
      "DATABASE_URI=postgresql://unused.invalid/base\n",
    );
    // The override deliberately fails protocol validation before any DB connection.
    await writeFile(
      path.join(dir, ".env.development.local"),
      "DATABASE_URI=https://offline.invalid/test\n",
    );
    const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "development" };
    delete env.DATABASE_URI;
    delete env.__NEXT_PROCESSED_ENV;
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        path.resolve("node_modules/tsx/dist/loader.mjs"),
        path.resolve("src/imports/wordpress/run.ts"),
        "home",
        "--apply",
        "--actor-id",
        "1",
        "--target-label",
        "environment-regression",
        "--source",
        path.resolve("old-wordpress/db/meuimovelregular.sql"),
        "--uploads",
        path.resolve("old-wordpress/meuimovelregular/wp-content/uploads"),
        "--state-dir",
        path.join(dir, "state"),
        "--report",
        path.join(dir, "report.json"),
      ],
      { cwd: dir, env, encoding: "utf8", timeout: 15000 },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Destino precisa ser PostgreSQL/);
    assert.doesNotMatch(result.stderr, /loadEnvConfig/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("SQL lexer preserves escapes, Unicode and unsafe numeric IDs without evaluation", () => {
  const sql =
    "REPLACE INTO `wp_posts` (`ID`,`post_title`) VALUES ('90071992547409930','A\\'ção, (teste)\\n'), ('2','D''água');";
  assert.deepEqual(readTables(sql).wp_posts, [
    { ID: "90071992547409930", post_title: "A'ção, (teste)\n" },
    { ID: "2", post_title: "D'água" },
  ]);
  assert.throws(() => [...sqlRows("('unterminated", 0)]);
  assert.throws(() =>
    readTables("REPLACE INTO `wp_posts` (`ID`) VALUES (1,2);"),
  );
});
test("asset paths reject traversal and symlinks; MIME is signature based", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mir-path-"));
  try {
    await mkdir(path.join(dir, "uploads"));
    await writeFile(path.join(dir, "outside.pdf"), "%PDF-1.7");
    await symlink(
      path.join(dir, "outside.pdf"),
      path.join(dir, "uploads", "link.pdf"),
    );
    await assert.rejects(
      safeAsset(path.join(dir, "uploads"), "../outside.pdf"),
    );
    await assert.rejects(safeAsset(path.join(dir, "uploads"), "link.pdf"));
    await writeFile(path.join(dir, "uploads", "invalid.pdf"), "not a pdf");
    await assert.rejects(safeAsset(path.join(dir, "uploads"), "invalid.pdf"));
    await assert.rejects(loadSource(path.join(dir, "outside.pdf")), /Snapshot/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("CLI is offline by default and rejects unknown/contradictory arguments", () => {
  assert.equal(argumentsFor(["home"]).apply, undefined);
  for (const args of [
    ["pagina-inexistente"],
    ["home", "--force"],
    ["home", "--apply"],
    ["home", "--apply", "--dry-run"],
  ])
    assert.throws(() => argumentsFor(args));
});
test("manifest detects target mismatch, indeterminate operations and concurrent runs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mir-manifest-"));
  try {
    const m = await openManifest(dir, "target", "test", "source");
    await m.save();
    await assert.rejects(openManifest(dir, "target", "test", "source"));
    await m.close();
    await assert.rejects(openManifest(dir, "other", "test", "source"));
    const n = await openManifest(dir, "target", "test", "source");
    n.state.pending = "asset:737";
    await n.save();
    await n.close();
    await assert.rejects(
      openManifest(dir, "target", "test", "source"),
      /indeterminada/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  assert.equal(
    targetFingerprint("postgresql://a:secret@localhost/db"),
    targetFingerprint("postgresql://b:different@localhost:5432/db"),
  );
});
test("projection detects content/state changes and revision changes without depending on URL/depth", () => {
  const doc: Doc = {
    id: 1,
    title: "Home",
    slug: "home",
    _status: "draft",
    updatedAt: "v1",
    layout: [{ id: "item", blockType: "richText" }],
  };
  const entry = { id: 1, hash: projection(doc, "pages"), revision: "v1" };
  assertIntact({ ...doc, url: "/new" }, "pages", entry);
  for (const change of [
    { title: "Manual" },
    { _status: "published" },
    { updatedAt: "v2" },
  ])
    assert.throws(() => assertIntact({ ...doc, ...change }, "pages", entry));
});
test("real snapshot generates nine blocks and eight ordered PDF relationships offline", async () => {
  const plan = await planHome(
    "old-wordpress/db/meuimovelregular.sql",
    "old-wordpress/meuimovelregular/wp-content/uploads",
  );
  assert.equal(plan.assets.length, 17);
  assert.equal(
    plan.assets.filter((a) => a.mimeType === "application/pdf").length,
    8,
  );
  const media = Object.fromEntries(plan.assets.map((a, i) => [a.id, i + 1]));
  const page = homeData(plan, media);
  assert.equal(page.layout.length, 9);
  assert.equal(page._status, "draft");
  assert.deepEqual(
    page.layout.map((b) => b.blockType),
    [
      "fullWidthImageBanner",
      "fullWidthImageBanner",
      "iconGrid",
      "richText",
      "imageText",
      "imageText",
      "imageText",
      "imageText",
      "cards",
    ],
  );
  assert(!JSON.stringify(page).match(/anistia|poderão sre/i));
  assert.equal(
    plan.cards[0].title,
    "Veja os benefícios de tornar o seu imóvel regular!",
  );
  assert.deepEqual(
    plan.sections.map((s) => s.variant),
    ["image-right", "image-left", "image-right", "image-left"],
  );
  const previous = process.env.DATABASE_URI;
  process.env.DATABASE_URI = "invalid offline target";
  const log = console.log;
  console.log = () => {};
  try {
    const report = await run(["home", "--dry-run"]);
    assert.equal(report.destinationState, "não verificado");
  } finally {
    console.log = log;
    if (previous === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = previous;
  }
});

test("Home manuals use compact icon grid with eight ordered PDF download actions", async () => {
  const { documents } = await import("./wordpress/pages/home-content.ts");
  const { IconGridBlock } = await import("../blocks/IconGrid/Component.tsx");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const plan = await planHome(
    "old-wordpress/db/meuimovelregular.sql",
    "old-wordpress/meuimovelregular/wp-content/uploads",
  );
  const media = Object.fromEntries(plan.assets.map((a, i) => [a.id, i + 1]));
  const grid = homeData(plan, media)
    .layout[2] as unknown as import("../payload-types").IconGridBlock;
  assert.equal(grid.blockType, "iconGrid");
  assert.equal(grid.variant, "compact");
  assert.equal(grid.appearance?.spacing, "compact");
  assert.equal(grid.title, plan.heading);
  assert.equal(grid.items.length, 8);
  assert.deepEqual(
    grid.items.map((item) => item.description),
    documents.map((id) => plan.assets.find((a) => a.id === id)!.title),
  );
  assert.deepEqual(
    grid.items.map((item) => item.link?.document),
    documents.map((id) => media[id]),
  );
  for (const item of grid.items) {
    assert.equal(item.iconSource, "standard");
    assert.equal(item.standardIcon, "document");
    assert.equal(item.link?.type, "document");
    assert.equal(item.link?.label, "Baixar PDF");
    const id = item.link!.document as number;
    item.id = `manual-${id}`;
    item.link!.document = {
      id,
      title: item.description,
      mimeType: "application/pdf",
      url: `/api/media/file/manual-${id}.pdf`,
    } as import("../payload-types").Media;
  }
  const html = renderToStaticMarkup(createElement(IconGridBlock, grid));
  assert.equal((html.match(/download=""/g) || []).length, 8);
  assert.equal(
    (html.match(/href="\/api\/media\/file\/manual-/g) || []).length,
    8,
  );
  assert.match(html, /lg:grid-cols-4/);
});
