//noinspection JSUnresolvedFunction,JSUnresolvedVariable,DuplicatedCode,JSValidateJSDoc,JSClosureCompilerSyntax

//#region ExtendedNodeList lambda's
import {createElementFromHtmlString, insertPositions} from "./DOM.js";
import {loop, addHandlerId, isVisible} from "./JQLExtensionHelpers.js";
import handlerFactory from "./HandlerFactory.js";
import {randomStringExtension} from "./Helpers.js";
randomStringExtension();

/**
 * All extension methods for <code>ExtendedNodeList</code> where looping may not be
 * an option. The methods end up in the JQL prototype
 * [See JQLExtensionHelpers]{@link module:JQLExtensionHelpers~initializePrototype}
 * <p><b>Notes</b></p>
 *  <ul><li>Most methods are <i>chainable</i>.
 *  <li><code>[...].css</code></a> is a collection method, not in this file but also chainable, see
 *  [the documentation there]{@link module:JQLCollectionExtensions}</a>.
 *  <li><code>(implicit)</code> means the parameter should not be provided in the caller</ul>
 * @module
 * @example
 * import $ from "JQueryLike.js";
 * // chainability means:
 * $(`<div id="helloworld">`)
 *  .text(`Example: hello ... world`)
 *  .append($(`<span> OK</span>`))
 *  .css({
 *    marginTop: `0.5rem`,
 *    border: `3px solid green`,
 *    padding: `5px`,
 *    fontSize: `1.2em`,
 *    display: `inline-block`, })
 *  .find$(`span`)
 *  .css({className: `okRed`, color: `red`});
 *  // result (class names are partly random):
 *  // <div id="helloworld" class="JQLCreated_YZ5XnwbCEGxH">Example: hello ... world<span class="okRed"> OK</span></div>
 */

/**
 * The JQLLike library.<br>
 * See [module JQL]{@link module:JQL~ExtendedNodeList}
 * @private
 * @typedef {function(...[*]): ExtendedNodeList} ExtendedNodeList
 */

/**
 * Get textContent of the first element in the
 * the collection of [extCollection] or set the textContent
 * for each element of the collection. .
 * overwrites current textContent of the first element,
 * or appends the text to it.
 * <br><b>Note</b>: uses textContent, so no html here
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param textValue {string|undefined} the text to inject. No value returns the property value.
 * @param append {boolean} appends textValue if true, otherwise destructive
 * @returns {ExtendedNodeList|string} ExtendedNodeList instance
 * or (if <code>textValue</code> is empty) the property value.
 */
const text = (extCollection, textValue, append) => {
  if (extCollection.isEmpty()) {
    return extCollection;
  }

  const cb = el => el.textContent = append ? el.textContent + textValue : textValue;

  if (!textValue) {
    return extCollection.first().textContent;
  }

  return loop(extCollection, cb);
};

/**
 * Alias for loop
 * @example
 * $(`#somediv`).each( (el, i) => ...);
 * // where $ = the alias for the ExtendedNodeList constructor
 */
const each = (extCollection, lambda) => loop(extCollection, lambda);

/**
 * Remove each collection element from the DOM tree
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 */
const remove = extCollection => loop(extCollection, el => el.remove());

/**
 * Get computed style for a css property of the first element of the ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param property the css property (e.g. <code>left</code> or <code>display</code>)
 * @returns {string | undefined}
 */
const computedStyle = (extCollection, property) => {
  if (extCollection.first()) {
    return getComputedStyle(extCollection.first())[property];
  }
}


/**
 * Get the value of a data-attribute for the first element of the ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param dataAttribute {string} some attribute, e.q. 'initial'
 * @param valueWhenFalsy {string|number|undefined} value when the attribute does not exist
 * @returns {string|number|undefined}
 */
const getData = (extCollection, dataAttribute, valueWhenFalsy) => {
  return extCollection.first()?.dataset[dataAttribute] || valueWhenFalsy;
};

/**
 * Is the collection of the current (implicit) ExtendedNodeList instance empty?
 * @param extCollection {ExtendedNodeList} current ExtendedNodeList
 * @returns {boolean}
 */
const isEmpty = extCollection => extCollection.collection.length < 1;

/**
 * Checks the values of pseudo selectors :hidden, :visible or :disabled
 * <br><b>Todo</b>: really useful?
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param checkValue {string} one of :visibile, :hidden, :disabled
 * @returns {string|boolean}
 */
const is = (extCollection, checkValue) => {
  const firstElem = extCollection.first();

  if (!firstElem) {
    return true;
  }

  switch (checkValue) {
    case ":visible": {
      return isVisible(firstElem); // TODO
    }
    case ":hidden":
      return !isVisible(firstElem);
    case ":disabled":
      return firstElem.getAttribute("readonly") || firstElem.getAttribute("disabled");
    default:
      return true;
  }
};

/**
 * Checks if (one of) [classNames] exist in the first element of the
 * ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExentedNodeList instance
 * @param classNames {...string}
 * @returns {boolean} true if one of classNames exists in the elements' classList
 */
const hasClass = (extCollection, ...classNames) => {
  const firstElem = extCollection.first();
  return classNames?.find(name => firstElem.classList.contains(name)) || false;
};

/**
 * Replace a child in the collection of an ExtendedNodeList instance
 * with something else
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param oldChild {HTMLElement|string} <code>HTMLElement</code> or selector string
 * @param newChild {HTMLElement} <code>HTMLElement</code> or
 * <code>ExtendedNodeList</code> instance
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const replace = (extCollection, oldChild, newChild) => {
  const firstElem = extCollection.first();

  if (newChild.isJQL) {
    newChild = newChild.first();
  }

  if (firstElem && oldChild) {
    oldChild = oldChild.constructor === String
      ? firstElem.querySelector(oldChild)
      : oldChild.isJQL
        ? oldChild.first()
        : oldChild;

    if (oldChild && newChild) {
      oldChild.replaceWith(newChild);
    }
  }

  return extCollection;
};

/**
 * Replace the collection of an ExtendedNodeList instance with something else
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param newChild {HTMLElement|ExtendedNodeList} <code>HTMLElement</code> or
 * <code>ExtendedNodeList</code> instance
 * @returns {ExtendedNodeList} <code>ExtendedNodeList</code> instance, so chainable
 * <br><b>Note:</b> the returned <code>ExtendedNodeList</code> instance is the replaced element.
 */
const replaceMe = (extCollection, newChild) => {
  newChild = newChild instanceof HTMLElement ? new extCollection.constructor(newChild) : newChild;
  extCollection.parent().replace(extCollection, newChild)
  return newChild;
};

/**
 * Get or set the value of (the first element of)
 * the ExtendedNodeList instance, where the first
 * element is one of input or select HTMLElement
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param value2Set {string|undefined} string or nothing
 * @returns {string|undefined}
 */
const val = (extCollection, value2Set) => {
  const firstElem = extCollection.first();

  if (!firstElem) { return; }

  if ([HTMLInputElement, HTMLSelectElement].includes(firstElem?.constructor)) {
    if (value2Set || [String, Number].find(v2s => value2Set.constructor === v2s)) {
      firstElem.value = value2Set;
    }

    return firstElem.value;
  }
};

/**
 * Get the direct parent node of the first element of
 * the ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
 */
const parent = extCollection => extCollection.first() &&
  new extCollection.constructor(extCollection.first().parentNode) ||
  extCollection;

/**
 * Appends one ore more elements to each element of the instance collection (for real, in the DOM tree).
 * <br>If elems2Append consists of html string(s), they should contain <i>valid</i> html
 * (e.g., no flow content in in elements expecting phrasing content, so for example no <code>&lt;h1></code>
 * within <code>&lt;p></code>)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param elems2Append {...(string|HTMLElement|Comment|ExtendedNodelist)} The element(s) to append.
 * Types may be mixed.
 * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
 */
const append = (extCollection, ...elems2Append) => {
  const JQL = extCollection.constructor;
  if (!extCollection.isEmpty() && elems2Append) {

    for (let elem2Append of elems2Append) {

      if (elem2Append.constructor === String) {
        const nwElem = new JQL(elem2Append);
        loop(extCollection, el => el.insertAdjacentHTML(`beforeend`, nwElem.outerHtml()));
      }

      if (elem2Append.isJQL && !elem2Append.isEmpty()) {
        loop( elem2Append, appendEl =>
          loop(extCollection, el => el.insertAdjacentElement(insertPositions.BeforeEnd, appendEl))
        )
      }

      if (elem2Append instanceof HTMLElement || elem2Append instanceof Comment) {
        loop (extCollection, el => el.appendChild(elem2Append));
      }
    }

  }

  return extCollection;
};

/**
 * Appends the collection of one ExtendedNodeList instance to another instance,
 * so injects the element(s) of [extCollection] to each element of [extCollection2AppendTo]
 * (for real, injected and visible in the DOM tree).
 * <br><b>Note</b>: this returns the extCollection2AppendTo (so, the parent JQL instance).
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param extCollection2AppendTo {ExtendedNodeList} the instance to append to
 * @returns {ExtendedNodeList} initial instance of ExtendedNodeList, so chainable
 */
const appendTo = (extCollection, extCollection2AppendTo) => {
  if (!extCollection2AppendTo.isJQL) {
    extCollection2AppendTo = new extCollection.constructor(extCollection2AppendTo);
  }

  extCollection2AppendTo.append(extCollection);

  return extCollection2AppendTo;
};

/**
 * Injects an element at the start of each element of the collection of an instance of ExtendedNodeList.
 * <br>When [elem] is a html string, it should be valid html, otherwise nothing is prepended obviously
 * (e.g., no flow content in in elements expecting phrasing content, so for example no <code>&lt;h1></code>
 * within <code>&lt;p></code>)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param content {...(string|HTMLElement|ExtendedNodeList|Comment)} the element(s) to append.
 * The types may be mixed.
 * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
 */
const prepend = (extCollection, ...content) => {
  if (content && !extCollection.isEmpty()) {
    const prependElem = (el, elem2Prepend) => el.insertAdjacentElement(insertPositions.AfterBegin, elem2Prepend)

    for (let elem of content) {
      if (elem.constructor === String) {
        elem = new extCollection.constructor(ele);
      }

      if (elem.isJQL) {
        loop(elem, elem2Prepend =>
          loop(extCollection, el => prependElem(el, elem2Prepend))
        );
      }

      if (elem instanceof HTMLElement || elem instanceof Comment) {
        loop(extCollection, el => prependElem(el, elem));
      }
    }
  }

  return extCollection;
};

/**
 * Retrieves a single element from an instance of ExtendedNodeList
 * and returns a new ExtendedNodeList instance from that element
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param indexOrSelector {number|string}the index of the instance collection
 * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
 */
const single = (extCollection, indexOrSelector = "0") => {
  if (extCollection.collection.length > 0) {
    if (isNaN(+indexOrSelector) && extCollection.find(indexOrSelector)) {
      return extCollection.find$(indexOrSelector);
    }
    const index = +indexOrSelector;
    return index < extCollection.collection.length
      ? new extCollection.constructor(extCollection.collection[indexOrSelector])
      : extCollection;
  } else {
    return extCollection;
  }
};

/**
 * Retrieve the first element of the ExtendedNodeList instance collection
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param asExtCollection {boolean} if true, return new ExtendedNodeList instance, else HTMLElement
 * true => return as new ExtendedNodeList instance, false: as raw HTMLElement
 * @returns {ExtendedNodeList|HTMLElement|undefined} ExtendedNodeList instance, HTMLElement or nothing
 */
const first = (extCollection, asExtCollection = false) => {
  if (extCollection.collection.length > 0) {
    return asExtCollection
      ? extCollection.single()
      : extCollection.collection[0];
  }
  return undefined;
};

/**
 * Retrieve first [el] from the collection of the ExtendedNodeList instance
 * and return it as a new ExtendedNodeList instance
 * (if it exists, otherwise undefined)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param indexOrSelector {number} the collection index
 * @returns {ExtendedNodeList|undefined} ExtendedNodeList instance or nothing
 */
const first$ = (extCollection, indexOrSelector) => extCollection.single(indexOrSelector);

/**
 * Find one or more elements within the ExtendedNodeList instance collection
 * using a css query (e.g. '.someClass')
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param selector {string} css selector
 * @returns {Array|NodeListOf}
 */
const find = (extCollection, selector) =>
  extCollection.first()?.querySelectorAll(selector) || [];

/**
 * Find one or more elements within the ExtendedNodeList instance collection
 * using a css query (e.g. '.someClass') and return a new ExtendedNodeList instance
 * from it's result
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param selector {string} css selector
 * @returns {ExtendedNodeList|undefined} a new ExtendedNodeList instance or nothing
 */
const find$ = (extCollection, selector) => {
  const firstElem = extCollection.first();
  return firstElem && selector && new extCollection.constructor(firstElem.querySelector(selector));
};

/**
 * Get a property/attribute value of first element from
 * the ExtendedNodeList instance collection or set it for each element of
 * the collection
 * TODO: only existing properties, which is quite secure, but may be annonying
 * <br>maybe this should be done via DOMCleanup (weed out forbidden properties)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param property {string} (e.g. 'title')
 * @param value {string|undefined} If it has a value, then set the property value
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const prop = (extCollection, property, value) => {
  if (value === undefined) {
    return !extCollection.isEmpty ? extCollection.first()[property] : undefined;
  }

  if (!extCollection.isEmpty) {
    loop(extCollection, el => el[property] = value);
  }

  return extCollection;
};

/**
 * Add handler lambda for an ExtendedNodeList instance.
 * <br>A handler id is created if applicable (addHandlerId)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param type {string} event type (e.g. 'click')
 * @param callback {function} handler lambda
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const on = (extCollection, type, callback) => {
  if (extCollection.collection.length) {
    const cssSelector = addHandlerId(extCollection);
    handlerFactory(extCollection, type, cssSelector, callback);
  }

  return extCollection;
};

/**
 * Get (inner-) html of the first element in the
 * collection of [extCollection] or set html for each
 * element of the collection.
 * Overwrites current html of the elements, or appends the value to it.
 * Note: the html is always sanitized (see [module HtmlCleanup]{@link: module:HtmlCleanup})
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param htmlValue {ExtendedNodeList|string|undefined} JQL instance, html string or nothing
 * @param append {boolean} appends the html if true, otherwise destructive
 * @returns {string|ExtendedNodeList} current ExtendedNodeList instance or
 * (if <code>htmlValue</code> is empty) the current (inner)html of the first
 * element.
 */
const html = (extCollection, htmlValue, append) => {
  if (htmlValue === undefined) {
    return extCollection.first()?.innerHTML;
  }

  if (!extCollection.isEmpty()) {
    const nwElement = htmlValue.isJQL
      ? htmlValue.first() : createElementFromHtmlString(`<div>${htmlValue}</div>`);

    if (!(nwElement instanceof Comment)) {
      const cb = el => el.innerHTML = append ? el.innerHTML + nwElement.innerHTML : nwElement.innerHTML;
      return loop(extCollection, cb);
    }
  }

  return extCollection;
};

/**
 * Retrieves outer html for the first element of the ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @returns {string|undefined}
 */
const outerHtml = extCollection => (extCollection.first() || {outerHTML: undefined}).outerHTML;

/**
 * Sets/adds/removes html for an element within the collection
 * of the ExtendedNodeList instance (identified with a css query).
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param forQuery {string} a css query (e.g. `#someId`)
 * @param htmlString {string} the html string to replace or append to exististing.
 * <br><b>Note</b>: if the string is empty, the html is removed
 * <br><b>Note</b>: the html is always sanitized (see DOMCleanup)
 * @param append {boolean} if true html will be appended, otherwise destructive
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const htmlFor = (extCollection, forQuery, htmlString = "", append = false) => {
  if (forQuery && extCollection.collection.length) {
    const el2Change = extCollection.find$(forQuery);
    if (!el2Change) {
      return extCollection;
    }

    if (`{htmlValue}`.trim().length < 1) {
      el2Change.textContent = "";
      return extCollection;
    }

    const nwElement = createElementFromHtmlString(`<div>${htmlString}</div>`);
    nwElement && el2Change.html(nwElement.innerHTML, append);
  }
  return extCollection;
};

/**
 * retrieve the current dimensions of the first element in the collection
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @returns {DOMRect | undefined}
 */
const dimensions = extCollection => extCollection.first()?.getBoundingClientRect();

/**
 * Create event handler lambda(s)
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * <br><b>Note</b>: may be empty
 * @param type {string} event type (e.g. 'click')
 * @param cssSelector {string} e.g. '#someId'
 * @param callbacks {...function} one or more lambda functions
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const delegate = (extCollection, type, cssSelector, ...callbacks) => {
  callbacks.forEach(callback =>
    handlerFactory(extCollection, type, cssSelector, callback));

  return extCollection;
};

/**
 * Add one or multiple handler lambda(s) for event [type] and
 * the ExtendedNodeList instance
 * @param extCollection {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param type {string} event type (e.g. 'click')
 * @param callbacks {...functions} one or more lambda functions
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const ON = (extCollection, type, ...callbacks) => {
  if (extCollection.collection.length) {
    callbacks.forEach(cb => extCollection.on(type, cb));
  }

  return extCollection;
};

export default {
    text, remove, each, getData, isEmpty, is, hasClass, replace, replaceMe, val,
    parent, append, appendTo, prepend, single, first, first$, find, find$,
    computedStyle, dimensions, prop, on, html, outerHtml, htmlFor,
    delegate, ON,
};

//#endregion ExtendedNodeList lambda's