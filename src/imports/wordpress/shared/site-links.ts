export const sitePages = {
  home: "87",
  entenda: "172",
  "beneficios-de-regularizar-o-imovel": "210",
  situacao: "176",
  faq: "174",
  cartilha: "1145",
  "regularizacao-automatica": "193",
  "regularizacao-declaratoria-simplificada": "760",
  "regularizacao-declaratoria": "204",
  "regularizacao-comum": "206",
} as const;
export type LinkAudit = {
  from: string;
  to?: string;
  slug?: string;
  status:
    | "local-route"
    | "page-relationship"
    | "pending-page"
    | "legacy-file"
    | "unmapped";
};
export function legacyTarget(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    ![
      "meuimovelregular.prefeitura.sp.gov.br",
      "www.meuimovelregular.prefeitura.sp.gov.br",
    ].includes(url.hostname)
  )
    return null;
  let path: string;
  try {
    path = decodeURIComponent(url.pathname).replace(/\/+/g, "/");
  } catch {
    return { url, status: "unmapped" as const };
  }
  if (path.startsWith("/wp-content/"))
    return { url, status: "legacy-file" as const };
  const id = url.searchParams.get("page_id");
  const slug = id
    ? Object.keys(sitePages).find(
        (k) => sitePages[k as keyof typeof sitePages] === id,
      )
    : path.replace(/^\/+|\/+$/g, "") || "home";
  if (
    !slug ||
    !(slug in sitePages) ||
    url.username ||
    url.password ||
    path.includes("wp-admin")
  )
    return { url, status: "unmapped" as const };
  url.searchParams.delete("page_id");
  return {
    url,
    slug,
    path: (slug === "home" ? "/" : "/" + slug) + url.search + url.hash,
  };
}
export function localizeSiteLinks<T>(
  value: T,
  pages: Record<string, number> = {},
  audit: LinkAudit[] = [],
): T {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (!value || typeof value !== "object") return value;
    const node = value as Record<string, unknown>;
    if (typeof node.url === "string") {
      const target = legacyTarget(node.url);
      if (target) {
        if ("slug" in target && target.slug && "path" in target) {
          // Lexical custom links accept relative routes; block actions use Page relationships.
          if (node.linkType === "custom") {
            audit.push({
              from: node.url,
              to: target.path,
              slug: target.slug,
              status: "local-route",
            });
            return { ...node, url: target.path };
          }
          if (node.type === "external" && pages[target.slug]) {
            audit.push({
              from: node.url,
              to: "pages:" + pages[target.slug],
              slug: target.slug,
              status: "page-relationship",
            });
            const result: Record<string, unknown> = {
              ...node,
              type: "internal",
              page: pages[target.slug],
              newTab: false,
            };
            result.url = null;
            return result;
          }
          audit.push({
            from: node.url,
            slug: target.slug,
            status: "pending-page",
          });
        } else
          audit.push({ from: node.url, status: target.status || "unmapped" });
      }
    }
    const result = Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, walk(child)]),
    );
    // Payload merges nested groups on update: explicitly clear a previous external URL.
    if (
      (node.type === "internal" && node.page) ||
      (node.type === "document" && node.document)
    )
      result.url = null;
    return result;
  };
  return walk(value) as T;
}
export function linkURLs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(linkURLs);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    key === "url" && typeof child === "string" ? [child] : linkURLs(child),
  );
}
