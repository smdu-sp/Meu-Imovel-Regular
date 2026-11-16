import type { CollectionConfig, TextFieldSingleValidation } from "payload";
import { fillLegacyMediaTitle, prepareMediaMetadata } from "../lib/payload/media-metadata.ts";
import {
  canCreateMedia,
  canDeleteMedia,
  canReadMedia,
  canUpdateMedia,
} from "../access/policies/media.ts";

export const allowedMediaMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
] as const;

export const mediaUsageOptions = [
  { label: "Imagem de conteudo", value: "content" },
  { label: "Imagem de fundo", value: "background" },
  { label: "Logo institucional", value: "logo" },
  { label: "Icone", value: "icon" },
  { label: "Infografico", value: "infographic" },
  { label: "Documento", value: "document" },
] as const;

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  hooks: { beforeValidate: [prepareMediaMetadata], afterRead: [fillLegacyMediaTitle] },
  access: {
    create: canCreateMedia,
    read: canReadMedia,
    update: canUpdateMedia,
    delete: canDeleteMedia,
  },
  labels: {
    singular: "Mídia",
    plural: "Mídias",
  },
  admin: {
    defaultColumns: ["preview", "title", "usage", "mimeType", "updatedAt"],
    description:
      "Organize imagens e PDFs em pastas. Imagens exigem texto alternativo; PDFs usam titulo editorial.",
    useAsTitle: "title",
    components: {
      edit: {
        beforeDocumentControls: [
          "/components/admin/AdminHelpBackButton#AdminHelpBackButton",
        ],
      },
    },
  },
  upload: {
    displayPreview: true,
    focalPoint: true,
    mimeTypes: [...allowedMediaMimeTypes],
    modifyResponseHeaders: ({ headers }) => {
      if (headers.get("Content-Type") === "image/svg+xml") {
        headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        headers.set("X-Content-Type-Options", "nosniff");
      }
      return headers;
    },
  },
  fields: [
    {
      name: "preview",
      type: "ui",
      label: "Prévia",
      admin: {
        components: {
          Cell: "/components/admin/MediaPreviewCell#MediaPreviewCell",
        },
      },
    },
    {
      name: "title",
      type: "text",
      label: "Titulo editorial",
      admin: {
        components: {
          Cell: "/components/admin/MediaTitleCell#MediaTitleCell",
        },
        description: "Nome usado no Admin e, para PDFs, no link de download. Registros antigos recebem o titulo ao serem editados.",
      },
    },
    {
      name: "usage",
      type: "select",
      label: "Uso principal",
      required: true,
      defaultValue: "content",
      admin: {
        description:
          "Classifique o papel editorial da midia. Imagens SVG sao aceitas apos validacao de seguranca; para icones e logos, use arquivos institucionais aprovados.",
      },
      options: [...mediaUsageOptions],
    },
    {
      name: "alt",
      type: "text",
      label: "Texto alternativo",
      validate: (async (value, { data, id, req }) => {
        let mimeType = req.file?.mimetype || (data as { mimeType?: string } | undefined)?.mimeType;
        if (!mimeType && id != null && req?.payload) {
          try {
            mimeType = (await req.payload.findByID({
              collection: "media",
              id,
              depth: 0,
              overrideAccess: true,
              req,
            })).mimeType || undefined;
          } catch {
            // Missing media falls through to the image accessibility requirement.
          }
        }
        if (mimeType === "application/pdf") return true;
        return typeof value === "string" && value.trim()
          ? true
          : "Descreva a imagem para pessoas que usam leitores de tela.";
      }) satisfies TextFieldSingleValidation,
      admin: {
        description: "Descreva a imagem para leitores de tela. PDFs usam o titulo editorial como nome do link.",
      },
    },
    {
      name: "caption",
      type: "textarea",
      label: "Legenda",
      admin: {
        description:
          "Opcional. Use quando a imagem precisar de credito, contexto ou complemento editorial.",
      },
    },
    {
      name: "parentMedia",
      type: "relationship",
      relationTo: "media",
      label: "Mídia original",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (_, siblingData) => Boolean(siblingData?.parentMedia),
        description: "Derivada criada pelo Canvas. O arquivo original permanece preservado.",
      },
    },
    {
      name: "isDerived",
      type: "checkbox",
      label: "Mídia derivada",
      defaultValue: false,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: "focalPoint",
      type: "group",
      label: "Ponto focal",
      admin: { readOnly: true },
      fields: [
        { name: "x", type: "number", min: 0, max: 100 },
        { name: "y", type: "number", min: 0, max: 100 },
      ],
    },
    {
      name: "editingMetadata",
      type: "json",
      label: "Metadados de edicao",
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
};

