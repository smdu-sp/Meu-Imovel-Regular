"use client";

import { useConfig } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import type { DefaultCellComponentProps } from "payload";

export function MediaTitleCell({ cellData, rowData }: DefaultCellComponentProps) {
  const { config } = useConfig();
  const id = rowData?.id;
  const title = typeof cellData === "string" && cellData.trim()
    ? cellData
    : rowData?.filename || String(id ?? "");
  if (id == null) return <span>{title}</span>;

  const href = formatAdminURL({
    adminRoute: config.routes.admin,
    path: `/collections/media/${encodeURIComponent(String(id))}`,
  });

  return <a className="media-title-link" href={href} onClick={(event) => event.stopPropagation()}>{title}</a>;
}
