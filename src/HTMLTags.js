import {allTags} from "./EmbedResources.js";
export default {
  isAllowed(elem) {
    const nodeName = elem?.nodeName.toLowerCase() || `none`;
    const tag = allTags[nodeName];
    return !!tag;
  },
  setTagPermission({tagName = `none`, allowed = false}) {
      tagName = tagName.toLowerCase();
      if (rawTags[tagName]) { rawTags[tagName] = allowed; } ;
  },
};