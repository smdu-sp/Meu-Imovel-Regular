import type { Block } from "payload";
import { createImagePresentationFields } from "../../fields/image-presentation";
import { ImageTextBlock } from "../ImageText/config";
import { createBlockAdmin } from "../shared/admin";

export const MirTextMediaBlock: Block = {
  ...ImageTextBlock,
  slug: "mirTextMedia",
  interfaceName: "MirTextMediaBlock",
  admin: createBlockAdmin("Meu Imóvel Regular", {
    slug: "mir-text-media",
    alt: "Bloco MIR com texto acima da imagem",
  }),
  labels: { singular: "MIR: texto e mídia", plural: "MIR: textos e mídias" },
  fields: ImageTextBlock.fields
    .filter((field) => "name" in field && field.name !== "variant")
    .map((field) =>
      "name" in field && field.name === "imagePresentation"
        ? {
            ...field,
            fields: createImagePresentationFields({
              canvas: { mediaFieldName: "image" },
              defaultSize: "medium",
              defaultAspectRatio: "original",
              defaultFit: "cover",
              dbNames: { size: "sz", aspectRatio: "asp", fit: "fit" },
            }),
          }
        : field,
    ),
};
