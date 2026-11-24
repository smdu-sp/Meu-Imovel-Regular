import type { MirCardsBlock as MirCardsProps } from "../../payload-types";
import { BlockLink } from "../shared/BlockLink";
import { EditorialRichText } from "../shared/EditorialRichText";
import { PresentedMediaImage } from "../shared/PresentedMediaImage";
import { Container, Section } from "../../components/ui";
import type { ImagePresentation } from "../shared/image-presentation";

type Item = MirCardsProps["items"][number];

const textSizes = { small: "text-sm", medium: "text-base", large: "text-lg" } as const;
const imageWidths = { small: "max-w-48", medium: "max-w-72", large: "max-w-full" } as const;

function CardContent({ item, centered = false }: { item: Item; centered?: boolean }) {
  const textSize = item.textSize && item.textSize in textSizes ? item.textSize : "medium";
  return (
    <div className={`${centered ? "text-center" : ""} ${textSizes[textSize]}`}>
      <h3 className="mb-3 text-xl font-bold text-[var(--block-heading)] sm:text-2xl">{item.title}</h3>
      {item.content ? <EditorialRichText className="cms-rich-text" data={item.content} /> : null}
      {item.link?.label ? <div className="mt-5"><BlockLink appearance="outline" link={item.link} /></div> : null}
    </div>
  );
}

function CardImage({ item, style, className = "" }: { item: Item; style: MirCardsProps["style"]; className?: string }) {
  const size = item.imagePresentation?.size;
  const width = size && size in imageWidths ? imageWidths[size as keyof typeof imageWidths] : imageWidths.medium;
  const defaultAspectRatio = style === "contact" || style === "lawModality" ? "1:1" : style === "benefit" ? "original" : "4:3";
  const presentation = {
    ...item.imagePresentation,
    aspectRatio: item.imagePresentation?.aspectRatio ?? defaultAspectRatio,
    fit: item.imagePresentation?.fit ?? "cover",
  } as ImagePresentation;
  return (
    <PresentedMediaImage
      className={`${className} ${width} w-full object-cover`}
      media={item.image}
      presentation={presentation}
      sizes="(min-width: 1024px) 40vw, 100vw"
    />
  );
}

function MirCard({ item, style }: { item: Item; style: MirCardsProps["style"] }) {
  const right = item.imagePosition === "right";
  if (style === "homeModality") return (
    <article className="relative grid items-center gap-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <CardImage item={item} style={style} className={`min-h-64 !max-w-none rounded-2xl ${right ? "lg:order-2" : ""}`} />
      <div className={`relative mx-4 -mt-10 rounded-3xl border-r-4 border-[var(--color-brand)] bg-[var(--color-surface)] p-8 shadow-lg lg:mx-0 lg:mt-0 ${right ? "lg:order-1 lg:-mr-10" : "lg:-ml-10"}`}>
        <CardContent item={item} centered />
      </div>
    </article>
  );
  if (style === "benefit") return (
    <article className="grid items-center gap-0 lg:grid-cols-2">
      <div className={`rounded-3xl border-2 border-dashed border-[var(--color-brand)] p-8 ${right ? "lg:order-1" : "lg:order-2"}`}><CardContent item={item} /></div>
      <CardImage item={item} style={style} className={`mx-auto -mt-5 rounded-2xl lg:mt-0 lg:!max-w-none ${right ? "lg:order-2 lg:-ml-5" : "lg:order-1 lg:-mr-5"}`} />
    </article>
  );
  if (style === "lawModality") return (
    <article className="grid items-center gap-6 rounded-3xl border-2 border-dashed border-[var(--color-brand)] p-6 sm:grid-cols-[8rem_1fr] lg:grid-cols-[10rem_1fr]">
      <CardImage item={item} style={style} className="aspect-square !max-w-40 rounded-full" />
      <CardContent item={item} />
    </article>
  );
  if (style === "contact") return (
    <article className="rounded-b-3xl border-2 border-dashed border-[var(--color-brand)] px-6 pb-8 text-center">
      <CardImage item={item} style={style} className="mx-auto mb-5 aspect-square !max-w-56 rounded-full" />
      <CardContent item={item} centered />
    </article>
  );
  return (
    <article className="overflow-hidden rounded-b-3xl border-2 border-dashed border-[var(--color-brand)]">
      <CardImage item={item} style={style} className="!max-w-none" />
      <div className="p-8"><CardContent item={item} centered /></div>
    </article>
  );
}

export function MirCardsBlock({ title, style, items }: MirCardsProps) {
  const stacked = style === "homeModality" || style === "benefit" || style === "lawModality";
  return (
    <Section>
      <Container size="lg">
        {title ? <h2 className="mb-8 text-3xl font-bold text-[var(--block-heading)]">{title}</h2> : null}
        <div className={stacked ? "grid gap-10" : "grid gap-8 md:grid-cols-2 lg:grid-cols-3"}>
          {items?.map((item, index) => <MirCard item={item} key={item.id ?? index} style={style} />)}
        </div>
      </Container>
    </Section>
  );
}
