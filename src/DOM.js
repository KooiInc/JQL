// some DOM plumbing
// noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

import {
  cleanupHtml,
  getRestricted,
  setTagPermission,
  allowUnknownHtmlTags } from "./DOMCleanup.js";
import {truncateHtmlStr} from "./Helpers.js";

/**
 * Methods for manipulating the <code>Document Object [Model]</code> (aka <code>DOM</code>)
 * @Module DOM
 */

/**
 * The possible positions of elements to insert (<code>HTMLElement.insertAdjacent[HTML/HTMLElement]</code>).
 * @typedef adjacents
 * @property BeforeBegin {string} before element
 * @property AfterBegin {string} before first child
 * @property BeforeEnd {string} after last child
 * @property AfterEnd {string} after element
 */
const adjacents = {
  BeforeBegin: "beforebegin",
  AfterBegin: "afterbegin",
  BeforeEnd: "beforeend",
  AfterEnd: "afterend" };

/**
 * Create a HTML element from a html string in memory.
 * @param htmlString {string} The HTML string to use
 * <br><b>Note</b>: the html is sanizited
 * @returns {HTMLElement|undefined} {HTMLElement|undefined}
 */
const htmlToVirtualElement = htmlString => {
  const placeholder = Object.assign(document.createElement("div"), { id:"placeholder", innerHTML: htmlString.trim() });

  return placeholder.childNodes.length
    ? cleanupHtml(placeholder)
    : undefined;
};

/**
 * Add a <code>HTMLElement</code> to the document
 * @param elem {HTMLElement} The element to add
 * @param root {HTMLElement} The root element the element should be added to (default: document.body)
 * @param position {string} the position where the element must end up (default <code>beforeend</code>)
 */
const element2DOM = (elem, root = document.body, position = adjacents.BeforeEnd) => {
  if (elem) {
    if (elem instanceof HTMLElement) {
      return root.insertAdjacentElement(position, elem);
    }
    if (elem instanceof Comment) {
      root.insertAdjacentHTML(position, `<!--${elem.textContent}-->`);
      return elem;
    }
  }
};

/**
 * Convert a html string to an instance of <code>HTMLElement</code>.
 * <br><b>Note</b>: the resulting element is always sanitized using the
 * attrbutes/tags settings. Use <code>DOM.element2DOM</code> to fysically
 * insert/append etc. it into your DOMtree
 * @param htmlStr {string} The html to convert to <code>HTMLElement</code>
 * e.g. <code>&lt;p id="id" class="someClass">Hello &lt;span style="color: green">world&lt;/span>&lt;/p></code>
 * @returns {HTMLElement|Comment} the newly created <code>HTMLElement</code> instance or nothing
 * (in case of creating a html comment)
 */
const createElementFromHtmlString = htmlStr => {
  htmlStr = htmlStr.trim();
  let nwElem = htmlToVirtualElement(htmlStr);

  if (htmlStr.startsWith(`<!--`) && htmlStr.endsWith(`-->`)) {
    return document.createComment(htmlStr.replace(/<!--|-->$/g, ''));
  }
  
  if (!nwElem.children.length) {
      nwElem = document.createElement("span");
      nwElem.dataset.invalid = "See comment in this element";
      nwElem.appendChild(document.createComment(`JQL element creation: ${
        truncateHtmlStr(htmlStr, 100)} => not valid or not allowed`));
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
