import type { Media } from "../../payload-types";
import { FullWidthImageBannerBlock, type FullWidthImageBannerBlockProps } from "../FullWidthImageBanner/Component";
import { MediaImage } from "../shared/MediaImage";

export type MirBannerProps = Omit<FullWidthImageBannerBlockProps, "blockType"> & {
  blockType: "mirBanner";
  badgeImage?: Media | number | null;
  badgePosition?: "left" | "right" | null;
};

export function MirBannerBlock({ badgeImage, badgePosition, ...banner }: MirBannerProps) {
  return (
    <section className="relative border-t-4 border-t-[var(--color-brand)]">
      <FullWidthImageBannerBlock {...banner} blockType="fullWidthImageBanner" />
      {badgeImage && typeof badgeImage === "object" ? (
        <div className={`pointer-events-none absolute inset-y-0 flex w-full items-center px-5 sm:px-10 ${badgePosition === "left" ? "justify-start" : "justify-end"}`}>
          <MediaImage className="h-auto max-h-32 w-auto max-w-[35vw] object-contain sm:max-h-56" media={badgeImage} sizes="(max-width: 640px) 35vw, 224px" />
        </div>
      ) : null}
    </section>
  );
}
