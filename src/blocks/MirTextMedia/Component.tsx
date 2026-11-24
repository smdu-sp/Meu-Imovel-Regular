import type { ImageTextBlock as ImageTextProps } from "../../payload-types";
import { ImageTextBlock } from "../ImageText/Component";

export type MirTextMediaProps = Omit<ImageTextProps, "blockType" | "variant"> & {
  blockType: "mirTextMedia";
};

export function MirTextMediaBlock(props: MirTextMediaProps) {
  return <ImageTextBlock {...props} blockType="imageText" variant="image-bottom" />;
}
