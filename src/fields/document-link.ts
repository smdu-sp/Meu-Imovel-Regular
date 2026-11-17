import type { UploadField, UploadFieldSingleValidation } from "payload";

/** Shared by ordinary actions and the image banner's enabled/disabled action. */
export function createDocumentLinkField(
  active: (data: Record<string, unknown>) => boolean = (data) =>
    data.type === "document",
): UploadField {
  return {
    name: "document",
    type: "upload",
    relationTo: "media",
    label: "Documento PDF",
    filterOptions: { mimeType: { equals: "application/pdf" } },
    admin: {
      condition: (_, siblingData) => active(siblingData),
      description:
        "Selecione um PDF da biblioteca, inclusive por pasta. O link acompanha a URL atual do arquivo.",
    },
    validate: (async (value, { req, siblingData }) => {
      if (!active(siblingData as Record<string, unknown>)) return true;
      const id =
        typeof value === "object" && value !== null && "id" in value
          ? value.id
          : value;
      if (typeof id !== "number" && (typeof id !== "string" || !id.trim()))
        return "Selecione um documento PDF.";
      if (!req?.payload) return "Não foi possível validar o documento PDF.";
      try {
        const media = await req.payload.findByID({
          collection: "media",
          id,
          depth: 0,
          overrideAccess: false,
          req,
        });
        return media.mimeType === "application/pdf"
          ? true
          : "Selecione um arquivo PDF da biblioteca.";
      } catch {
        return "O documento PDF selecionado não foi encontrado.";
      }
    }) satisfies UploadFieldSingleValidation,
  };
}
