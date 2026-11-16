import { open } from "node:fs/promises";
import type { CollectionAfterReadHook, CollectionBeforeValidateHook } from "payload";

const PDF_MIME = "application/pdf";
const PDF_SIGNATURE = Buffer.from("%PDF-");

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function filenameTitle(value: unknown): string {
  const filename = text(value);
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

async function hasPdfSignature(file: NonNullable<Parameters<CollectionBeforeValidateHook>[0]["req"]["file"]>): Promise<boolean> {
  if (file.data?.length) {
    return file.data.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
  }
  if (!file.tempFilePath) return false;
  const handle = await open(file.tempFilePath, "r");
  try {
    const header = Buffer.alloc(PDF_SIGNATURE.length);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return bytesRead === header.length && header.equals(PDF_SIGNATURE);
  } finally {
    await handle.close();
  }
}

export const prepareMediaMetadata: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;

  const mimeType = req.file?.mimetype || text(data.mimeType) || text(originalDoc?.mimeType);
  const next = { ...data };

  if (mimeType === PDF_MIME) {
    if (req.file && !(await hasPdfSignature(req.file))) {
      throw new Error("O arquivo enviado nao possui assinatura de PDF valida.");
    }
    if (operation === "create" && !text(data.title)) {
      throw new Error("Informe um titulo editorial para o PDF.");
    }
    next.usage = "document";
  } else if (next.usage === "document") {
    throw new Error("A classificacao Documento e exclusiva de arquivos PDF.");
  }

  next.title =
    text(next.title) ||
    text(originalDoc?.title) ||
    text(next.alt) ||
    text(originalDoc?.alt) ||
    filenameTitle(req.file?.name || next.filename || originalDoc?.filename);

  if (!next.title) {
    throw new Error("Informe um titulo editorial para esta midia.");
  }

  return next;
};

export const fillLegacyMediaTitle: CollectionAfterReadHook = ({ doc }) => {
  if (!doc) return doc;
  const title = text(doc.title) || text(doc.alt) || filenameTitle(doc.filename);
  return title ? { ...doc, title } : doc;
};
