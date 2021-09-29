// some DOM plumbing
import {
  cleanupHtml,
  getRestricted,
  setTagPermission,
  allowUnknownHtmlTags } from "./DOMCleanup.js";

/**
 * DOM methods for JQL
 * @namespace JQL/DOM
 */

// insert Element position helper
/**
 * Helper type for positioning element (<code>insertAdjacent[HTML/HTMLElement]</code>).
 * Exposed as <code>JQL.insertPositions</code>
 * @memberof JQL/DOM
 */
const adjacents = {
  BeforeBegin: "beforebegin", // before element
  AfterBegin: "afterbegin",   // before first child
  BeforeEnd: "beforeend",     // after last child
  AfterEnd: "afterend" };     // after element

// create DOM object from html string
/**
 * Create a HTML element with id and html in memory.
 * <br>[<b>private</b>], Used for sanitizing a HTML string. Not exposed in JQL.
 * @memberof JQL/DOM
 * @param htmlString {string} The HTML to sanitize
 * @returns {Element|undefined} {HTMLElement|undefined}
 */
const htmlToVirtualElement = htmlString => {
  const placeholder = Object.assign(document.createElement("div"), { id:"placeholder", innerHTML: htmlString.trim() });

  return placeholder.childNodes.length
    ? cleanupHtml(placeholder)
    : undefined;
};

// add Element to [root] on position [position]
const element2DOM = (elem, root = document.body, position = adjacents.BeforeEnd) =>
  elem && elem instanceof HTMLElement && root.insertAdjacentElement(position, elem);


// create DOM element from [htmlStr] (in memory)
// The resulting element is always sanitized using the
// attrbutes/tags settings. Use element2DOM to fysically
// insert/append etc. it into your DOMtree
const createElementFromHtmlString = htmlStr => {
  htmlStr = htmlStr.trim();
  let nwElem = htmlToVirtualElement(htmlStr);

  if (htmlStr.startsWith(`<!--`) && htmlStr.endsWith(`-->`)) {
    document.body.appendChild(document.createComment(htmlStr.replace(/<\!\-\-|\-\->$/g, '')));
    return undefined;
  }
  
  if (!nwElem.dataset.iscomment && !nwElem.children.length) {
      nwElem = document.createElement("span");
      nwElem.dataset.invalid = "See comment in this element";
      nwElem.appendChild(document.createComment(`[${
        htmlStr}] => not valid or not allowed`));
  }

  return nwElem.dataset.invalid ? nwElem : nwElem.children[0];
};

export {
  getRestricted,
  setTagPermission,
  createElementFromHtmlString,
  element2DOM,
  cleanupHtml,
  allowUnknownHtmlTags,
  adjacents as insertPositions,
};
