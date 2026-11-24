import type { Block } from "payload";
import { FullWidthImageBannerBlock } from "../FullWidthImageBanner/config";
import { createBlockAdmin } from "../shared/admin";

export const MirBannerBlock: Block = {
  ...FullWidthImageBannerBlock,
  slug: "mirBanner",
  interfaceName: "MirBannerBlock",
  admin: createBlockAdmin("Mídia", {
    slug: "mir-banner",
    alt: "Banner MIR com imagem responsiva e marca sobreposta",
  }),
  labels: { singular: "MIR: banner", plural: "MIR: banners" },
  fields: [
    ...FullWidthImageBannerBlock.fields,
    {
      name: "badgeImage",
      type: "upload",
      relationTo: "media",
      label: "Imagem sobreposta",
      admin: { description: "Opcional. Exibida sobre o banner, como a marca da Home." },
    },
    {
      name: "badgePosition",
      type: "select",
      label: "Posição da imagem sobreposta",
      defaultValue: "right",
      options: [
        { label: "Esquerda", value: "left" },
        { label: "Direita", value: "right" },
      ],
    },
  ],
};
