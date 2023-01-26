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

import lifeStyleFactory from "./LifeStylingModule.js";

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
const setLifeStyle = lifeStyleFactory({createWithId:`JQLCustomCSS`});

const ExtendedNodeList = function ( input, root = document.body, position = insertPositions.BeforeEnd ) {
  if (ExtendedNodeList.prototype.isJQL === undefined) { initializePrototype(ExtendedNodeList); }
  this.isVirtual = root instanceof HTMLBRElement;
  this.collection = input2Collection(input);
  const isRawElemCollection = isArrayOfHtmlElements(this.collection);

  if (Array.isArray(this.collection) || isRawElemCollection) { return this; }

  try {
    this.collection = this.collection || [];
    root = root instanceof ExtendedNodeList ? root.first() : root;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml;

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

    if (shouldCreateElements) {
      [input].flat()
        .forEach(htmlFragment => this.collection.push(createElementFromHtmlString(htmlFragment)));
    }

    if (shouldCreateElements && this.collection.length > 0) {
      const errors = this.collection.filter( el => el.dataset?.jqlcreationerror );
      this.collection = this.collection.filter(el => !el.dataset?.jqlcreationerror);

      if (!this.isVirtual) {
        inject2DOMTree(this.collection, root, position);
      }

      logSystem && Log(`${logStr}\n  Created ${this.isVirtual ? ` VIRTUAL` : ``} (outerHTML truncated) [${
        truncateHtmlStr(ElemArray2HtmlString(this.collection) || 
          "sanitized: no elements remaining", logLineLength)}]`);

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
  node: (selector, root = document.body)  => new ExtendedNodeList(selector, root).first(),
  nodes: (selector, root = document.body) => new ExtendedNodeList(selector, root).collection,
  delegate: (type, origin, ...handlers) => {
    const dummy = new ExtendedNodeList(null);

    if (!origin || origin instanceof Function) {
      origin instanceof Function && handlers.push(origin);
      return dummy.delegate(type, null, ...handlers);
    }
    return dummy.delegate(type, origin, ...handlers);
  },
  virtual: html => new ExtendedNodeList(html, document.createElement("br")),
  setStyle: (selectorOrRuleString, ruleValues) => setLifeStyle(selectorOrRuleString, ruleValues),
  debugLog,
  log: Log,
  setTagPermission,
  allowUnknownHtmlTags,
  insertPositions,
  logElementCreationErrors,
  setSystemLogActiveState: activeState => logSystem = activeState,
  time,
  popup: () => popupFactory(JQL),
  text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),
}).forEach(([methodKey, method]) => JQL[methodKey] = method);

export default JQL;