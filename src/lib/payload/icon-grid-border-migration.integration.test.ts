import assert from "node:assert/strict";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { MigrateUpArgs } from "@payloadcms/db-postgres";
import { up } from "../../migrations/20261127_000000_icon_grid_border_style.ts";

const uri = process.env.MIR_UI_TEST_URI;
test(
  "IconGrid migration preserves existing pages/versions and selected border styles on rerun",
  { skip: !uri },
  async () => {
    if (new URL(uri!).pathname !== "/mir_ui_test")
      throw new Error("Use exclusivamente banco descartável mir_ui_test.");
    const client = new pg.Client({ connectionString: uri });
    await client.connect();
    try {
      await client.query(
        "CREATE TABLE pages_blocks_icon_grid (id integer PRIMARY KEY, title text); CREATE TABLE _pages_v_blocks_icon_grid (id integer PRIMARY KEY, title text)",
      );
      await client.query(
        "INSERT INTO pages_blocks_icon_grid VALUES (1,'Manuais'); INSERT INTO _pages_v_blocks_icon_grid VALUES (2,'Versão anterior')",
      );
      const args = { db: drizzle(client) } as unknown as MigrateUpArgs;
      await up(args);
      await up(args);
      assert.deepEqual(
        (await client.query("SELECT * FROM pages_blocks_icon_grid")).rows,
        [{ id: 1, title: "Manuais", appearance_border_style: "solid" }],
      );
      assert.deepEqual(
        (await client.query("SELECT * FROM _pages_v_blocks_icon_grid")).rows,
        [{ id: 2, title: "Versão anterior", appearance_border_style: "solid" }],
      );
      await client.query(
        "UPDATE pages_blocks_icon_grid SET appearance_border_style='dotted' WHERE id=1",
      );
      await up(args);
      assert.equal(
        (
          await client.query(
            "SELECT appearance_border_style FROM pages_blocks_icon_grid",
          )
        ).rows[0].appearance_border_style,
        "dotted",
      );
      await assert.rejects(
        client.query(
          "UPDATE pages_blocks_icon_grid SET appearance_border_style='invalido'",
        ),
        /invalid input value for enum/,
      );
    } finally {
      await client.end();
    }
  },
);
