import { createElementFromHtmlString, insertPositions, inject2DOMTree } from "./DOM.js";
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
const isComment = input => IS(input, Comment);
const isText = input => IS(input, Text);
const isHtmlString = input => IS(input, String) && /^<|>$/.test(`${input}`.trim());
const isArrayOfHtmlStrings = input => IS(input, Array) && !input?.find(s => !isHtmlString(s));
const isArrayOfHtmlElements = input => IS(input, Array) && !input?.find(el => !isNode(el));
const ElemArray2HtmlString = elems => elems?.filter(el => el).reduce((acc, el) =>
  acc.concat(isComment(el) ? `<!--${el.textContent}-->` : isCommentOrTextNode(el) ?
    el.textContent : el.outerHTML), ``);
const input2Collection = input =>
  !input ? []
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
  const check = (self, key) => {
    if (IS(key, Symbol)) { return `nothing`; }
    if (IS(+key, Number)) { return self.collection?.[key]; }
    if (key in instanceGetters) { return runGet(instanceGetters[key])().tmpKey;  }
    if (key in instanceMethods) { return runExt(instanceMethods[key]); }
    return self[key];
  }
  const proxyMe = { get: (obj, key) => check(obj, key) };
  return new Proxy( instance, proxyMe );
};
const cssRuleEdit = styleFactory( { createWithId: `JQLStylesheet` } );
const addFn = (name, fn) => instanceMethods[name] = (self, ...params) => fn(self, ...params);

let static4Docs, elems4Docs;
const addJQLStatics = jql => {
  const staticMethods = defaultStaticMethodsFactory(jql);
  Object.entries(Object.getOwnPropertyDescriptors(staticMethods))
    .forEach( ([key, descriptor]) => { Object.defineProperty(jql, key, descriptor); } );
  static4Docs = {...staticMethods};
  return jql;
};

function defaultStaticMethodsFactory(jql) {
  const states = {activePopup: undefined};
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
  let staticElements = Object.entries(tagLib.tagsRaw).reduce(staticTags, {});
  elems4Docs = Object.entries(tagLib.tagsRaw)
    .filter( ([,cando]) => cando)
    .map( ([key,]) => key)
    .sort( (a, b) => a.localeCompare(b));
  const staticMethodsFactory = jql => {
    const meths = {
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
      get prohibitTag() { return tagLib.prohibitTag; },
      get lenient() { return tagLib.allowUnknownHtmlTags; },
      get IS() { return IS; },
      popup: () => jql.Popup,
      get Popup() {
        if (!jql.activePopup) {
          jql.activePopup = PopupFactory(jql);
        }
        return jql.activePopup;
      },
      createStyle: id => styleFactory({createWithId: id || `jql${randomString()}`}),
      removeCssRule: (...rules) => rules.forEach(rule => cssRuleEdit(rule, {removeRule: 1})),
      text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),
      node: (selector, root = document) => root.querySelector(selector, root),
      nodes: (selector, root = document) => [...root.querySelectorAll(selector, root)],
  };

  return meths;
}

  const allStatics = combine(staticElements, staticMethodsFactory(jql));
  return allStatics;

  function staticTags(acc, [tag, cando]) {
    if (!cando) { return acc; }
    Object.defineProperty(acc, tag, {
      get() {
        return tag === `comment`
          ? (txt) => jql.virtual( document.createComment(txt  ?? `no text given`) )
          : tag === `txt`
            ? (txt) => jql.virtual( document.createTextNode(txt  ?? `no text given`) )
            : (html) => jql.virtual(document.createElement(tag)).append(html ?? ``);
      }
    });
    Object.defineProperty(acc, tag.toUpperCase(), {
      get() {
        return tag === `comment`
          ? (txt) => jql.virtual( document.createComment(txt ?? `no text given`) )
          : tag === `txt`
            ? (txt) => jql.virtual( document.createTextNode(txt  ?? `no text given`) )
            : jql.virtual(document.createElement(tag));
      }
    });

    return acc;
  }

  function combine(...sources) {
    const result = {}
    for (const source of sources) {
      const descriptors = Object.getOwnPropertyDescriptors(source);
      Object.entries(descriptors).forEach( ([key, descriptor]) => Object.defineProperty(result, key, descriptor) );
    }
    return result;
  }
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
  elems4Docs,
};
