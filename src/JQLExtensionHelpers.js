import { createElementFromHtmlString, insertPositions, inject2DOMTree } from "./DOM.js";
import { debugLog, Log, systemLog } from "./JQLLog.js";
import allMethods from "./JQLMethods.js";
import PopupFactory from "./Popup.js";
import HandleFactory from "./HandlerFactory.js";
import tagLib from "./HTMLTags.js";
import { randomString, toDashedNotation, IS, truncateHtmlStr, tagFNFactory,
  truncate2SingleStr, logTime, hex2RGBA, styleFactory} from "./Utilities.js";
let static4Docs = {};
const {
  instanceMethods, instanceGetters,isCommentOrTextNode, isNode, isComment, isText,
  isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings, ElemArray2HtmlString,
  input2Collection, setCollectionFromCssSelector, addHandlerId, cssRuleEdit,
  addFn, elems4Docs } = smallHelpersFactory();
Symbol.jql = Symbol.for(`jql`);
Symbol.jqlvirtual = Symbol.for(`jqlvirtual`);
Symbol.jql2Root = Symbol.for(`jql2dom`);
Symbol.JQLX = Symbol.for(`NodeProxy`);

/* region functions */
function smallHelpersFactory() {
  const cssRuleEdit = styleFactory( { createWithId: `JQLStylesheet` } );
  const addFn = (name, fn) => instanceMethods[name] = (self, ...params) => fn(self, ...params);
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
    acc.concat(isComment(el) ? `<!--${el.data}-->`
      : isCommentOrTextNode(el) ?  el.textContent
        : el.outerHTML), ``);
  const input2Collection = input =>
    !input ? []
      : IS(input, Proxy) ? [input.EL]
        : IS(input, NodeList) ? [...input]
          : isNode(input) ? [input]
            : isArrayOfHtmlElements(input) ? input
              : input.isJQL ? input.collection : undefined;
  const setCollectionFromCssSelector = (input, root, self) => {
    const selectorRoot = root !== document.body && (IS(input, String) && input.toLowerCase() !== "body") ? root : document;
    let errorStr = undefined;
    
    try { self.collection = [...selectorRoot.querySelectorAll(input)]; }
    catch (err) { errorStr = `Invalid CSS querySelector. [${!IS(input, String) ? `Nothing valid given!` : input}]`; }
    
    return errorStr ?? `CSS querySelector "${input}", output ${self.collection.length} element(s)`;
  };
  const addHandlerId = instance => {
    const handleId = instance.data.get(`hid`) || `HID${randomString()}`;
    instance.data.add({hid: handleId});
    return `[data-hid="${handleId}"]`;
  };
  const elems4Docs = Object.entries(tagLib.tagsRaw)
    .filter( ([,cando]) => cando)
    .map( ([key,]) => key)
    .sort( (a, b) => a.localeCompare(b));
  
  return {
    instanceMethods, instanceGetters,isCommentOrTextNode, isNode, isComment, isText,
    isHtmlString, isArrayOfHtmlElements, isArrayOfHtmlStrings, ElemArray2HtmlString,
    input2Collection, setCollectionFromCssSelector, addHandlerId, cssRuleEdit,
    addFn, elems4Docs };
}

function proxify(instance) {
  const runExt = method => (...args) => IS(method, Function) && method(proxify(instance), ...args);
  const runGet = method => (...args) => {
    if (IS(method, Function)) {
      return { tmpKey: method(proxify(instance), ...args) };
    }
    return { tmpKey: undefined };
  };
  const check = (self, key) => {
    if (IS(key, Symbol)) { return () =>  self; }
    if (IS(+key, Number)) { return self.collection?.[key]; }
    if (key in instanceGetters) { return runGet(instanceGetters[key])().tmpKey;  }
    if (key in instanceMethods) { return runExt(instanceMethods[key]); }
    return self[key];
  }
  const proxyMe = { get: (obj, key) => check(obj, key) };
  return new Proxy( instance, proxyMe );
}

function addJQLStaticMethods(jql) {
  Object.defineProperties(
    Node.prototype, {
      [Symbol.jql]:        {
        get: function() { return jql(this); },
        enumerable: false,
        configurable: false
      },
      [Symbol.jqlvirtual]: {
        get: function() { return jql.virtual(this); },
        enumerable: false,
        configurable: false
      },
      [Symbol.jql2Root]: {
        value: function(root = document.body, at = insertPositions.end) {
          return jql(this, root, at);
        },
        enumerable: false,
        configurable: false
      }
    });
  const staticMethods = defaultStaticMethodsFactory(jql);
  Object.entries(Object.getOwnPropertyDescriptors(staticMethods))
    .forEach( ([key, descriptor]) => {
      Object.defineProperty(jql, key, descriptor);
      Object.defineProperty(static4Docs, key, descriptor); } );
  return jql;
}

function defaultStaticMethodsFactory(jql) {
  return combineObjectSources(
    Object.entries(tagLib.tagsRaw).reduce(staticTagsLambda(jql), {}),
    staticMethodsFactory(jql));
}

function staticMethodsFactory(jql) {
  const editCssRule = (ruleOrSelector, ruleObject) => cssRuleEdit(ruleOrSelector, ruleObject);
  return {
    debugLog,
    log: (...args) => Log(`fromStatic`, ...args),
    insertPositions,
    get at() { return insertPositions; },
    editCssRules: (...rules) => rules.forEach(rule => cssRuleEdit(rule)),
    editCssRule,
    get setStyle() { /*deprecated*/return editCssRule; },
    delegate: delegateFactory(HandleFactory()),
    virtual: virtualFactory(jql),
    get fn() { return addFn; },
    allowTag: tagName => {
      tagName = tagName.toLowerCase();
      tagLib.allowTag(tagName);

      if (!IS(jql[tagName], Function)) {
        Object.defineProperties( jql, addGetters(tagName, jql) );
      }
    },
    prohibitTag: tagLib.prohibitTag,
    get lenient() { return tagLib.allowUnknownHtmlTags; },
    get IS() { return IS; },
    get Popup() {
      if (!jql.activePopup) {
        Object.defineProperty(
          jql, `activePopup`, {
            value: PopupFactory(jql),
            enumerable: false
          } );
      }
      return jql.activePopup;
    },
    popup: () => jql.Popup,
    createStyle: id => styleFactory({createWithId: id || `jql${randomString()}`}),
    editStylesheet: id => styleFactory({createWithId: id || `jql${randomString()}`}),
    removeCssRule: cssRemove,
    removeCssRules: cssRemove,
    text: (str, isComment = false) => isComment ? jql.comment(str) : document.createTextNode(str),
    node: (selector, root = document) => root.querySelector(selector, root),
    nodes: (selector, root = document) => [...root.querySelectorAll(selector, root)],
  };
}

function cssRemove(...rules) {
  if (rules.length === 1) {
    const ruleStr = String(rules.shift().trim());
    rules = !ruleStr.startsWith(`!`)
      ? ruleStr.split(`,`).map(v => v.trim())
      : [ruleStr.slice(1, -1)];
  }
  rules.map(rule => rule.startsWith(`!`) ? rule.slice(1, -1) : rule)
    .forEach(rule => cssRuleEdit(rule, {removeRule: 1}));
}

function delegateFactory(handle) {
  return function(type, origin, ...handlers) {
    if (IS(origin, Function)) {
      handlers.push(origin);
      origin = undefined;
    }
    
    return handlers.forEach(handler => handle(type, origin, handler));
  }
}

function virtualFactory(jql) {
  return function(html, root, position) {
    root = root?.isJQL ? root?.[0] : root;
    position = position && Object.values(insertPositions).find(pos => position === pos) ? position : undefined;
    const virtualElem = jql(html, document.createElement(`br`));
    if (root && !IS(root, HTMLBRElement)) {
      virtualElem.collection.forEach(elem =>
        position ? root.insertAdjacentElement(position, elem) : root.append(elem));
    }
    return virtualElem;
  }
}

function combineObjectSources(...sources) {
  const result = {};
  
  for (const source of sources) {
    const descriptors = Object.getOwnPropertyDescriptors(source);
    Object.entries(descriptors).forEach( ([key, descriptor]) =>
      !(key in result) && Object.defineProperty(result, key, descriptor) );
  }
  
  return result;
}

function tagGetterFactory(tagName, jql) {
  tagName = tagName.toLowerCase();
  
  return {
    get() { return (...args) =>
        IS(jql, Function)
          ? tagLib.tagsRaw[tagName.toLowerCase()] && jql.virtual(tagFNFactory[tagName](...args)) || undefined
          : tagLib.tagsRaw[tagName.toLowerCase()] && tagFNFactory[tagName](...args)  || undefined;
    },
    enumerable: false,
    configurable: false,
  }
}

function addGetters(tag, jql) {
  const getterForThisTag = tagGetterFactory(tag);
  const jqlGetterForThisTag = tagGetterFactory(tag.replace(/_jql$/i, ``), jql);
  return {
    [tag]: getterForThisTag,
    [tag.toUpperCase()]: getterForThisTag,
    [`${tag}_jql`]: jqlGetterForThisTag,
    [`${tag.toUpperCase()}_JQL`]: jqlGetterForThisTag,
  };
}

function staticTagsLambda(jql) {
  return function(acc, [tag, cando]) {
    Object.defineProperties( acc, addGetters(tag, jql) );
    return acc;
  }
}
/* endregion functions */

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
  addJQLStaticMethods,
  createElementFromHtmlString,
  insertPositions,
  systemLog,
  IS,
  static4Docs,
  elems4Docs,
};
