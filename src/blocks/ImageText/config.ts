import {
  createEditorialEditor,
  editorialEditorAdmin,
} from "../../fields/editorial-editor";
import type { Block } from "payload";
import { characterLimitAdmin } from "../../fields/character-limit";
import {
  createAppearanceGroup,
  createBlockContrastStatusField,
  createControlledColorAppearanceFields,
  createSpacingField,
  createSchemeField,
} from "../../fields/block-appearance";
import {
  closedSelect,
  requiredRichText,
} from "../../fields/editorial-validation";
import { createImagePresentationFields } from "../../fields/image-presentation";
import { createLinkFields } from "../../fields/link";
import { createBlockAdmin } from "../shared/admin";

// ImageText derives its heading, body and text link from the foreground role.
const imageTextColorTokens = ["background", "foreground"] as const;

export const ImageTextBlock: Block = {
  slug: "imageText",
  interfaceName: "ImageTextBlock",
  admin: createBlockAdmin("Mídia", {
    slug: "image-text",
    alt: "Prévia de uma composição de imagem e texto",
  }),
  labels: {
    singular: "Mídia e texto / imagem de destaque",
    plural: "Mídia e texto / imagens de destaque",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Titulo",
      maxLength: 100,
      admin: {
        ...characterLimitAdmin(100),
        description: "Opcional. Titulo da secao que acompanha a imagem.",
      },
    },
    {
      name: "content",
      type: "richText",
      editor: createEditorialEditor(),
      label: "Conteudo",
      required: true,
      validate: requiredRichText("Escreva o conteudo que acompanha a midia."),
      admin: {
        ...editorialEditorAdmin(),
        description:
          "Texto complementar exibido ao lado, acima ou abaixo da imagem, conforme a posicao escolhida.",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Imagem",
      required: true,
      admin: {
        description:
          "Imagem principal do bloco. A posicao escolhida tambem vale em celulares para as opcoes acima e abaixo.",
      },
    },
    {
      name: "imagePresentation",
      type: "group",
      label: "Apresentação da imagem",
      admin: {
        description:
          "Define como esta imagem é exibida neste bloco. O arquivo original na Mídia não é alterado.",
      },
      fields: createImagePresentationFields({
        canvas: { mediaFieldName: "image" },
        defaultSize: "medium",
        defaultAspectRatio: "original",
        defaultFit: "cover",
      }),
    },
    {
      name: "variant",
      type: "select",
      label: "Posicao da imagem",
      required: true,
      defaultValue: "image-left",
      validate: closedSelect(
        ["image-left", "image-right", "image-top", "image-bottom"],
        "Escolha uma posicao de imagem aprovada.",
      ),
      admin: {
        description:
          "A esquerda e a direita ficam lado a lado em telas grandes. Acima e abaixo mantem a ordem escolhida em todas as telas.",
      },
      options: [
        { label: "Imagem a esquerda", value: "image-left" },
        { label: "Imagem a direita", value: "image-right" },
        { label: "Imagem acima do texto", value: "image-top" },
        { label: "Imagem abaixo do texto", value: "image-bottom" },
      ],
    },
    {
      name: "cta",
      type: "group",
      label: "Acao complementar",
      admin: {
        description: "Link opcional exibido apos o texto.",
      },
      fields: createLinkFields(),
    },
    createAppearanceGroup([
      createSchemeField(["default", "surface", "muted", "custom"], "default"),
      createSpacingField(["compact", "default", "spacious"], "default"),
      ...createControlledColorAppearanceFields(imageTextColorTokens),
      createBlockContrastStatusField(imageTextColorTokens),
    ]),
  ],
};
