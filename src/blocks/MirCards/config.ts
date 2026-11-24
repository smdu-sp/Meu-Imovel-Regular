import type { Block } from "payload";
import { createEditorialEditor } from "../../fields/editorial-editor";
import { createImagePresentationFields } from "../../fields/image-presentation";
import { createLinkFields } from "../../fields/link";
import { createBlockAdmin } from "../shared/admin";

export const MirCardsBlock: Block = {
  slug: "mirCards",
  interfaceName: "MirCardsBlock",
  admin: createBlockAdmin("Meu Imóvel Regular", {
    slug: "mir-cards",
    alt: "Composições de cards MIR para modalidades, benefícios e atendimento",
  }),
  labels: { singular: "MIR: cards", plural: "MIR: cards" },
  fields: [
    { name: "title", type: "text", label: "Título da seção" },
    {
      name: "style",
      type: "select",
      label: "Composição",
      required: true,
      defaultValue: "homeModality",
      options: [
        { label: "Home: modalidades", value: "homeModality" },
        { label: "Home: chamadas", value: "homeAction" },
        { label: "Entenda a Lei: modalidades", value: "lawModality" },
        { label: "Benefícios", value: "benefit" },
        { label: "Dúvidas Frequentes: atendimento", value: "contact" },
      ],
    },
    {
      name: "items",
      dbName: "items",
      type: "array",
      label: "Cards",
      required: true,
      minRows: 1,
      maxRows: 12,
      admin: { initCollapsed: true },
      fields: [
        { name: "title", type: "text", label: "Título", required: true },
        { name: "content", type: "richText", label: "Texto ou lista", editor: createEditorialEditor() },
        { name: "image", type: "upload", relationTo: "media", label: "Imagem", required: true },
        {
          name: "imagePresentation",
          type: "group",
          label: "Apresentação da imagem",
          fields: createImagePresentationFields({
            canvas: { mediaFieldName: "image" },
            sizes: ["small", "medium", "large"],
            defaultSize: "medium",
            defaultAspectRatio: "original",
            dbNames: { size: "sz", aspectRatio: "asp", fit: "fit" },
          }),
        },
        {
          name: "imagePosition",
          type: "select",
          label: "Posição da imagem",
          defaultValue: "left",
          options: [
            { label: "Esquerda", value: "left" },
            { label: "Direita", value: "right" },
          ],
          admin: { description: "Usado nas composições Home: modalidades e Benefícios." },
        },
        {
          name: "textSize",
          type: "select",
          label: "Tamanho do texto",
          defaultValue: "medium",
          options: [
            { label: "Pequeno", value: "small" },
            { label: "Médio", value: "medium" },
            { label: "Grande", value: "large" },
          ],
        },
        { name: "link", type: "group", label: "Ação", fields: createLinkFields() },
      ],
    },
  ],
};
