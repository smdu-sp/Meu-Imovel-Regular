import type { MirCardsBlock as MirCardsProps } from "../../payload-types";
import { Container, Section } from "../../components/ui";
import { BlockLink } from "../shared/BlockLink";
import { EditorialRichText } from "../shared/EditorialRichText";
import { PresentedMediaImage } from "../shared/PresentedMediaImage";
import type { ImagePresentation } from "../shared/image-presentation";

type Item = MirCardsProps["items"][number];

const textSizes = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
} as const;

const fullWidthImageClasses = {
  small: "w-full",
  medium: "w-full",
  large: "w-full",
  full: "w-full",
} as const;

function CardAction({ item }: { item: Item }) {
  return item.link?.label ? (
    <div className="mir-card-action">
      <BlockLink appearance="outline" link={item.link} />
    </div>
  ) : null;
}

function CardContent({
  centered = false,
  item,
  showAction = true,
}: {
  centered?: boolean;
  item: Item;
  showAction?: boolean;
}) {
  const textSize =
    item.textSize && item.textSize in textSizes ? item.textSize : "medium";

  return (
    <div className={`mir-card-copy ${centered ? "mir-card-copy--centered" : ""} ${textSizes[textSize]}`}>
      <h3 className="mir-card-heading">{item.title}</h3>
      {item.content ? (
        <EditorialRichText className="cms-rich-text mir-card-rich-text" data={item.content} />
      ) : null}
      {showAction ? <CardAction item={item} /> : null}
    </div>
  );
}

function CardImage({
  className = "",
  item,
  style,
}: {
  className?: string;
  item: Item;
  style: MirCardsProps["style"];
}) {
  const size = item.imagePresentation?.size ?? "medium";
  const defaultAspectRatio =
    style === "contact" || style === "lawModality"
      ? "1:1"
      : style === "benefit"
        ? "original"
        : "4:3";
  const presentation = {
    ...item.imagePresentation,
    aspectRatio: item.imagePresentation?.aspectRatio ?? defaultAspectRatio,
    fit: item.imagePresentation?.fit ?? "cover",
  } as ImagePresentation;

  return (
    <div className={`mir-card-media mir-card-media--${size} ${className}`}>
      <PresentedMediaImage
        className="mir-card-image"
        media={item.image}
        presentation={presentation}
        sizeClassNames={fullWidthImageClasses}
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    </div>
  );
}

function MirCard({ item, style }: { item: Item; style: MirCardsProps["style"] }) {
  const imageOnRight = item.imagePosition === "right";

  if (style === "homeModality") {
    return (
      <article className={`mir-home-modality ${imageOnRight ? "mir-home-modality--image-right" : ""}`}>
        <CardImage className="mir-home-image" item={item} style={style} />
        <div className="mir-home-panel">
          <CardContent centered item={item} />
        </div>
      </article>
    );
  }

  if (style === "benefit") {
    return (
      <article className={`mir-benefit ${imageOnRight ? "mir-benefit--image-right" : ""}`}>
        <div className="mir-benefit-text">
          <CardContent item={item} />
        </div>
        <CardImage className="mir-benefit-image" item={item} style={style} />
      </article>
    );
  }

  if (style === "lawModality") {
    return (
      <article className="mir-law-modality">
        <CardImage className="mir-law-image" item={item} style={style} />
        <CardContent item={item} showAction={false} />
        <CardAction item={item} />
      </article>
    );
  }

  if (style === "contact") {
    return (
      <article className="mir-contact-card">
        <CardImage className="mir-contact-image" item={item} style={style} />
        <CardContent centered item={item} />
      </article>
    );
  }

  return (
    <article className="mir-action-card">
      <CardImage className="mir-action-image" item={item} style={style} />
      <CardContent centered item={item} />
    </article>
  );
}

export function MirCardsBlock({ title, style, items }: MirCardsProps) {
  return (
    <Section spacing="compact">
      <Container size="lg">
        {title ? <h2 className="mir-card-section-title">{title}</h2> : null}
        <div className={`mir-card-list mir-card-list--${style}`}>
          {items?.map((item, index) => (
            <MirCard item={item} key={item.id ?? index} style={style} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
