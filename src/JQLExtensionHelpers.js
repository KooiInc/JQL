import { createElementFromHtmlString, element2DOM, insertPositions, inject2DOMTree } from "./DOM.js";
import { debugLog, Log, systemLog } from "./JQLLog.js";
import allMethods from "./JQLMethods.js";
import PopupFactory from "./Popup.js";
import HandleFactory from "./HandlerFactory.js";
import styleFactory from "../LifeCSS/index.js";
import tagLib from "./HTMLTags.js";
import { randomString, toDashedNotation, IS, truncateHtmlStr,
  truncate2SingleStr, logTime, hex2RGBA, } from "./Utilities.js";
const instanceMethods = allMethods.instanceExtensions;
const instanceGetters = allMethods.factoryExtensions;
const isCommentOrTextNode = elem => IS(elem, Comment, Text);
const isNode = input => IS(input, Text, HTMLElement, Comment);
const isHtmlString = input => IS(input, String) && /^<|>$/.test(`${input}`.trim());
const isArrayOfHtmlStrings = input => IS(input, Array) && !input?.find(s => !isHtmlString(s));
const isArrayOfHtmlElements = input => IS(input, Array) && !input?.find(el => !isNode(el));
const isComment = input => IS(input, Comment);
const ElemArray2HtmlString = elems => elems?.filter(el => el).reduce((acc, el) =>
  acc.concat(isComment(el) ? `<!--${el.textContent}-->` : isCommentOrTextNode(el) ?
    el.textContent : el.outerHTML), ``);
const input2Collection = input => !input ? []
    : IS(input, NodeList) ? [...input]
      : isNode(input) ? [input]
        : isArrayOfHtmlElements(input) ? input
          : input.isJQL ? input.collection : undefined;
const setCollectionFromCssSelector = (input, root, self) => {
  const selectorRoot = root !== document.body && (IS(input, String) && input.toLowerCase() !== "body") ? root : document;
  let errorStr = undefined;
  try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
  catch (err) { errorStr =  `Invalid CSS querySelector. [${input}]`; }
  return errorStr ?? `CSS querySelector "${input}", output ${self.collection.length} element(s)`;
};
const addHandlerId = instance => {
  const handleId = instance.data.get(`hid`) || `HID${randomString()}`;
  instance.data.add({hid: handleId});
  return `[data-hid="${handleId}"]`;
};
const proxify = instance => {
  const runExt = method => (...args) => IS(method, Function) && method(proxify(instance), ...args);
  const runGet = method => (...args) => {
    if (IS(method, Function)) {
      return { tmpKey: method(proxify(instance), ...args) };
    }
    return { tmpKey: undefined };
  };
  const check = name => {
    if (instanceGetters[name]) { return runGet(instanceGetters[name])().tmpKey;  }
    return instanceMethods[name] && runExt(instanceMethods[name]);
  }
  const proxyMe = { get: (obj, name) => check(name) ?? (/^\d+$/.test(`${name}`) ? obj.collection?.[name] : obj[name]) };
  return new Proxy( instance, proxyMe );
};
const getAllDataAttributeValues = el => {
  const getKey = attr => attr.nodeName.slice(attr.nodeName.indexOf(`-`) + 1);
  const data = [...el.attributes]
    .filter(da => da.nodeName.startsWith(`data-`))
    .reduce((acc, val) =>
      ({...acc, [getKey(val)]: val.nodeValue}), {});
  return Object.keys(data).length && data || undefined;
};
const cssRuleEdit = styleFactory( { createWithId: `JQLStylesheet` } );
const addFn = (name, fn) => instanceMethods[name] = (self, ...params) => fn(self, ...params);

let static4Docs;
const addJQLStatics = jql => {
  const staticMethods = defaultStaticMethodsFactory(jql);
  Object.keys(staticMethods).forEach( k =>
    Object.defineProperty(jql, k, Object.getOwnPropertyDescriptor(staticMethods, k)));
  static4Docs = {...staticMethods};
  return jql;
};

function defaultStaticMethodsFactory(jql) {
  const breakElement = document.createElement(`br`);
  const editCssRules = (...rules) => rules.forEach(rule => cssRuleEdit(rule));
  const editCssRule = (ruleOrSelector, ruleObject) => cssRuleEdit(ruleOrSelector, ruleObject);
  const virtual = (html, root, position) => {
    root = root?.isJQL ? root?.[0] : root;
    position = position && Object.values(insertPositions).find(pos => position === pos) ? position : undefined;
    const virtualElem = jql(html, breakElement);
    if (root) {
      virtualElem.collection.forEach(elem =>
        position ? root.insertAdjacentElement(position, elem) : root.append(elem));
    }
    return virtualElem;
  };
  const handle = HandleFactory();
  const delegate = (type, origin, ...handlers) => {
    if (IS(origin, Function)) {
      handlers.push(origin);
      origin = undefined;
    }

    return handlers.forEach(handler => handle(type, origin, handler));
  };

  return {
    debugLog,
    log: (...args) => Log(`fromStatic`, ...args),
    insertPositions,
    get at() { return insertPositions; },
    editCssRules,
    editCssRule,
    setStyle: editCssRule,
    delegate,
    virtual,
    get fn() { return addFn; },
    get allowTag() { return tagLib.allowTag; },
    get prohibitTag() { return tagLib.prohibitTag },
    get lenient() { return tagLib.allowUnknownHtmlTags; },
    get IS() { return IS; },
    popup: () => PopupFactory(jql),
    createStyle: id => styleFactory( { createWithId: id || `jql${randomString()}` } ),
    removeCssRule: (...rules) => rules.forEach(rule => cssRuleEdit(rule, {removeRule: 1})),
    text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),
    node: (selector, root = document) => root.querySelector(selector, root),
    nodes: (selector, root = document) => [...root.querySelectorAll(selector, root)],
  };
}

export {
  hex2RGBA,
  addHandlerId,
  isHtmlString,
  isNode,
  logTime,
  toDashedNotation,
  randomString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  isCommentOrTextNode,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  truncateHtmlStr,
  truncate2SingleStr,
  proxify,
  addJQLStatics,
  createElementFromHtmlString,
  insertPositions,
  systemLog,
  IS,
  static4Docs,
};
