import { truncate2SingleStr, IS } from "./JQLExtensionHelpers.js";
import cleanupTagInfo from "./HTMLTags.js";
import {ATTRS} from "./EmbedResources.js";
let logElementCreationErrors2Console = false;
const allowUnknownHtmlTags = {
  on: () => cleanupTagInfo.lenient = true,
  off: () => cleanupTagInfo.lenient = false,
};
const attrRegExpStore = {
  data: /data-[\-\w.\p{L}]/ui, // data-* minimal 1 character after dash
  validURL: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  whiteSpace: /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g,
  notAllowedValues: /javascript|injected|noreferrer|alert|DataURL/gi
};
const logContingentErrors = elCreationInfo => {
  if (logElementCreationErrors2Console && Object.keys(elCreationInfo.removed).length) {
    const msgs = Object.entries(elCreationInfo.removed)
      .reduce( (acc, [k, v]) => [...acc, `${k} => ${v}`], [])
      .join(`\\000A`);
    console.info(`JQL HTML creation errors:`);
    console.info(msgs);
  }
};
const cleanupHtml = elem => {
  const template = document.createElement("template");
  const elCreationInfo = {
    rawHTML: elem.outerHTML,
    removed: { },
  }
  template.innerHTML = `<div id="placeholder">${elem.outerHTML}</div>`;
  const el2Clean = template.content.querySelector("#placeholder");
  el2Clean.querySelectorAll("*").forEach(child => {
    const attrStore = IS(child, SVGElement) ? ATTRS.svg : ATTRS.html;
    [...child.attributes]
      .forEach(attr => {
        const name = attr.name.trim().toLowerCase();
        const value = attr.value.trim().toLowerCase().replace(attrRegExpStore.whiteSpace, ``);
        const evilValue = name === "href"
            ? !attrRegExpStore.validURL.test(value) : attrRegExpStore.notAllowedValues.test(value);
        const evilAttrib = name.startsWith(`data`) ? !attrRegExpStore.data.test(name) : !!attrStore[name];

        if (evilValue || evilAttrib) {
          elCreationInfo.removed[`${attr.name}`] = `attribute/property (-value) not allowed, remove (value: ${
            truncate2SingleStr(attr.value || `none`, 60)})`;
          child.removeAttribute(attr.name);
        }
    });
    const allowed = cleanupTagInfo.isAllowed(child);
    if (!allowed) {
      elCreationInfo.removed[`<${child.nodeName.toLowerCase()}>`] = `not allowed, not rendered (tag: ${
        truncate2SingleStr(child.outerHTML, 60)})`;
      child.remove();
    }
  });
  logContingentErrors(elCreationInfo);
  return el2Clean.children[0];
};
const emphasize = str => `***${str}***`;
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc, []);
const setTagPermission = cleanupTagInfo.setTagPermission;
const logElementCreationErrors = onOff => logElementCreationErrors2Console = onOff;

export { cleanupHtml, getRestricted, setTagPermission, allowUnknownHtmlTags, logElementCreationErrors, };