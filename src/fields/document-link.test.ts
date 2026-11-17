import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, cloneElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Media } from "../payload-types";
import { createDocumentLinkField } from "./document-link";
import { createLinkFields } from "./link";
import { resolveLink, resolveLinkHref } from "../lib/navigation/resolve-link";
import { BlockLink } from "../blocks/shared/BlockLink";
import { FullWidthImageBannerBlock } from "../blocks/FullWidthImageBanner/Component";

const pdf = {
  id: 71,
  title: "Cartilha",
  mimeType: "application/pdf",
  url: "/api/media/file/cartilha.pdf",
} as Media;
const image = {
  id: 72,
  alt: "Capa",
  mimeType: "image/png",
  url: "/capa.png",
  width: 1200,
  height: 400,
} as Media;
const action = {
  type: "document" as const,
  document: pdf,
  label: "Baixar cartilha",
};

test("PDF actions prefer the selected document over hidden legacy page/URL fields", () => {
  assert.equal(
    resolveLinkHref({
      ...action,
      page: { id: 1, slug: "antigo" } as never,
      url: "https://old.invalid",
    }),
    pdf.url,
  );
  assert.equal(resolveLink(action)?.download, true);
  for (const document of [
    null,
    71,
    image,
    { ...pdf, url: null },
    { ...pdf, url: "javascript:alert(1)" },
    { ...pdf, url: "//external.invalid/file.pdf" },
  ]) {
    assert.equal(resolveLinkHref({ ...action, document }), null);
  }
  assert.equal(
    resolveLinkHref({
      ...action,
      document: { ...pdf, url: "https://storage.example.test/cartilha.pdf" },
    }),
    "https://storage.example.test/cartilha.pdf",
  );
  assert.equal(
    resolveLinkHref({
      type: "external",
      url: "https://selected.invalid",
      page: { slug: "stale" } as never,
    }),
    "https://selected.invalid",
  );
});

test("server validates the PDF in Media, not MIME supplied by the caller", async () => {
  const field = createDocumentLinkField();
  const validate = field.validate as (
    value: unknown,
    args: unknown,
  ) => Promise<unknown>;
  const args = (mimeType: string) => ({
    siblingData: { type: "document" },
    req: { payload: { findByID: async () => ({ mimeType }) } },
  });
  assert.equal(await validate(71, args("application/pdf")), true);
  assert.equal(
    await validate({ id: 71, mimeType: "application/pdf" }, args("image/png")),
    "Selecione um arquivo PDF da biblioteca.",
  );
  assert.equal(
    await validate(null, args("application/pdf")),
    "Selecione um documento PDF.",
  );
  assert.equal(
    await validate(71, {
      siblingData: { type: "document" },
      req: {
        payload: {
          findByID: async () => {
            throw new Error("missing");
          },
        },
      },
    }),
    "O documento PDF selecionado não foi encontrado.",
  );
  const disabled = createDocumentLinkField(
    (data) => data.enabled === true && data.type === "document",
  );
  assert.equal(
    await (disabled.validate as typeof validate)(null, {
      siblingData: { enabled: false, type: "document" },
    }),
    true,
  );
  const label = createLinkFields().find(
    (f) => "name" in f && f.name === "label",
  );
  assert(label && "validate" in label);
  assert.equal(
    await (label.validate as typeof validate)("", {
      siblingData: { type: "document", document: 71 },
    }),
    "Informe o texto visivel do link.",
  );
});

test("text actions, buttons and image banners emit download anchors for PDFs", () => {
  for (const appearance of ["text", "solid"] as const) {
    const html = renderToStaticMarkup(
      createElement(BlockLink, { link: action, appearance }),
    );
    assert.match(html, /href="\/api\/media\/file\/cartilha.pdf"/);
    assert.match(html, /download=""/);
    assert.match(html, /Baixar cartilha/);
  }
  const block = FullWidthImageBannerBlock({
    blockType: "fullWidthImageBanner",
    desktopImage: image,
    link: { ...action, enabled: true },
  }) as ReactElement<{ children: ReactElement }>;
  const anchor = block.props.children;
  assert.equal(anchor.type, "a");
  const html = renderToStaticMarkup(cloneElement(anchor, {}, "Imagem"));
  assert.match(html, /download=""/);
  assert.match(html, /aria-label="Baixar PDF: Cartilha"/);
  const disabled = FullWidthImageBannerBlock({
    blockType: "fullWidthImageBanner",
    desktopImage: image,
    link: { ...action, enabled: false },
  }) as ReactElement<{ children: ReactElement }>;
  assert.notEqual(disabled.props.children.type, "a");
});
