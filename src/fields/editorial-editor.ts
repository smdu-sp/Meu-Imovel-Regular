import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  UploadFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { RichTextTypographyFeature } from "../blocks/RichText/typography-feature.server";

/** Shared rich-text tools; fullscreen is an independent Admin presentation choice. */
export function createEditorialEditor() {
  return lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter(
        (f) => !["link", "heading", "upload"].includes(f.key),
      ),
      HeadingFeature({
        enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5", "h6"],
      }),
      RichTextTypographyFeature(),
      LinkFeature({ enabledCollections: ["pages"] }),
      UploadFeature({
        collections: {
          media: {
            fields: [{ name: "caption", type: "text", label: "Legenda" }],
          },
        },
      }),
      FixedToolbarFeature(),
      // Keep the existing table node contract; review this experimental API on Payload upgrades.
      EXPERIMENTAL_TableFeature(),
    ],
  });
}

export function editorialEditorAdmin(fullScreen = false) {
  return {
    components: {
      beforeInput: [
        ...(fullScreen
          ? ["/components/admin/RichTextFullScreen#RichTextFullScreen"]
          : ["/components/admin/EditorialEditorFonts#EditorialEditorFonts"]),
        "/components/admin/RichTextTableMenuPortuguese#RichTextTableMenuPortuguese",
      ],
    },
  };
}
