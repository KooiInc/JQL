/**
 * Clean/sanitize html. It uses definitions from
 * [HTMLTags]{@link module:JQL/XHelpers/HtmlTags} and [Attributes]{@link module:JQL/XHelpers/Attributes}
 * @module JQL/XHelpers/HtmlCleanup
 */
import {truncate2SingleStr} from "./JQLExtensionHelpers.js";
import * as ATTRS from "./Attributes.js";
import cleanupTagInfo from "./HTMLTags.js";
let logElementCreationErrors2Console = false;

/**
 * set allowance for unknown HTML tags, exposed as <code>JQL.allowUnknownHtmlTags</code>
 * <br>See also [module HtmlTags]{@link module:JQL/XHelpers/HtmlTags}
 * @typedef allowUnknownHtmlTags
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
const logContingentErrors = elCreationInfo => {
  if (logElementCreationErrors2Console && Object.keys(elCreationInfo.removed).length) {
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
    const isSVG = child instanceof SVGElement;
    [...child.attributes]
      .forEach(attr => {
        const name = attr.name.trim().toLowerCase();
        const value = attr.value.trim().toLowerCase().replace(attrRegExpStore.whiteSpace, ``);
        const evilValue = name === "href"
            ? !attrRegExpStore.validURL.test(value) : attrRegExpStore.notAllowedValues.test(value);
        const evilAttrib = name.startsWith(`data`)
            ? !attrRegExpStore.data.test(name) : !ATTRS[isSVG ? `svg` : `html`].find(a => a === name);

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

// get restricted tags
// optionally emphasize a tag in the reporting [emphasizeTag]
const emphasize = str => `***${str}***`;
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc, []);

/**
 * Set permissions for specific tags. See [module HtmlTags]{@link module:JQL/XHelpers/HtmlTags}
 * <br>Exposed as <code>JQL.setTagPermission</code>.
 * @function
 * @name setTagPermission
 * @param tagName {string} the tag to set allowance for, e.g. <code>link</code> or <code>iframe</code>.
 * @param allowed {boolean} true: can use tag, false: can not use tag.
 */
const setTagPermission = cleanupTagInfo.setTagPermission;

/**
 * Activate/Deactivate logging of element creation errors to console.
 * @param onOff {boolean} Activate (true) or deactivate (false). Off by default.
 */
const logElementCreationErrors = onOff => logElementCreationErrors2Console = onOff;

export { cleanupHtml, getRestricted, setTagPermission, allowUnknownHtmlTags, logElementCreationErrors, };