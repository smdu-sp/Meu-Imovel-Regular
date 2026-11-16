import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig, getPayload, type Payload } from "payload";
import { Media } from "../../collections/Media.ts";
import { restrictMediaFolders } from "./media-folders.ts";
import type { User } from "../../payload-types.ts";

const editor = { collection: "folder-auth", id: 1, role: "editor" } as unknown as User;
const admin = { collection: "folder-auth", id: 2, role: "admin" } as unknown as User;

describe("native media folders with Payload Local API", () => {
  let payload: Payload;

  before(async () => {
    const config = await buildConfig({
      collections: [
        { slug: "folder-auth", auth: true, fields: [{ name: "role", type: "text" }] },
        Media,
      ],
      db: sqliteAdapter({ client: { url: "file::memory:" }, push: true }),
      folders: { collectionOverrides: [restrictMediaFolders] },
      secret: "native-folder-integration-test-secret",
    });
    payload = await getPayload({ config });
  });

  after(async () => {
    await payload?.destroy();
  });

  it("lets an Editor organize folders but reserves deletion for Admin", async () => {
    const parent = await payload.create({
      collection: "payload-folders",
      data: { name: "MIR", tags: ["Home", "Manuais"] },
      overrideAccess: false,
      user: editor,
    });
    assert.deepEqual(parent.tags, ["Home", "Manuais"]);
    const savedParent = await payload.findByID({
      collection: "payload-folders",
      id: parent.id,
      overrideAccess: false,
      user: editor,
    });
    assert.deepEqual(savedParent.tags, ["Home", "Manuais"]);
    const child = await payload.create({
      collection: "payload-folders",
      data: { name: "Manuais", folder: parent.id },
      overrideAccess: false,
      user: editor,
    });
    await payload.update({
      collection: "payload-folders",
      id: child.id,
      data: { name: "Manuais PDF" },
      overrideAccess: false,
      user: editor,
    });
    await assert.rejects(() => payload.delete({
      collection: "payload-folders",
      id: child.id,
      overrideAccess: false,
      user: editor,
    }));
    await assert.rejects(() => payload.delete({
      collection: "payload-folders",
      id: parent.id,
      overrideAccess: false,
      user: admin,
    }), /Mova as midias/);
    await payload.delete({
      collection: "payload-folders",
      id: child.id,
      overrideAccess: false,
      user: admin,
    });
    await payload.delete({
      collection: "payload-folders",
      id: parent.id,
      overrideAccess: false,
      user: admin,
    });
  });
});
