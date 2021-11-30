// noinspection JSValidateJSDoc
/**
 * A factory to create, wrap and store event handler lambda's for
 * elements in the enclosing document
 * @module JQL/XHelpers/HandlerFactory
 * @exports handlerFactory
 */

import _$ from "./JQueryLike.js";
let handlers = {};

/**
 * Handler method for an array of handlers per event type.
 * <i>Per event type</i> (e.g. <code>click</code>, <code>change</code> etc.) this is
 * the one and only handler that is added to the document Object
 * So:<ul>
 * <li>All handlers are delegated.</li>
 * <li>For every <code>Event.type</code> there will be exactly one
 * handler, added to the document.</li>
 * <li><code>metaHandler</code> iterates
 * over the (wrapped) handler lambda's created with the
 * <code>createHandlerForHID</code> factory.</li></ul>
 * @param evt {Event} the event sent by the browser
 */
const metaHandler = evt => handlers[evt.type].forEach(handler => handler(evt));

/**
 * Wraps a handler (from $([]).on/ON/delegate) and returns
 * a new function.
 * @param extCollection {ExtendedNodeList} the ExentedNodeList instance
 * @param HID {string} the Handler id: '[data-hid=...]' or some selector like '#something'
 * - this determines execution or not of the callback lambda
 * @param callback {Function} the callback lambda
 * @returns {Function} the wrapped callback lambda
 */
const createHandlerForHID = (extCollection, HID, callback) => {
  return evt => {
    const target = evt.target.closest(HID);

    if (target) {
      return callback(_$.virtual(target), evt);
    }
  };
};

/**
 * add listener for event type if it's not existing in the handlers Object
 * @param type {string} the event type (e.g. <code>click</code>, <code>focusin</code> etc)
 */
const addListenerIfNotExisting = type =>
  !Object.keys(handlers).find(registeredType => registeredType === type) &&
  document.addEventListener(type, metaHandler);

/**
 * The result of <code>HandlerFactory</code> is
 * a method to wrap, store and link event handlers to elements
 * in the document.
 * @todo add possibility to delete handlers
 * <br>See <a href="./JQLExtensions.js.html#line496">ExtendedNodeListExtensions.delegate</a>
 * code for usage.
 */
export default (extCollection, type, HIDselector, callback) => {
  addListenerIfNotExisting(type);
  const fn = createHandlerForHID(extCollection, HIDselector, callback);
  handlers = handlers[type]
    ? {...handlers, [type]: handlers[type].concat(fn)}
    : {...handlers, [type]: [fn]};
};