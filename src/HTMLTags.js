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
  allowTag(tag) { allTags[tag.toLowerCase()] = true; },
  prohibitTag(tag) { allTags[tag.toLowerCase()] = false; }
};