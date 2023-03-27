import { allTags } from "./EmbedResources.js";
let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};
export default {
  allowUnknownHtmlTags,
  isAllowed(elem) {
    if (lenient) { return true; }
    const nodeName = elem?.nodeName.toLowerCase() || `none`;
    const tag = allTags[nodeName];
    return !!tag;
  },
  allowTag: tag2Allow => allTags[tag2Allow.toLowerCase()] = true,
  prohibitTag: tag2Prohibit => allTags[tag.toLowerCase()] = false,
};