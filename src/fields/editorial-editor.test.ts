import type { Block, Field } from "payload";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EditorialRichText } from "../blocks/shared/EditorialRichText";
import { ImageTextBlock } from "../blocks/ImageText/Component";
import { FAQAccordionBlock } from "../blocks/FAQ/Component";
import { AlertBoxBlock } from "../blocks/AlertBox/Component";

function content(state?: Record<string, string>) {
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "" as const,
      indent: 0,
      children: [
        {
          type: "paragraph",
          version: 1,
          direction: null,
          format: "" as const,
          indent: 0,
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 1,
              mode: "normal",
              style: "",
              text: "Conteúdo preservado",
              ...(state ? { $: state } : {}),
            },
          ],
        },
      ],
    },
  };
}
const formatted = content({
  fontFamily: "lora",
  fontSize: "displayLarge",
  textColor: "heading",
});

test("embedded editorial fields resolve the same toolbar features without fullscreen", async () => {
  const { default: configuration } = await import("../payload.config.ts");
  const config = await configuration;
  const pages = config.collections.find((c) => c.slug === "pages")!;
  const layout = pages.fields.find((f) => "name" in f && f.name === "layout");
  assert(layout?.type === "blocks");
  for (const slug of ["richText", "imageText", "faqAccordion", "alertBox"]) {
    const block: Block = layout.blocks.find((b) => b.slug === slug)!;
    let fields: Field[] = block.fields;
    if (slug === "faqAccordion") {
      const items = fields.find((f) => "name" in f && f.name === "items");
      assert(items?.type === "array");
      fields = items.fields;
    }
    const field: Field | undefined = fields.find(
      (f) =>
        "name" in f &&
        f.name === (slug === "faqAccordion" ? "answer" : "content"),
    );
    assert(field?.type === "richText");
    const editor = field.editor as unknown as {
      editorConfig: { resolvedFeatureMap: Map<string, unknown> };
    };
    const features = [...editor.editorConfig.resolvedFeatureMap.keys()];
    for (const feature of [
      "richTextTypography",
      "toolbarFixed",
      "experimental_table",
      "link",
      "upload",
      "heading",
    ])
      assert(features.includes(feature), `${slug}: missing ${feature}`);
    const before = field.admin?.components?.beforeInput || [];
    assert.equal(
      before.includes(
        "/components/admin/RichTextFullScreen#RichTextFullScreen",
      ),
      slug === "richText",
    );
    assert(
      before.includes(
        "/components/admin/RichTextTableMenuPortuguese#RichTextTableMenuPortuguese",
      ),
    );
    if (slug !== "richText")
      assert(
        before.includes(
          "/components/admin/EditorialEditorFonts#EditorialEditorFonts",
        ),
      );
  }
});

test("shared renderer preserves legacy markup and rejects unsupported typography", () => {
  for (const data of [
    content(),
    content({ fontFamily: "unknown", fontSize: "999px", textColor: "#ff0000" }),
  ]) {
    const html = renderToStaticMarkup(
      createElement(EditorialRichText, { data }),
    );
    assert.match(html, /Conteúdo preservado/);
    assert.match(html, /<strong>/);
    assert.doesNotMatch(html, /fonts.googleapis|999px|#ff0000/);
  }
});

test("font family, size and semantic color render in Media/Text, FAQ and Alert", () => {
  const blocks = [
    createElement(ImageTextBlock, {
      blockType: "imageText",
      content: formatted,
      image: 1,
      imagePresentation: {
        size: "medium",
        aspectRatio: "original",
        fit: "cover",
      },
      variant: "image-left",
    }),
    createElement(FAQAccordionBlock, {
      blockType: "faqAccordion",
      items: [{ id: "answer", question: "Pergunta", answer: formatted }],
      variant: "default",
    }),
    createElement(AlertBoxBlock, {
      blockType: "alertBox",
      content: formatted,
      type: "info",
    }),
  ];
  for (const block of blocks) {
    const html = renderToStaticMarkup(block);
    assert.match(html, /font-size:2rem/);
    assert.match(html, /font-family:&quot;Lora&quot;/);
    assert.match(html, /color:var\(--block-heading/);
    assert.match(html, /family=Lora/);
    assert.match(html, /<strong>/);
  }
});

test("table content renders with text formatting through shared converters", () => {
  const paragraph = formatted.root.children[0];
  const data = {
    ...formatted,
    root: {
      ...formatted.root,
      children: [
        {
          type: "table",
          version: 1,
          direction: null,
          format: "" as const,
          indent: 0,
          colWidths: [200],
          children: [
            {
              type: "tablerow",
              version: 1,
              children: [
                {
                  type: "tablecell",
                  version: 1,
                  headerState: 0,
                  colSpan: 1,
                  rowSpan: 1,
                  children: [paragraph],
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const html = renderToStaticMarkup(createElement(EditorialRichText, { data }));
  assert.match(html, /<table/);
  assert.match(html, /<td/);
  assert.match(html, /font-size:2rem/);
  assert.match(html, /Conteúdo preservado/);
});

test("inline Admin editors load controlled fonts independently of fullscreen", async () => {
  const { EditorialEditorFonts } =
    await import("../components/admin/EditorialEditorFonts");
  const html = renderToStaticMarkup(createElement(EditorialEditorFonts));
  assert.match(html, /family=Lora/);
  assert.match(html, /family=Roboto/);
  assert.doesNotMatch(html, /Tela Cheia|fullscreen|button/);
});
