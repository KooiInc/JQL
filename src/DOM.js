import {
  cleanupHtml,
  getRestricted, } from "./DOMCleanup.js";
import {truncateHtmlStr, IS, isNode} from "./JQLExtensionHelpers.js";
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
  if (IS(elem, Comment)) {
    return root.insertAdjacentHTML(position, `<!--${elem.data}-->`);
  }
  return root.insertAdjacentText(position, elem.data);
};
const inject2DOMTree = (
  collection = [],
  root = document.body,
  position = insertPositions.BeforeEnd ) =>
  collection.reduce( (acc, elem) => {
    const created = isNode(elem) && element2DOM(elem, root, position);
    return created ? [...acc, created] : acc;
  }, []);
const element2DOM = (elem, root = document.body, position = insertPositions.BeforeEnd) => {
  root = root?.isJQL ? root?.[0] : root;

  return IS(elem, Comment, Text) ?
    characterDataElement2DOM(elem, root, position) : root.insertAdjacentElement(position, elem);
};
const createElementFromHtmlString = htmlStr => {
  htmlStr = htmlStr.trim();
  let textNode = htmlStr.split(/<text>|<\/text>/i)
  textNode = textNode.length > 1 ? textNode.filter(v => v.length).shift() : undefined;

  if (htmlStr.startsWith(`<!--`) && htmlStr.endsWith(`-->`)) {
    return document.createComment(htmlStr.replace(/<!--|-->$/g, ''));
  }

  if (textNode) {
    return document.createTextNode(textNode);
  }

  if (!/^<(.+)[^>]+>/m.test(htmlStr)) {
     return document.createTextNode(htmlStr);
  }

  const nwElem = htmlToVirtualElement(htmlStr);

  if (nwElem.childNodes.length < 1) {
    return createElementFromHtmlString(`<span data-jqlcreationerror="1">${truncateHtmlStr(htmlStr, 60)}</span>`);
  }

  return nwElem.children[0];
};

export {
  getRestricted,
  createElementFromHtmlString,
  element2DOM,
  cleanupHtml,
  inject2DOMTree,
  insertPositions,
};