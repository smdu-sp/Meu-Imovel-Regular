import type { DocumentListBlock as DocumentListBlockProps, Media } from "../../payload-types";
import { Container, Heading, Section } from "../../components/ui";

export function formatDocumentSize(bytes: number | null | undefined): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return null;
  const size = bytes >= 1024 * 1024 ? bytes / (1024 * 1024) : bytes / 1024;
  const unit = bytes >= 1024 * 1024 ? "MB" : "KB";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(size)} ${unit}`;
}

export function DocumentListBlock({ heading, items }: DocumentListBlockProps) {
  const documents = items
    .map((item) => {
      const file = item.file;
      if (!file || typeof file !== "object" || file.mimeType !== "application/pdf" || !file.url) {
        return null;
      }
      const media = file as Media;
      const label = item.label?.trim() || media.title?.trim() || media.filename || "Documento";
      return { id: item.id || media.id, href: file.url, label, size: formatDocumentSize(media.filesize) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!documents.length) return null;

  return (
    <Section spacing="md" scheme="default">
      <Container size="md">
        {heading ? <Heading level={2} size="lg">{heading}</Heading> : null}
        <ul className={`${heading ? "mt-6 " : ""}space-y-3`}>
          {documents.map((document) => (
            <li key={document.id}>
              <a
                className="inline-flex min-h-11 items-center rounded-sm text-(--block-foreground) underline decoration-(--block-accent) underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                href={document.href}
              >
                {document.label} (PDF{document.size ? `, ${document.size}` : ""})
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
