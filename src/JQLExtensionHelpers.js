import { createElementFromHtmlString, element2DOM, insertPositions } from "./DOM.js";
import { debugLog, Log, systemLog } from "./JQLLog.js";
import allMethods from "./JQLMethods.js";
import PopupFactory from "./Popup.js";
import HandleFactory from "./HandlerFactory.js";
import styleFactory from "../LifeCSS/index.js";
import { randomString, toDashedNotation, IS, truncateHtmlStr,
  truncate2SingleStr, logTime, hex2RGBA, } from "./Utilities.js";
const exts = allMethods.instanceExtensions;
const loops = allMethods.straigthLoops;
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
const loop = (instance, callback) => {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) { callback(cleanCollection[i], i); }
  return instance;
};
const proxify = instance => {
  const runExt = method => (...args) => IS(method, Function) && method(proxify(instance), ...args);
  const runLoop = method => (...args) => IS(method, Function) && loop(proxify(instance), el => method(el, ...args));
  const check = name => loops[name] && runLoop(loops[name]) || exts[name] && runExt(exts[name]);
  const proxyMe = { get: (obj, name) => check(name) ?? (!isNaN(+name) ? obj.collection?.[name] : obj[name]) };
  return new Proxy( instance, proxyMe );
};
const inject2DOMTree = (
  collection = [],
  root = document.body,
  position = insertPositions.BeforeEnd ) =>
    collection.reduce((acc, elem) => {
      const created = isNode(elem) && element2DOM(elem, root, position);
      return created ? [...acc, created] : acc;
    }, []);
const addHandlerId = instance => {
  const handleId = instance.first().dataset.hid || `HID${randomString()}`;
  instance.setData({hid: handleId});
  return `[data-hid="${handleId}"]`;
};
const isVisible = function (el) {
  if (!el) { return false; }
  const elStyle = el.style;
  const computedStyle = getComputedStyle(el);
  const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
  const noDisplay = [elStyle.display, computedStyle.display].includes("none");
  const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0
    || el.offsetLeft > document.body.offsetWidth;
  const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
  return !(offscreen || noOpacity || noDisplay || invisible);
};
const getAllDataAttributeValues = el => {
  const getKey = attr => attr.nodeName.slice(attr.nodeName.indexOf(`-`) + 1);
  const data = [...el.attributes]
    .filter(da => da.nodeName.startsWith(`data-`))
    .reduce((acc, val) =>
      ({...acc, [getKey(val)]: val.nodeValue}), {});
  return Object.keys(data).length && data || undefined;
};
const defaultStaticMethods = {
  debugLog,
  log: Log,
  insertPositions,
  text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),
  node: (selector, root = document.body) => root.querySelector(selector, root),
  nodes: (selector, root = document.body) => [...root.querySelectorAll(selector, root)],
};
let static4Docs;
const addJQLStatics = $ => {
  const virtual = html => $(html, document.createElement("br"));
  const setStyle = styleFactory( { createWithId: `JQLStylesheet` } );
  const createStyle = id => styleFactory( { createWithId: id } );
  const handle = HandleFactory($);
  const delegate = (type, origin, ...handlers) => {
    if (IS(origin, Function)) {
      handlers.push(origin);
      return handle(null, type, null, ...handlers);
    }
    return handle(null, type, origin, ...handlers);
  };
  const staticMethods = {
    ...defaultStaticMethods,
    setStyle,
    createStyle,
    virtual,
    handle,
    popup: () => PopupFactory($),
    delegate: (type, origin, ...handlers) => {
      if (IS(origin, Function)) {
        handlers.push(origin);
        return handle(null, type, null, ...handlers);
      }
      return handle(null, type, origin, ...handlers);
    },
  };
  Object.entries(staticMethods).forEach(([name, method]) => $[name] = method);
  static4Docs = staticMethods;
  return $;
};

export {
  loop,
  hex2RGBA,
  isVisible,
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
