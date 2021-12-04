// some DOM plumbing
// noinspection

import {
  cleanupHtml,
  getRestricted,
  setTagPermission,
  allowUnknownHtmlTags } from "./DOMCleanup.js";
import {truncateHtmlStr} from "./JQLExtensionHelpers.js";

/**
 * Methods for manipulating the <code>Document Object [Model]</code> (aka <code>DOM</code>)
 * @Module JQL/XHelpers/DOM
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
 * Derive a HTML element <i>in memory</i> from a given html string.
 * @private
 * @param htmlString {string} The HTML string to use
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
 * @param elem {HTMLElement}|Comment|Text The element to add
 * @param root {HTMLElement} The root element the element should be added to (default: document.body)
 * @param position {string|adjacents} the position where the element must end up (default <code>"beforeend"</code>)
 */
const element2DOM = (elem, root = document.body, position = adjacents.BeforeEnd) => {
  if (elem) {
    if (elem instanceof HTMLElement) {
      // noinspection JSCheckFunctionSignatures
      return root.insertAdjacentElement(position, elem);
    }

    if (elem && elem instanceof Comment || elem instanceof Text) {
      if (position === adjacents.BeforeEnd) {
        root.appendChild(elem);
      }

      if (position === adjacents.AfterBegin) {
        root.insertBefore(elem, root.firstElementChild);
      }

    }
  }
};

/**
 * Convert a html string to an instance of <code>HTMLElement</code>.
 * <br><b>Note</b>: the resulting element(s) is/are always sanitized.
 * Use <code>DOM.element2DOM</code> to fysically insert/append etc. it into your DOMtree
 * e.g. <code>&lt;p id="id" class="someClass">Hello &lt;span style="color: green">world&lt;/span>&lt;/p></code>
 * or <code>&lt;!-- a comment --></code>
 * @param htmlStr {string} The html to convert to <code>HTMLElement</code>
 * @returns {HTMLElement|Comment} the newly created <code>HTMLElement</code> instance or a comment element
 * (in case of creating a html comment)
 */
const createElementFromHtmlString = htmlStr => {
  htmlStr = htmlStr.trim();
  let nwElem = htmlToVirtualElement(htmlStr);

  if (htmlStr.startsWith(`<!--`) && htmlStr.endsWith(`-->`)) {
    return document.createComment(htmlStr.replace(/<!--|-->$/g, ''));
  }
  
  if (!nwElem.children.length) {
      return createElementFromHtmlString(`<span data-jqlcreationerror="1">${truncateHtmlStr(htmlStr, 60)}</span>`);
  }

  return nwElem.children[0];
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
