import type { ReactNode } from "react";
import type {
  ColorScheme,
  EditorialColorOverrides,
} from "../../lib/theme/block-color-theme";
import { ColorScope } from "./ColorScope";
import { classNames } from "./classNames";

const cardPaddings = { none: "", sm: "p-5", md: "p-6", lg: "p-8" } as const;
export type CardPadding = keyof typeof cardPaddings;
const cardBorders = {
  solid: "border border-solid",
  dashed: "border border-dashed",
  dotted: "border border-dotted",
  none: "border-0",
} as const;
export type CardBorderStyle = keyof typeof cardBorders;
type CardProps = {
  children: ReactNode;
  borderStyle?: CardBorderStyle;
  className?: string;
  scheme?: ColorScheme | "inherit";
  overrides?: EditorialColorOverrides | null;
  fullHeight?: boolean;
  padding?: CardPadding;
};

export function Card({
  children,
  borderStyle = "solid",
  className,
  scheme = "surface",
  overrides,
  fullHeight = false,
  padding = "md",
}: CardProps) {
  return (
    <ColorScope
      scheme={scheme}
      overrides={overrides}
      className={classNames(
        "flex flex-col overflow-hidden rounded-lg border-(--block-border)",
        cardBorders[borderStyle],
        cardPaddings[padding],
        fullHeight && "h-full",
        className,
      )}
    >
      {children}
    </ColorScope>
  );
}
