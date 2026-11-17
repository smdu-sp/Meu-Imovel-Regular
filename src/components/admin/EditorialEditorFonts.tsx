import { allRichTextFontStylesheets } from "../../blocks/RichText/font-family";

/** Inline editors need their font resources even when no fullscreen editor is mounted. */
export function EditorialEditorFonts() {
  return (
    <>
      {allRichTextFontStylesheets.map((href) => (
        <link
          href={href}
          key={href}
          precedence="rich-text-fonts"
          rel="stylesheet"
        />
      ))}
    </>
  );
}
