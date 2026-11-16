import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DocumentListBlock as Props, Media } from "../../payload-types";
import { DocumentListBlock } from "./Component";

it("renders a direct PDF link and skips invalid media", () => {
  const pdf = {
    id: 7,
    title: "Manual de acesso",
    usage: "document",
    mimeType: "application/pdf",
    url: "/api/media/file/manual.pdf",
    filesize: 1024 * 1024,
  } as Media;
  const html = renderToStaticMarkup(createElement(DocumentListBlock, {
    blockType: "documentList",
    heading: "Manuais",
    items: [
      { file: pdf },
      { file: { ...pdf, id: 8, mimeType: "image/png" } },
    ],
  } as Props));
  assert.match(html, /href="\/api\/media\/file\/manual.pdf"/);
  assert.match(html, /Manual de acesso \(PDF, 1 MB\)/);
  assert.doesNotMatch(html, /<iframe|<embed|<object/);
  assert.equal((html.match(/<li/g) || []).length, 1);
});
