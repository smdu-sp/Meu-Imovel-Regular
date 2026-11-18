"use client";

import { DefaultCell } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

export function MediaTitleCell(props: DefaultCellComponentProps) {
  const { cellData, rowData } = props;
  const title =
    typeof cellData === "string" && cellData.trim()
      ? cellData
      : rowData?.filename || String(rowData?.id ?? "");

  // Payload supplies selection callbacks in drawers and edit links in collection lists.
  return (
    <DefaultCell
      {...props}
      cellData={title}
      link={props.onClick ? false : props.link}
    />
  );
}
