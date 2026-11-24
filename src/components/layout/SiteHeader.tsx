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
      className="border-b border-(--block-border) border-t-4 border-t-[var(--color-brand)]"
      scheme={customTheme ? "default" : normalizeColorScheme(header?.appearance?.scheme)}
    >
      <Container size="xl">
        <div className="flex min-h-24 items-center justify-between gap-4 py-4">
          <Link
            aria-label={`${name} — página inicial`}
            className={`inline-flex min-w-0 items-center font-bold text-(--block-heading) no-underline ${logoOnRight ? "order-3" : "order-1"} ${menuSize}`}
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

          <div className={`order-2 min-w-0 flex-1 ${menuSize}`}>
            <HeaderNavigation items={navigation.items} searchEnabled={Boolean(header?.enableSearch)} />
          </div>
          {secondaryLogo ? <MediaImage className={`${logoSize} ${logoOnRight ? "order-1" : "order-3"} hidden w-auto object-contain lg:block`} media={secondaryLogo} sizes="288px" /> : null}
        </div>
      </Container>
    </ColorScope>
  );

  return customTheme
    ? <BlockThemeScope palette={header?.appearance?.colors}>{content}</BlockThemeScope>
    : content;
}
