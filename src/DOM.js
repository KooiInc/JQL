import {
  cleanupHtml,
  getRestricted,
  setTagPermission,
  allowUnknownHtmlTags } from "./DOMCleanup.js";
import {truncateHtmlStr} from "./JQLExtensionHelpers.js";
const insertPositions = {
  BeforeBegin: "beforebegin",
  AfterBegin: "afterbegin",
  BeforeEnd: "beforeend",
  AfterEnd: "afterend" };
const htmlToVirtualElement = htmlString => {
  const placeholder = Object.assign(document.createElement("div"), { id:"placeholder", innerHTML: htmlString.trim() });

  return placeholder.childNodes.length
    ? cleanupHtml(placeholder)
    : undefined;
};
const element2DOM = (elem, root = document.body, position = insertPositions.BeforeEnd) => {
  if (elem) {
    if (elem instanceof HTMLElement) {
      return root.insertAdjacentElement(position, elem);
    }

    if (elem && elem instanceof Comment || elem instanceof Text) {

      if (position === insertPositions.BeforeEnd) {
        root.appendChild(elem);
      }

      if (position === insertPositions.AfterBegin) {
        root.insertBefore(elem, root.firstElementChild);
      }

    }
  }
};
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
  insertPositions,
};