import Link from "next/link";

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
  const logoSize = { small: "h-10 max-w-40", medium: "h-14 max-w-56", large: "h-20 max-w-72" }[header?.logoSize ?? "medium"];
  const menuSize = { small: "text-sm", medium: "text-base", large: "text-lg" }[header?.textSize ?? "medium"];
  const secondaryLogo = header?.secondaryLogo && typeof header.secondaryLogo === "object" ? header.secondaryLogo : null;
  const logoOnRight = header?.logoPosition === "right";

  const content = (
    <ColorScope
      as="header"
      className="border-b border-(--block-border)"
      scheme={customTheme ? "default" : normalizeColorScheme(header?.appearance?.scheme)}
    >
      <div aria-hidden="true" className="mir-brand-stripe" />
      <Container size="xl">
        <div className="mir-header-inner">
          <Link
            aria-label={`${name} — página inicial`}
            className={`mir-header-brand font-bold text-(--block-heading) no-underline ${logoOnRight ? "order-3" : "order-1"} ${menuSize}`}
            href="/"
          >
            {header?.logo && typeof header.logo === "object" ? (
              <MediaImage
                className={`${logoSize} w-auto object-contain`}
                media={header.logo}
                priority
                sizes="256px"
              />
            ) : (
              <span className="wrap-break-word">{name}</span>
            )}
          </Link>

          <div className={`mir-header-nav order-2 ${menuSize}`}>
            <HeaderNavigation items={navigation.items} searchEnabled={Boolean(header?.enableSearch)} />
          </div>
          {secondaryLogo ? <MediaImage className={`mir-header-secondary ${logoSize} ${logoOnRight ? "order-1" : "order-3"} hidden w-auto object-contain lg:block`} media={secondaryLogo} sizes="288px" /> : null}
        </div>
      </Container>
    </ColorScope>
  );

  return customTheme
    ? <BlockThemeScope palette={header?.appearance?.colors}>{content}</BlockThemeScope>
    : content;
}
