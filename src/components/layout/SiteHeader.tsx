import Link from "next/link";
import type { CSSProperties } from "react";

import { MediaImage } from "../../blocks/shared/MediaImage";
import { resolveHeaderNavigation } from "../../lib/navigation/resolve-header-navigation";
import { normalizeColorScheme } from "../../lib/theme/block-color-theme";
import type { Header } from "../../payload-types";
import { BlockThemeScope, ColorScope, Container } from "../ui";
import { HeaderNavigation } from "./HeaderNavigation";

export function SiteHeader({
  header,
  siteName,
}: {
  header?: Header | null;
  siteName?: string | null;
}) {
  const name = siteName?.trim() || "Portal";
  const navigation = resolveHeaderNavigation(header);
  const customTheme = header?.appearance?.scheme === "custom";
  const logoSizes = {
    small: { height: "2.5rem", width: "10rem" },
    medium: { height: "3.5rem", width: "14rem" },
    large: { height: "5rem", width: "18rem" },
  };
  const logoSize =
    logoSizes[
      header?.logoSize === "small" || header?.logoSize === "large"
        ? header.logoSize
        : "medium"
    ];
  const logoStyle: CSSProperties = {
    height: "var(--mir-header-logo-height)",
    width: "auto",
    maxWidth: "100%",
  };
  const headerStyle = {
    "--mir-header-logo-height": logoSize.height,
    "--mir-header-logo-width": logoSize.width,
  } as CSSProperties;
  const menuSize = { small: "text-sm", medium: "text-base", large: "text-lg" }[
    header?.textSize ?? "medium"
  ];
  const secondaryLogo =
    header?.secondaryLogo && typeof header.secondaryLogo === "object"
      ? header.secondaryLogo
      : null;
  const logoOnRight = header?.logoPosition === "right";

  const content = (
    <ColorScope
      as="header"
      className="border-b border-(--block-border)"
      scheme={
        customTheme
          ? "default"
          : normalizeColorScheme(header?.appearance?.scheme)
      }
    >
      <div aria-hidden="true" className="mir-brand-stripe" />
      <Container size="xl">
        <div
          className={`mir-header-inner${logoOnRight ? " mir-header-inner--logo-right" : ""}`}
          style={headerStyle}
        >
          <Link
            aria-label={`${name} — página inicial`}
            className={`mir-header-brand font-bold text-(--block-heading) no-underline ${logoOnRight ? "order-3" : "order-1"} ${menuSize}`}
            href="/"
          >
            {header?.logo && typeof header.logo === "object" ? (
              <MediaImage
                className="object-contain"
                style={logoStyle}
                media={header.logo}
                priority
                sizes="256px"
              />
            ) : (
              <span className="wrap-break-word">{name}</span>
            )}
          </Link>

          <div className={`mir-header-nav order-2 ${menuSize}`}>
            <HeaderNavigation
              items={navigation.items}
              searchEnabled={Boolean(header?.enableSearch)}
            />
          </div>
          {secondaryLogo ? (
            <MediaImage
              className={`mir-header-secondary ${logoOnRight ? "order-1" : "order-3"} hidden w-auto object-contain lg:block`}
              style={logoStyle}
              media={secondaryLogo}
              sizes="288px"
            />
          ) : null}
        </div>
      </Container>
    </ColorScope>
  );

  return customTheme ? (
    <BlockThemeScope palette={header?.appearance?.colors}>
      {content}
    </BlockThemeScope>
  ) : (
    content
  );
}
