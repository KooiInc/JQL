import {
  cleanupHtml,
  getRestricted,
  setTagPermission,
  allowUnknownHtmlTags } from "./DOMCleanup.js";
import { truncateHtmlStr, IS } from "./JQLExtensionHelpers.js";
const insertPositions = {
  BeforeBegin: "beforebegin",
  AfterBegin: "afterbegin",
  BeforeEnd: "beforeend",
  AfterEnd: "afterend" };
const placeholderNode = document.createElement("div");
const htmlToVirtualElement = htmlString => {
  placeholderNode.innerHTML = htmlString.trim();
  return placeholderNode.childNodes.length
    ? cleanupHtml(placeholderNode)
    : undefined;
};
const characterDataElement2DOM = (elem, root, position) => {
  switch(position) {
    case insertPositions.BeforeBegin: root.parentElement?.insertBefore(elem, root); break;
    case insertPositions.AfterBegin: root.insertBefore(elem, root.firstElementChild); break;
    case insertPositions.AfterEnd: root.parentElement?.insertBefore(elem, root.nextElementSibling); break;
    default: root.appendChild(elem); break;
  }
}
const element2DOM = (elem, root = document.body, position = insertPositions.BeforeEnd) => {
  root = root.isJQL ? root[0] : root;
  return IS(elem, Comment) ? characterDataElement2DOM(elem, root, position) :
    root.insertAdjacentElement(position, elem);
};
const createElementFromHtmlString = htmlStr => {
  htmlStr = htmlStr.trim();

  if (htmlStr.startsWith(`<!--`) && htmlStr.endsWith(`-->`)) {
    return document.createComment(htmlStr.replace(/<!--|-->$/g, ''));
  }

  const nwElem = htmlToVirtualElement(htmlStr);

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