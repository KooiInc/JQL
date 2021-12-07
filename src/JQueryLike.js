import {
  debugLog,
  Log,
  setStyling4Log } from "./JQLLog.js";

import popupFactory from "./Popup.js";

import {
  setTagPermission,
  allowUnknownHtmlTags,
  logElementCreationErrors,
} from "./DOMCleanup.js";

import {
  createElementFromHtmlString,
  insertPositions,
} from "./DOM.js";

import {setStyle, customStylesheet} from "./Styling.js";

import {
  initializePrototype,
  isHtmlString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  time,
  truncateHtmlStr,
} from "./JQLExtensionHelpers.js";

const logLineLength = 75;
let logSystem = false;

customStylesheet.id = `JQLCustomCSS`;

const ExtendedNodeList = function ( input, root = document.body, position = insertPositions.BeforeEnd ) {
  if (ExtendedNodeList.prototype.isJQL === undefined) { initializePrototype(ExtendedNodeList); }

  this.collection = input2Collection(input);
  const isRawElemCollection = isArrayOfHtmlElements(this.collection);

  if (Array.isArray(this.collection) && !isRawElemCollection) {
    return this;
  }

  try {
    this.collection = this.collection || [];
    this.isVirtual = root instanceof HTMLBRElement;
    root = root instanceof ExtendedNodeList ? root.first() : root;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml || isRawElemCollection;

    if (!shouldCreateElements) {
      const forLog = setCollectionFromCssSelector(input, root, this);
      logSystem && Log(forLog);
      return this;
    }

    const logStr = (`(JQL log) raw input: [${
      truncateHtmlStr(isRawHtmlArray
        ? input.join(``) 
        : isRawElemCollection ? `Element(s): ${this.collection.map(el => el.outerHTML || el.textContent).join(``)}`
          : input, logLineLength)}]`);

    if (shouldCreateElements && !isRawElemCollection) {
      [input].flat()
        .forEach(htmlFragment => this.collection.push(createElementFromHtmlString(htmlFragment)));
    }

    if (shouldCreateElements && this.collection.length > 0) {
      const errors = this.collection.filter( el => el.dataset?.jqlcreationerror );
      this.collection = this.collection.filter(el => !el.dataset?.jqlcreationerror);
      !this.isVirtual && inject2DOMTree(this.collection, root, position);
      logSystem && Log(`${logStr}\n  Created ${this.isVirtual ? `VIRTUAL` : ``}(outerHTML truncated) [${
        truncateHtmlStr(ElemArray2HtmlString(this.collection) || "sanitized: no elements remaining", logLineLength)}]`);
      errors.length && console.error(`JQL: not rendered illegal html: "${
        errors.reduce( (acc, el) => acc.concat(`${el.textContent}\n`), ``).trim()}"` );
    }
  } catch (error) {
    const msg = `Caught jql selector or html error:\n${error.stack ? error.stack : error.message}`;
    debugLog.isOn && logSystem && (Log(msg) || console.log(msg));
  }
}

const JQL = (...args) => new ExtendedNodeList(...args);

Object.entries({
  node: selector => document.querySelector(selector),
  nodes: selector => document.querySelectorAll(selector),
  virtual: html => new ExtendedNodeList(html, document.createElement("br")),
  setStyle: (selector, ruleValues, cssId) => setStyle(selector, ruleValues, cssId),
  debugLog,
  log: Log,
  setTagPermission,
  allowUnknownHtmlTags,
  insertPositions,
  logElementCreationErrors,
  setStyling4Log,
  setSystemLogActiveState: activeState => logSystem = activeState,
  time,
  popup: () => popupFactory(JQL),
  text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),
}).forEach(([methodKey, method]) => JQL[methodKey] = method);

export default JQL;