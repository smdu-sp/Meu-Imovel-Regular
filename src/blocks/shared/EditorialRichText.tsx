import {
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import type { ComponentProps } from "react";
import {
  getRichTextFontFamily,
  getUsedRichTextFontStylesheets,
} from "../RichText/font-family";
import { getRichTextFontSize } from "../RichText/font-size";
import { getRichTextTextColor } from "../RichText/text-color";

const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    const defaultText =
      typeof defaultConverters.text === "function"
        ? defaultConverters.text(args)
        : args.node.text;
    const state = (
      args.node as {
        $?: { fontFamily?: unknown; fontSize?: unknown; textColor?: unknown };
      }
    ).$;
    const fontFamily = getRichTextFontFamily(state?.fontFamily);
    const fontSize = getRichTextFontSize(state?.fontSize);
    const color = getRichTextTextColor(state?.textColor);

    return fontFamily || fontSize || color ? (
      <span style={{ color, fontFamily, fontSize }}>{defaultText}</span>
    ) : (
      defaultText
    );
  },
});

/** Applies the same persisted Lexical typography in every editorial text field. */
export function EditorialRichText({
  data,
  className,
}: Pick<ComponentProps<typeof RichText>, "data" | "className">) {
  return (
    <>
      {getUsedRichTextFontStylesheets(data).map((href) => (
        <link
          href={href}
          key={href}
          precedence="rich-text-fonts"
          rel="stylesheet"
        />
      ))}
      <RichText
        className={className}
        converters={richTextConverters}
        data={data}
      />
    </>
  );
}
