// noinspection JSCheckFunctionSignatures,JSUnresolvedVariable,JSUnusedGlobalSymbols,ES6UnusedImports,JSUnresolvedFunction,JSUnusedLocalSymbols
import allLambdas from "./JQLMethods.js"
import {element2DOM, insertPositions} from "./DOM.js";
const ExtendedNodeList = {dummy: `JSDoc dummy 'type'`};

//#region common helpers
/**
 * Some helpers for JQL (module, extensions).
 * @module JQL/XHelpers/ExtensionHelpers
 */
// no comment
const pad0 = (nr, n=2) => `${nr}`.padStart(n, `0`);
const isCommentOrTextNode = elem => elem && elem instanceof Comment || elem instanceof Text;
const isNode = input => [Text, HTMLElement, Comment].find(c => input instanceof c);
const isHtmlString = input => input?.constructor === String && /^<|>$/.test(`${input}`.trim());
const isArrayOfHtmlStrings = input => Array.isArray(input) && !input?.find(s => !isHtmlString(s));
const isArrayOfHtmlElements = input => Array.isArray(input) && !input?.find(el => !isNode(el));
const ElemArray2HtmlString = elems => elems?.filter(el => el)
  .reduce((acc, el) => acc.concat(isCommentOrTextNode(el) ? el.textContent : el.outerHTML), ``);
const input2Collection = input => !input ? []
    : input instanceof NodeList ? [...input]
      : isNode(input) ? [input]
        : isArrayOfHtmlElements(input) ? input
          : input.isJQL ? input.collection : undefined;
const setCollectionFromCssSelector = (input, root, self) => {
  /** determine the root to query from */
  const selectorRoot = root !== document.body &&
      (input?.constructor === String && input.toLowerCase() !== "body") ? root : document;
  self.collection = [...selectorRoot.querySelectorAll(input)];
  return `(JQL log) css querySelector [${input}], output ${self.collection.length} element(s)`;
};
const randomString = (() => {
  const characters = [...Array(26)]
    .map((x, i) => String.fromCharCode(i + 65))
    .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
    .concat([...Array(10)].map((x, i) => `${i}`));
  const getCharacters = excludes =>
    excludes && characters.filter(c => !~excludes.indexOf(c)) || characters;
  const random = (len = 12, excludes = []) => {
    const chars = getCharacters(excludes);
    return [...Array(len)]
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  };

  return {
    random,
    // html element-id's can not start with a number
    randomHtmlElementId: (len = 12, excludes = []) => {
      const charsWithoutNumbers = getCharacters(excludes.concat('0123456789'.split("")));
      const firstChr = charsWithoutNumbers[Math.floor(Math.random() * charsWithoutNumbers.length)];
      return firstChr.concat(random(len - 1, excludes));
    },
  };
})();

/**
 * Convert a camel-cased term to dashed string, e.g. for style rule keys
 * @example
 * toDashedNotation(`marginRight`); //=> `margin-right`
 * toDashedNotation(`borderTopLeftRadius`); //=> `border-top-left-radius`
 * @param str2Convert {string} The (property)string to convert
 * @returns {string}
 */
const toDashedNotation = str2Convert =>
  str2Convert
    .replace(/[A-Z]/g, a => `-${a.toLowerCase()}`)
    .replace(/^-|-$/, ``);

/**
 * iterator used for most extendedNodeListCollectionExtensions.
 * Also exposed as '[ExtCollection].each'
 * @param {ExtendedNodeList} extCollection the collection of the current ExtendedNodeList instance
 * @param {function} callback to use in the loop
 * @returns {ExtendedNodeList} instance, so chainable
 */
const loop = (extCollection, callback) => {
  const cleanCollection = extCollection.collection.filter(el => !isCommentOrTextNode(el))
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i);
  }
  return extCollection;
};

/**
 * Injects the collection to the DOM tree
 * @private
 * @param collection {Array} array of <code>HTMLElement</code>s (in memory),
 * i.e. the collection of the instance to return
 * @param root {HTMLElement} The root element to wich the collection should be injected to
 * @param position {insertPositions} The position to inject the element(s)
 * @returns {Array} an Array of injected <code>HTMLElement</code>s, maybe empty
 */
const inject2DOMTree = (collection = [], root = document.body, position = insertPositions.BeforeEnd) =>
  collection.reduce((acc, elem) => {
    const created = elem && isNode(elem) && element2DOM(elem, root, position);
    return created ? [...acc, created] : acc;
  }, []);

/**
 * Create a handlerId for Element.
 * if it does not already exist
 * @private
 * @param extCollection {ExtendedNodeList} current ExtendedNodeList instance
 * @returns {string} a css selector for the handler id
 */
const addHandlerId = extCollection => {
  const handleId = extCollection.first().dataset.hid || randomString.random(8);
  extCollection.setData({hid: handleId});
  return `[data-hid="${handleId}"]`;
};

/**
 * Determine the current visibility of a HTMLElement.
 * @param {HTMLElement} el some html element or a style property
 * @returns {boolean} true if visible, false if not
 */
const isVisible = function (el) {
  const elStyle = el.style;
  const computedStyle = getComputedStyle(el);
  const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
  const noDisplay = [elStyle.display, computedStyle.display].includes("none");
  const offscreen = el.offsetTop < 0 ||
    (el.offsetLeft + el.offsetWidth) < 0 ||
    el.offsetLeft > document.body.offsetWidth;
  const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
  return !(offscreen || noOpacity || noDisplay || invisible);
};

/**
 * Retrieves key-value pairs from data-attributes
 * if applicable.
 * @param el {HTMLElement} the html element
 * @returns {Object|undefined} key value-pairs
 */
const getAllDataAttributeValues = el => {
  const getKey = attr => attr.nodeName.slice(attr.nodeName.indexOf(`-`) + 1);
  const data = [...el.attributes]
    .filter(da => da.nodeName.startsWith(`data-`))
    .reduce((acc, val) =>
      ({...acc, [getKey(val)]: val.nodeValue}), {});
  return Object.keys(data).length && data || undefined;
};

/**
 * Generic prototype initializer for JQL.
 * @param ctor {ExtendedNodeList} The ExtendedNodeList constructor
 */
const initializePrototype = ctor => {
  // noinspection JSUnresolvedVariable
  const proto = ctor.prototype;
  Object.entries(allLambdas.instanceExtensions)
    .forEach(([key, lambda]) => {
      if (lambda instanceof Function) {
        proto[key] = function (...args) {
          return lambda(this, ...args);
        };
      }
    });
  Object.entries(allLambdas.straigthLoops)
    .forEach(([key, lambda]) => {
      if (lambda instanceof Function) {
        proto[key] = function (...args) {
          return loop(this, el => lambda(el, ...args));
        };
      }
    });
  proto.isJQL = true;
};

/**
 * Trunctate a html string (e.g. from <code>[element]outerHTML</code>)
 * to a single line with a maximum length
 * @param str {string} The html string
 * @param maxLength {Number} The length to truncate to (default: 120)
 * @returns {string}
 */
const truncateHtmlStr = (str, maxLength = 120) => str.trim()
  .substr(0, maxLength)
  .replace(/>\s+</g, `><`)
  .replace(/</g, `&lt;`)
  .replace(/\s{2,}/g, ` `)
  .replace(/\n/g, `\\n`) + (str.length > maxLength ? `&hellip;` : ``).trim();

const truncate2SingleStr = (str, maxLength = 120) =>
  truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`).replace(/&hellip;/g, `...`);

/**
 * Returns the current time, including milliseconds enclosed in square brackets,
 * e.q. <code>[12:32:34.346]</code>.
 * @returns {string}
 */
const time = () => ((d) =>
  `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
    pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());

/**
 * Is [obj] really an object (and not a <code>Date</code> or <code>Array</code>)?
 * @param obj {Object}
 * @returns {boolean|false|number}
 */
const isObjectAndNotArray = obj =>
  (obj.constructor !== Date &&
    !Array.isArray(obj) && JSON.stringify(obj) === "{}") ||
  obj.constructor !== String && Object.keys(obj).length;

//#endregion common helpers */

//#region style color toggling helpers
/**
 * Convert abbreviated hex color to full (eg #0C0 to #00CC00)
 * Uses in hex2RGBA
 * @param hex {string} the hexadecimal color code
 * @returns {string}
 */
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};

/**
 * Convert hex color to rgb(a) (eg #ffc to rgb(255, 255, 204)).
 * @param hex {string} the hexadecimal color code eg #dddd00
 * @param opacity {number} the opacity value (0 - 1, eg 0.5)
 * @returns {string}
 */
const hex2RGBA = function (hex, opacity = 100) {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity / 100}` : ""})`;
};

//#endregion style color toggling helpers

export {
  loop,
  hex2RGBA,
  isObjectAndNotArray,
  initializePrototype,
  isVisible,
  addHandlerId,
  isHtmlString,
  isNode,
  time,
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
};
