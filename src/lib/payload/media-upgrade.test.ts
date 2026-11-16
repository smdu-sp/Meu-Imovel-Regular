import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PayloadRequest, TextFieldSingleValidation, UploadFieldSingleValidation } from "payload";
import { Media } from "../../collections/Media.ts";
import { DocumentListBlock } from "../../blocks/DocumentList/config.ts";
import { restrictMediaFolders } from "./media-folders.ts";
import { fillLegacyMediaTitle, prepareMediaMetadata } from "./media-metadata.ts";
import { MediaImage } from "../../blocks/shared/MediaImage.tsx";

const asReq = (value: object) => value as PayloadRequest;
const asHookArgs = (value: object) => value as unknown as Parameters<typeof prepareMediaMetadata>[0];

describe("media folders and PDF contract", () => {
  it("requires an explicit PDF title and validates its signature", async () => {
    const args = {
      data: { title: "Guia", usage: "content" },
      operation: "create" as const,
      req: asReq({ file: { mimetype: "application/pdf", name: "guia.pdf", data: Buffer.from("%PDF-1.7") } }),
    };
    const result = await prepareMediaMetadata(asHookArgs(args));
    assert.equal(result.title, "Guia");
    assert.equal(result.usage, "document");
    await assert.rejects(
      () => prepareMediaMetadata(asHookArgs({ ...args, data: { title: "", usage: "content" } })),
      /titulo editorial/,
    );
    await assert.rejects(
      () => prepareMediaMetadata(asHookArgs({ ...args, req: asReq({ file: { mimetype: "application/pdf", name: "fake.pdf", data: Buffer.from("not pdf") } }) })),
      /assinatura/,
    );
  });

  it("keeps legacy media readable and never sends a PDF to Next Image", () => {
    const old = fillLegacyMediaTitle({ doc: { id: 9, alt: "Manual antigo", filename: "manual.pdf" } } as Parameters<typeof fillLegacyMediaTitle>[0]);
    assert.equal(old?.title, "Manual antigo");
    assert.equal(MediaImage({ media: { id: 9, title: "Manual", mimeType: "application/pdf", url: "/api/media/file/manual.pdf" } as never }), null);
  });

  it("keeps image alt required while allowing a PDF without alt", async () => {
    const field = Media.fields.find((item) => "name" in item && item.name === "alt");
    assert.ok(field && "validate" in field && typeof field.validate === "function");
    const validate = field.validate as TextFieldSingleValidation;
    const options = { data: { mimeType: "application/pdf" }, req: asReq({}) } as unknown as Parameters<typeof validate>[1];
    assert.equal(await validate(null, options), true);
    assert.match(String(await validate(null, { ...options, data: { mimeType: "image/png" } })), /Descreva a imagem/);
  });

  it("blocks nonempty folder deletion before Payload's recursive hooks", async () => {
    const folder = restrictMediaFolders({ collection: { slug: "payload-folders", fields: [] } });
    const beforeDelete = folder.hooks?.beforeDelete?.[0];
    const deleteAccess = folder.access?.delete;
    assert.ok(beforeDelete && deleteAccess);
    const accessArgs = (role: string) => ({ req: asReq({ user: { role } }) }) as Parameters<typeof deleteAccess>[0];
    assert.equal(await deleteAccess(accessArgs("admin")), true);
    assert.equal(await deleteAccess(accessArgs("editor")), false);
    const req = asReq({ payload: { find: async () => ({ totalDocs: 1 }) } });
    await assert.rejects(() => beforeDelete({ id: 4, req } as Parameters<typeof beforeDelete>[0]), /Mova as midias/);
  });

  it("rejects a non-PDF media relationship even through the API", async () => {
    const items = DocumentListBlock.fields.find((item) => "name" in item && item.name === "items");
    assert.ok(items && items.type === "array");
    const file = items.fields.find((item) => "name" in item && item.name === "file");
    assert.ok(file && file.type === "upload" && file.validate);
    const validate = file.validate as UploadFieldSingleValidation;
    const options = {
      req: asReq({ payload: { findByID: async () => ({ mimeType: "image/png", usage: "content" }) } }),
    } as Parameters<typeof validate>[1];
    assert.match(String(await validate(1, options)), /documento PDF/);
    const legacyPdfOptions = {
      req: asReq({ payload: { findByID: async () => ({ mimeType: "application/pdf", usage: "content" }) } }),
    } as Parameters<typeof validate>[1];
    assert.equal(await validate(2, legacyPdfOptions), true);
  });
});
