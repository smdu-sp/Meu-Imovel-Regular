"use client";

import { Thumbnail } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

type MediaPreviewRow = {
  filename?: string | null;
  mimeType?: string | null;
  thumbnailURL?: string | null;
  url?: string | null;
};

export function MediaPreviewCell({ rowData }: DefaultCellComponentProps) {
  const media = rowData as MediaPreviewRow;
  if (media.mimeType === "application/pdf") {
    return (
      <span className="media-preview-cell media-preview-cell--pdf">
        <Thumbnail doc={{ filename: "PDF" }} fileSrc="/admin-icons/pdf-file.svg" size="small" />
      </span>
    );
  }
  if (!media.mimeType?.startsWith("image/")) return null;

  const src = media.thumbnailURL || media.url;
  if (!src) return null;

  return (
    <span className="media-preview-cell">
      <Thumbnail doc={{ filename: "" }} fileSrc={src} size="small" />
    </span>
  );
}
