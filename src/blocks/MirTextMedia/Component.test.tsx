import assert from "node:assert/strict";
import { test } from "node:test";
import { MirTextMediaBlock, type MirTextMediaProps } from "./Component";

test("MIR text and media places the image after the text", () => {
  const block = {
    blockType: "mirTextMedia",
    title: "Título do bloco",
    image: 1,
    imagePresentation: { size: "medium", aspectRatio: "original", fit: "cover" },
    content: { root: { children: [], type: "root", version: 1, direction: null, format: "", indent: 0 } },
  } as MirTextMediaProps;
  const element = MirTextMediaBlock(block);
  assert.equal(element.props.variant, "image-bottom");
  assert.equal(element.props.image, block.image);
  assert.equal(element.props.content, block.content);
});
