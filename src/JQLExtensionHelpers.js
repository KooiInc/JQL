// noinspection JSCheckFunctionSignatures,JSUnresolvedVariable,JSUnusedGlobalSymbols,ES6UnusedImports,JSUnresolvedFunction,JSUnusedLocalSymbols
import {randomStringExtension} from "./Helpers.js";
import extendedNodeListCollectionLamdas from "./JQLCollectionExtensions.js";
import ExtendedNodeListLambdas from "./JQLExtensions.js";
const ExtendedNodeList = {dummy: `JSDoc dummy 'type'`};

//#region common helpers
/**
 * Some helpers for JQL (module, extensions).
 * @module
 */
/**
 * iterator used for most extendedNodeListCollectionExtensions.
 * Also exposed as '[ExtCollection].each'
 * @param {ExtendedNodeList} extCollection the collection of the current ExtendedNodeList instance
 * @param {function} callback to use in the loop
 * @returns {ExtendedNodeList} instance, so chainable
 */
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i], i);
  }
  return extCollection;
};

/**
 * Create a handlerId for Element.
 * if it does not already exist
 * @private
 * @param extCollection {ExtendedNodeList} current ExtendedNodeList instance
 * @returns {string} a css selector for the handler id
 */
const addHandlerId = extCollection => {
  !("getRandom" in String) && randomStringExtension();
  const handleId = extCollection.first().dataset.hid || String.getRandom(8);
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
  Object.entries(ExtendedNodeListLambdas)
    .forEach(([key, lambda]) => {
      if (lambda instanceof Function) {
        ctor.prototype[key] = function (...args) {
          return lambda(this, ...args);
        };
      }
    });
  Object.entries(extendedNodeListCollectionLamdas)
    .forEach(([key, lambda]) => {
      if (lambda instanceof Function) {
        ctor.prototype[key] = function (...args) {
          return loop(this, el => lambda(el, ...args));
        };
      }
    });
  ctor.prototype.isSet = true;
};

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

//#region handling helper

//#endregion handling helper
export {
  loop,
  hex2RGBA,
  initializePrototype,
  isVisible,
  addHandlerId,
};
