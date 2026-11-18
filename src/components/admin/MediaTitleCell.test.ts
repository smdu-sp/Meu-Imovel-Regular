import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { register } from "node:module";
import type { ClientConfig, DefaultCellComponentProps } from "payload";

// Ignore Admin stylesheet imports only in this Node test process.
register(
  "data:text/javascript," +
    encodeURIComponent(`
  export async function load(url, context, nextLoad) {
    if (url.endsWith('.css')) return {format:'module', shortCircuit:true, source:'export default {};'};
    return nextLoad(url, context);
  }
`),
  import.meta.url,
);
const { ConfigProvider, DefaultCell } = await import("@payloadcms/ui");
const { MediaTitleCell } = await import("./MediaTitleCell.tsx");

const config = {
  routes: { admin: "/admin" },
  collections: [{ slug: "media", fields: [], admin: {} }],
  globals: [],
} as unknown as ClientConfig;
const props = {
  cellData: "Imagem de teste",
  rowData: { id: 9, filename: "imagem.jpg" },
  collectionSlug: "media",
  field: { name: "title", type: "text" },
  link: true,
} satisfies DefaultCellComponentProps;
function render(cellProps: DefaultCellComponentProps) {
  const providerProps = {
    config,
    children: createElement(MediaTitleCell, cellProps),
  };
  return renderToStaticMarkup(createElement(ConfigProvider, providerProps));
}
test("Media title renders the native selection button instead of navigating to edit", () => {
  const onClick = () => {};
  const cell = MediaTitleCell({
    ...props,
    onClick,
  }) as ReactElement<DefaultCellComponentProps>;
  assert.equal(cell.type, DefaultCell);
  assert.equal(cell.props.onClick, onClick);
  const html = render({ ...props, onClick });
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /Imagem de teste/);
  assert.doesNotMatch(html, /<a\b|href=/);
});
test("Media title preserves collection navigation props and fallback names", () => {
  const cell = MediaTitleCell({
    ...props,
    linkURL: "/admin/collections/media/9",
  }) as ReactElement<DefaultCellComponentProps>;
  assert.equal(cell.props.link, true);
  assert.equal(cell.props.linkURL, "/admin/collections/media/9");
  assert.equal(cell.props.rowData, props.rowData);
  assert.match(render({ ...props, cellData: " ", link: false }), /imagem.jpg/);
  assert.match(
    render({ ...props, cellData: "", rowData: { id: 9 }, link: false }),
    />9</,
  );
});
