import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IconGridBlock, normalizeIconGridBorderStyle } from "./Component.tsx";
import { IconGridBlock as IconGridConfig } from "./config.ts";

const items = [
  {
    id: "short",
    iconSource: "none" as const,
    description: "Manual",
    link: {
      label: "Baixar PDF",
      type: "external" as const,
      url: "https://example.test/manual.pdf",
    },
  },
  {
    id: "long",
    iconSource: "standard" as const,
    standardIcon: "document" as const,
    description:
      "Manual com descrição maior que ocupa diversas linhas para testar o alinhamento",
    link: {
      label: "Baixar PDF",
      type: "external" as const,
      url: "https://example.test/outro.pdf",
    },
  },
];
test("IconGrid supports approved border styles and keeps solid borders for old/unknown content", () => {
  for (const style of ["solid", "dashed", "dotted", "none"] as const) {
    const html = renderToStaticMarkup(
      createElement(IconGridBlock, {
        blockType: "iconGrid",
        items,
        appearance: { borderStyle: style },
        variant: "compact",
      }),
    );
    assert.match(
      html,
      new RegExp(style === "none" ? "border-0" : "border-" + style),
    );
    assert.match(html, /auto-rows-fr/);
    assert.match(html, /items-stretch/);
    assert.match(html, /mt-auto pt-4/);
    assert.equal((html.match(/href=/g) || []).length, 2);
  }
  for (const value of [undefined, null, "outro"]) {
    assert.equal(normalizeIconGridBorderStyle(value), "solid");
  }
  const appearance = IconGridConfig.fields.find(
    (f) => "name" in f && f.name === "appearance",
  );
  assert(appearance && "fields" in appearance);
  const border = appearance.fields.find(
    (f) => "name" in f && f.name === "borderStyle",
  );
  assert(border && border.type === "select");
  assert.equal(border.required, undefined);
  assert.equal(border.defaultValue, "solid");
});
