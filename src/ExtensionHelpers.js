// noinspection JSCheckFunctionSignatures,JSUnresolvedVariable,JSUnusedGlobalSymbols,ES6UnusedImports,JSUnresolvedFunction,JSUnusedLocalSymbols

import {randomStringExtension} from "./Helpers.js";
import extendedNodeListCollectionLamdas from "./ExtendedNodeListCollectionExtensions.js";
import ExtendedNodeListLambdas from "./ExtendedNodeListExtensions.js";
// for jsdoc use (as 'type')

//#region common helpers
/**
 * <b>Module</b> The helpers for the JQL module
 * @namespace ExtensionHelpers
 */
/**
 * iterator used for most extendedNodeListCollectionExtensions.
 * Also exposed as '[ExtCollection].each'
 * @memberof ExtensionHelpers

 * @param {ExtendedNodeList} the collection of the current ExtendedNodeList instance
 * @param {function} lambda to use in the loop
 * @returns {ExtendedNodeList} instance, so chainable
 */
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i], i);
  }
  return extCollection;
};

/**
 * Create a handlerId for Element
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
 * determine visibility of a Html element
 * @memberof ExtensionHelpers
 * @param {HTMLElement} some html element or a style property
 * @returns {boolean} true if visible, false if not
 */
const isVisible = function(el) {
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
 * retrieves key-value pairs from data-attributes
 * if applicable
 * @memberof ExtensionHelpers
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
 * Generic prototype initializer for JQLike
 * @memberof ExtensionHelpers
 * @param ctor {ExtendedNodeList} The ExtendedNodeList constructor
 */
const initializePrototype = ctor => {
  Object.entries(ExtendedNodeListLambdas)
    .forEach( ([key, lambda]) => {
      if (lambda instanceof Function) {
        ctor.prototype[key] = function (...args) {
          return lambda(this, ...args);
        };
      }
    });
  Object.entries(extendedNodeListCollectionLamdas)
    .forEach( ([key, lambda]) => {
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
 * @memberof ExtensionHelpers
 * @param hex {string} the hexadecimal color code
 * @returns {string}
 */
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};

/**
 * convert hex color to rgb(a) (eg #ffc to rgb(255, 255, 204))
 * @memberof ExtensionHelpers
 * @param hex {string} the hexadecimal color code eg #dddd00
 * @param opacity {number} the opacity value (0 - 1, eg 0.5)
 * @returns {string}
 */
const hex2RGBA = function(hex, opacity = 100) {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity / 100}` : ""})`;
};

//#endregion style color toggling helpers

//#region handling helper
  /**
   * Factory for handling events
   * @namespace ExtensionHelpers/HandlerFactory
   */
  const handlerFactory = (() => {
  let handlers = {};

  /**
   * Handler method for an array of handlers per event type.
   * <i>Per event type</i> (e.g. click, change etc.) this is
   * the one and only handler that is added to the document Object
   * So:<ul>
   * <li>All handlers are delegated.</li>
   * <li>For every <code>Event.type</code> there will be exactly one
   * handler, added to the document.</li>
   * <li><code>metaHandler</code> iterates
   * over the (wrapped) handler lambda's created with the
   * <code>createHandlerForHID</code> factory.</li></ul>
   * @memberof ExtensionHelpers/HandlerFactory
   * @param evt {Event} the event sent by the browser
   */
  const metaHandler = evt => handlers[evt.type].forEach(handler => handler(evt));

  /**
   * wraps a handler (from $([]).on/ON/delegate) and returns
   * a new handler function
   * @memberof ExtensionHelpers/HandlerFactory
   * @param extCollection {ExentedNodeList} the ExentedNodeList instance
   * @param HID {string} the Handler id: '[data-hid=...]' or some selector like '#something'
   * - this determines execution or not of the callback lambda
   * @param callback {...function} the callback lambda
   * @returns {function(...[*])}
   */
  const createHandlerForHID = (extCollection, HID, callback) => {
    return evt => {
      const target = evt.target.closest(HID);

      if (target) {
        return callback(new extCollection.constructor(target), evt);
      }
    };
  };

  /**
   * add listener for event type if it's not existing in the handlers Object
   * @memberOf ExtensionHelpers/HandlerFactory
   * @param type {string} the event type (e.g. 'click', 'focusin' etc)
   */
  const addListenerIfNotExisting = type =>
    !Object.keys(handlers).find(registeredType => registeredType === type) &&
     document.addEventListener(type, metaHandler);

  // addHandler lambda, once for each event type
  return (extCollection, type, HIDselector, callback) => {
    addListenerIfNotExisting(type);
    const fn = createHandlerForHID(extCollection, HIDselector, callback);
    handlers = handlers[type]
      ? {...handlers, [type]: handlers[type].concat(fn)}
      : {...handlers, [type]: [fn]};
  };
})();

//#endregion handling helper
export {
  loop,
  handlerFactory,
  hex2RGBA,
  initializePrototype,
  isVisible,
  addHandlerId,
};
