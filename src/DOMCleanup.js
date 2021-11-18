/**
 * @module HtmlCleanup
 */
import {truncate2SingleStr} from "./Helpers.js";
import * as ATTRS from "./Attributes.js";
import cleanupTagInfo from "./HTMLTags.js";
const log = true;

/**
 * set allowance for unknown HTML tags, exposed as <code>JQL.allowUnknownHtmlTags</code>
 * @typedef allowUnknownHtmlTags
 * @type {Object}
 * @property {function} on Allow unknown HTML tags
 * @property {function} off Do not allow unknown HTML tags (default)
 */
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
const logPossibleErrors = elCreationInfo => {
  if (log && Object.keys(elCreationInfo.removed).length) {
    const msgs = Object.entries(elCreationInfo.removed)
      .reduce( (acc, [k, v]) => [...acc, `${k} => ${v}`], [])
      .join(`\n`);
    console.info(`JQL HTML creation errors:\n`,msgs);
  }
};
// cleanup a given html element
const cleanupHtml = elem => {
  const template = document.createElement("template");
  const elCreationInfo = {
    rawHTML: elem.outerHTML,
    removed: { },
  }
  template.innerHTML = `<div id="placeholder">${elem.outerHTML}</div>`;
  const el2Clean = template.content.querySelector("#placeholder");
  el2Clean.querySelectorAll("*").forEach(child => {
    [...child.attributes]
      .forEach(attr => {
        const name = attr.name.trim().toLowerCase();
        const value = attr.value.trim().toLowerCase().replace(attrRegExpStore.whiteSpace, ``);
        const evilValue = name === "href"
            ? !attrRegExpStore.validURL.test(value) : attrRegExpStore.notAllowedValues.test(value);
        const evilAttrib = name.startsWith(`data`)
            ? !attrRegExpStore.data.test(name) : !ATTRS.html.find(a => a === name);

        if (evilValue) {
          elCreationInfo.removed[`${attr.name}`] = `Illegal attribute value, attribute not rendered (value: ${
            truncate2SingleStr(attr.value || `none`, 60)})`;
          child.removeAttribute(attr.name);
        }

        if (!evilValue && evilAttrib) {
          elCreationInfo.removed[`${attr.name}`] = `Not rendered illegal attribute (value: ${
            truncate2SingleStr(attr.value || `none`, 60)})`;
          child.removeAttribute(attr.name);
        }
    });
    const tagInSet = cleanupTagInfo.isAllowed(child);
    if (!tagInSet) {
      elCreationInfo.removed[`<${child.nodeName.toLowerCase()}>`] = `Illegal tag, not rendered (value: ${
        truncate2SingleStr(child.outerHTML, 60)})`;
      child.parentNode.removeChild(child);
    }
  });
  logPossibleErrors(elCreationInfo);
  return el2Clean.children[0];
};

// get restricted tags
// optionally emphasize a tag in the reporting [emphasizeTag]
const emphasize = str => `***${str}***`;
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc, []);

const setTagPermission = cleanupTagInfo.setTagPermission;

export {cleanupHtml, getRestricted, setTagPermission, allowUnknownHtmlTags};