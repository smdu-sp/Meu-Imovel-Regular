import type { Media, Page } from "../../payload-types";
import { pageSlugToPath } from "../../domain/slug";

export type NavigationLink = {
  label?: string | null;
  type?: "internal" | "external" | "document" | null;
  page?: number | Page | null;
  document?: number | Media | null;
  url?: string | null;
  newTab?: boolean | null;
};

type PageWithLifecycle = Page & {
  lifecycleStatus?: "active" | "inactive" | null;
};

export type ResolvedLink = {
  download?: boolean;
  href: string;
  label: string;
  rel?: "noopener noreferrer";
  target?: "_blank";
};

export const resolveLinkHref = (link: NavigationLink): string | null => {
  if (link.type === "document") {
    const media = link.document;
    if (
      !media ||
      typeof media !== "object" ||
      media.mimeType !== "application/pdf" ||
      !media.url
    )
      return null;
    const url = media.url;
    if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\"))
      return url;
    try {
      return ["http:", "https:"].includes(new URL(url).protocol) ? url : null;
    } catch {
      return null;
    }
  }
  if (link.type === "external") return link.url || null;
  if (link.page && typeof link.page === "object") {
    const page = link.page as PageWithLifecycle;

    if (page.lifecycleStatus === "inactive" || page._status === "draft") {
      return null;
    }

    return pageSlugToPath(page.slug);
  }

  if (link.url) {
    return link.url || null;
  }

  return null;
};

export const resolveLink = (
  link?: NavigationLink | null,
): ResolvedLink | null => {
  if (!link?.label) return null;

  const href = resolveLinkHref(link);
  if (!href) return null;

  return {
    ...(link.type === "document" ? { download: true } : {}),
    href,
    label: link.label,
    rel: link.newTab ? "noopener noreferrer" : undefined,
    target: link.newTab ? "_blank" : undefined,
  };
};
