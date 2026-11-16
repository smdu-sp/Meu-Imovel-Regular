import type { Block, UploadFieldSingleValidation } from "payload";
import { createBlockAdmin } from "../shared/admin";

export const DocumentListBlock: Block = {
  slug: "documentList",
  interfaceName: "DocumentListBlock",
  admin: createBlockAdmin("Conteúdo", {
    slug: "document-list",
    alt: "Lista de documentos PDF para consulta e download",
  }),
  labels: {
    singular: "Lista de PDFs",
    plural: "Listas de PDFs",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      label: "Titulo da lista",
    },
    {
      name: "items",
      type: "array",
      label: "PDFs",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "label",
          type: "text",
          label: "Nome do link (opcional)",
          admin: { description: "Se vazio, usa o titulo editorial da midia." },
        },
        {
          name: "file",
          type: "upload",
          relationTo: "media",
          label: "PDF",
          required: true,
          filterOptions: {
            mimeType: { equals: "application/pdf" },
          },
          validate: (async (value, { req }) => {
            const id = typeof value === "object" && value !== null && "id" in value
              ? value.id
              : value;
            if (typeof id !== "number" && typeof id !== "string") {
              return "Selecione um PDF da biblioteca de midia.";
            }
            if (!req?.payload) return true;
            try {
              const media = await req.payload.findByID({
                collection: "media",
                id,
                depth: 0,
                overrideAccess: true,
                req,
              });
              return media.mimeType === "application/pdf"
                ? true
                : "Selecione uma midia classificada como documento PDF.";
            } catch {
              return "O PDF selecionado nao foi encontrado.";
            }
          }) satisfies UploadFieldSingleValidation,
        },
      ],
    },
  ],
};
