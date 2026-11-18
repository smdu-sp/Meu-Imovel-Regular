"use client";

import { DefaultCell, useListDrawerContext } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

export function MediaTitleCell(props: DefaultCellComponentProps) {
  const { cellData, rowData } = props;
  const { isInDrawer, onSelect } = useListDrawerContext();
  const onClick: DefaultCellComponentProps["onClick"] =
    isInDrawer && typeof onSelect === "function"
      ? ({ collectionSlug, rowData }) =>
          onSelect({ collectionSlug, doc: rowData, docID: rowData.id })
      : props.onClick;
  const title =
    typeof cellData === "string" && cellData.trim()
      ? cellData
      : rowData?.filename || String(rowData?.id ?? "");

  // Custom cells bypass RenderDefaultCell, which normally injects the drawer callback.
  return (
    <DefaultCell
      {...props}
      cellData={title}
      onClick={onClick}
      link={onClick ? false : props.link}
    />
  );
}
