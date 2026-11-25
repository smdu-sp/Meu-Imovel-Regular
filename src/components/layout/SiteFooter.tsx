import type { Footer } from "../../payload-types";
import { MediaImage } from "../../blocks/shared/MediaImage";
import { isSocialIcon, SOCIAL_ICON_LABELS } from "../../domain/icons";
import { resolveOfficialHttpsUrl } from "../../domain/official-url";
import { normalizeColorScheme } from "../../lib/theme/block-color-theme";
import { BlockThemeScope, ColorScope, Container, Icon } from "../ui";

function telephoneHref(phone: string): string {
  return `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
}

export function SiteFooter({ footer }: { footer?: Footer | null }) {
  const logo =
    footer?.logo &&
    typeof footer.logo === "object" &&
    footer.logo.url &&
    (!footer.logo.mimeType || footer.logo.mimeType.startsWith("image/"))
      ? footer.logo
      : null;
  const secondaryLogo =
    footer?.secondaryLogo && typeof footer.secondaryLogo === "object"
      ? footer.secondaryLogo
      : null;
  const logoSize = {
    small: "max-h-12 max-w-40",
    medium: "max-h-20 max-w-64",
    large: "max-h-28 max-w-80",
  }[footer?.logoSize ?? "medium"];
  const textSize = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  }[footer?.textSize ?? "medium"];
  const socialLinks = (footer?.socialLinks ?? []).flatMap((item) => {
    const href = resolveOfficialHttpsUrl(item.url);
    const icon = isSocialIcon(item.icon) ? item.icon : null;
    const visibleLabel = item.label?.trim() ?? "";
    const label = visibleLabel || (icon ? SOCIAL_ICON_LABELS[icon] : "");
    return href && label ? [{ href, icon, label, visibleLabel }] : [];
  });
  const institutionalLinks = (footer?.institutionalLinks ?? []).flatMap((item) => {
    const href = resolveOfficialHttpsUrl(item.url);
    return href && item.label.trim() ? [{ href, label: item.label }] : [];
  });
  const hasAddress = Boolean(footer?.address || footer?.inPersonService);
  const hasContact = Boolean(footer?.phone || footer?.email);

  if (!logo && !secondaryLogo && !hasAddress && !hasContact && !socialLinks.length && !institutionalLinks.length) {
    return null;
  }

  const customTheme = footer?.appearance?.scheme === "custom";
  const content = (
    <ColorScope
      as="footer"
      className="mt-auto"
      scheme={customTheme ? "default" : normalizeColorScheme(footer?.appearance?.scheme, "muted")}
    >
      <div aria-hidden="true" className="mir-brand-stripe" />
      <Container size="xl">
        <div className={`mir-footer-grid ${textSize}`}>
          {logo || secondaryLogo || institutionalLinks.length ? (
            <div>
              {logo || secondaryLogo ? (
                <div className={`mir-footer-brand ${footer?.logoPosition === "right" ? "justify-end" : "justify-start"}`}>
                  {logo ? (
                    <MediaImage
                      className={`h-auto w-auto object-contain ${logoSize}`}
                      media={logo}
                      sizes="320px"
                    />
                  ) : null}
                  {secondaryLogo ? (
                    <MediaImage
                      className={`h-auto w-auto object-contain ${logoSize}`}
                      media={secondaryLogo}
                      sizes="320px"
                    />
                  ) : null}
                </div>
              ) : null}
              {institutionalLinks.length ? (
                <nav aria-labelledby="footer-institutional-title" className="mt-5">
                  <h2 className="font-bold text-(--block-heading)" id="footer-institutional-title">
                    Links institucionais
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {institutionalLinks.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <a className="underline underline-offset-4" href={link.href}>{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          ) : null}

          {hasAddress ? (
            <section aria-labelledby="footer-address-title">
              <h2 className="font-bold text-(--block-heading)" id="footer-address-title">
                Atendimento presencial
              </h2>
              {footer?.address ? <address className="mt-3 whitespace-pre-line not-italic">{footer.address}</address> : null}
              {footer?.inPersonService ? <p className="mt-3 whitespace-pre-line">{footer.inPersonService}</p> : null}
            </section>
          ) : null}

          {hasContact ? (
            <section aria-labelledby="footer-contact-title">
              <h2 className="font-bold text-(--block-heading)" id="footer-contact-title">
                Contatos
              </h2>
              <div className="mt-3 space-y-2">
                {footer?.phone ? (
                  <p><a className="underline underline-offset-4" href={telephoneHref(footer.phone)}>{footer.phone}</a></p>
                ) : null}
                {footer?.email ? (
                  <p><a className="underline underline-offset-4" href={`mailto:${footer.email}`}>{footer.email}</a></p>
                ) : null}
              </div>
            </section>
          ) : null}

          {socialLinks.length ? (
            <nav aria-labelledby="footer-social-title">
              <h2 className="font-bold text-(--block-heading)" id="footer-social-title">
                Redes sociais
              </h2>
              <ul className="mt-3 space-y-2">
                {socialLinks.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <a
                      aria-label={link.visibleLabel ? undefined : link.label}
                      className="inline-flex items-center gap-2 underline underline-offset-4"
                      href={link.href}
                    >
                      {link.icon ? <Icon name={link.icon} size="xl" tone="current" /> : null}
                      {link.visibleLabel ? <span>{link.visibleLabel}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </Container>
    </ColorScope>
  );

  return customTheme
    ? <BlockThemeScope palette={footer?.appearance?.colors}>{content}</BlockThemeScope>
    : content;
}
