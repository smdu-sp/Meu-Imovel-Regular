import type {
  Field,
  RelationshipFieldSingleValidation,
  TextFieldValidation,
} from "payload";

import { createDocumentLinkField } from "./document-link";

export type LinkSiblingData = {
  label?: string | null;
  page?: unknown;
  document?: unknown;
  type?: "internal" | "external" | "document" | null;
  url?: string | null;
};

export const createLinkFields = (required = false): Field[] => [
  {
    name: "label",
    type: "text",
    label: "Texto do link",
    required,
    validate: ((value, { siblingData }) => {
      const link = siblingData as LinkSiblingData;
      const hasDestination = Boolean(
        link.page || link.url || link.document || link.type === "document",
      );

      return required || hasDestination
        ? typeof value === "string" && value.trim()
          ? true
          : "Informe o texto visivel do link."
        : true;
    }) satisfies TextFieldValidation,
    admin: {
      description:
        "Texto visivel para o usuario. Use uma acao clara, como Abrir pagina ou Saiba mais.",
    },
  },
  {
    name: "type",
    type: "select",
    label: "Destino do link",
    required,
    defaultValue: "internal",
    admin: {
      description:
        "Escolha página interna, URL externa ou documento PDF da biblioteca.",
    },
    options: [
      { label: "Pagina interna", value: "internal" },
      { label: "URL externa", value: "external" },
      { label: "Documento PDF", value: "document" },
    ],
  },
  {
    name: "page",
    type: "relationship",
    relationTo: "pages",
    label: "Pagina interna",
    admin: {
      condition: (_, siblingData) => siblingData?.type === "internal",
      description:
        "Pagina publicada ou em rascunho dentro deste CMS. Mudancas de slug nao quebram este relacionamento.",
    },
    validate: ((value, { siblingData }) => {
      const link = siblingData as LinkSiblingData;
      return link.type !== "internal" ||
        (!required && !link.label && !link.url) ||
        value
        ? true
        : "Informe o destino interno deste link.";
    }) satisfies RelationshipFieldSingleValidation,
  },
  {
    name: "url",
    type: "text",
    label: "URL externa",
    admin: {
      condition: (_, siblingData) => siblingData?.type === "external",
      description:
        "Informe o endereco completo, incluindo http:// ou https://.",
    },
    validate: ((value, { siblingData }) => {
      const link = siblingData as LinkSiblingData;
      if (link.type !== "external") return true;
      if (!required && !link.label && !link.page) return true;
      if (!value) return "Informe o destino externo deste link.";

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
          ? true
          : "Use uma URL iniciada por http:// ou https://.";
      } catch {
        return "Informe uma URL valida.";
      }
    }) satisfies TextFieldValidation,
  },
  createDocumentLinkField(),
  {
    name: "newTab",
    type: "checkbox",
    label: "Abrir em nova aba",
    defaultValue: false,
    admin: {
      description:
        "Recomendado para links externos, mantendo o portal aberto na aba atual.",
    },
  },
];
