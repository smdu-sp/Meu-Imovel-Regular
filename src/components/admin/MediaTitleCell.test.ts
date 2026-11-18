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
const { ConfigProvider, DefaultCell, ListDrawerContextProvider } =
  await import("@payloadcms/ui");
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
function render(
  cellProps: DefaultCellComponentProps,
  selection?: (value: unknown) => void,
  native = true,
) {
  let cell: ReactElement<DefaultCellComponentProps> | undefined;
  function Probe() {
    cell = MediaTitleCell(cellProps) as ReactElement<DefaultCellComponentProps>;
    return native ? cell : null;
  }
  const drawerProps = {
    drawerSlug: selection ? "select-media" : undefined,
    onSelect: selection,
    refresh: async () => {},
    children: createElement(Probe),
  };
  const providerProps = {
    config,
    children: createElement(ListDrawerContextProvider, drawerProps),
  };
  const html = renderToStaticMarkup(
    createElement(ConfigProvider, providerProps),
  );
  assert(cell);
  return { html, cell };
}
test("Media title selects from drawer context even when custom cell props have no onClick", () => {
  for (const mimeType of ["image/jpeg", "application/pdf"]) {
    let selected: unknown;
    const rowData = { ...props.rowData, mimeType };
    const { html, cell } = render({ ...props, rowData }, (value) => {
      selected = value;
    });
    assert.equal(cell.type, DefaultCell);
    assert.equal(cell.props.link, false);
    assert.match(html, /<button[^>]*type="button"/);
    assert.doesNotMatch(html, /<a\b|href=/);
    assert(cell.props.onClick);
    cell.props.onClick({
      collectionSlug: "media",
      rowData,
      cellData: props.cellData,
    });
    assert.deepEqual(selected, {
      collectionSlug: "media",
      doc: rowData,
      docID: 9,
    });
  }
});
test("Drawer selection wins over an edit callback in custom cell props", () => {
  let selected = false;
  const { cell } = render(
    {
      ...props,
      onClick: () => {
        throw new Error("Unexpected navigation");
      },
    },
    () => {
      selected = true;
    },
  );
  cell.props.onClick!({
    collectionSlug: "media",
    rowData: props.rowData,
    cellData: props.cellData,
  });
  assert(selected);
});
test("Outside drawers title preserves navigation, explicit callbacks and fallback names", () => {
  const { cell } = render(
    { ...props, linkURL: "/admin/collections/media/9" },
    undefined,
    false,
  );
  assert.equal(cell.props.link, true);
  assert.equal(cell.props.linkURL, "/admin/collections/media/9");
  assert.equal(cell.props.rowData, props.rowData);
  const onClick = () => {};
  assert.equal(render({ ...props, onClick }).cell.props.onClick, onClick);
  assert.match(
    render({ ...props, cellData: " ", link: false }).html,
    /imagem.jpg/,
  );
  assert.match(
    render({ ...props, cellData: "", rowData: { id: 9 }, link: false }).html,
    />9</,
  );
});
