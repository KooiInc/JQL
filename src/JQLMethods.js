// noinspection DuplicatedCode,JSUnresolvedVariable,JSUnusedGlobalSymbols

import _$ from "./JQueryLike.js";
import {randomStringExtension, isObjectAndNotArray,} from "./Helpers.js"
import {setStyle} from "./Styling.js";
import {createElementFromHtmlString} from "./DOM.js";
import {hex2RGBA, loop, addHandlerId, isVisible, isNode} from "./JQLExtensionHelpers.js";
import handlerFactory from "./HandlerFactory.js";

randomStringExtension();

/**
 * All extension methods for <code>ExtendedNodeList</code> where looping may not be
 * an option. The methods end up in the JQL prototype
 * ([See JQLExtensionHelpers]{@link module:JQLExtensionHelpers~initializePrototype})
 * <p><b>Notes</b></p>
 *  <ul><li>Most methods are <i>chainable</i>.
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
 * @module JQLMethods
 */

/* region multiple use */
/**
 * Remove content for each element of the element collection of the ExtendedNodeList.
 * @memberOf module:JQLMethods
 */
const empty = el => el && (el.textContent = "");

/**
 * Set data-attribute for each element of the element collection of the ExtendedNodeList.
 * The attributes must be key-value pairs.
 * @memberOf module:JQLMethods
 * @param keyValuePairs {Object.<string, string>} Object e.g. &#123;isSet: 'true'&#125;
 * <br><b>Note</b> do <i>not</i> use dashed keys but camelcase if you
 * need to split up the dataset. <b>wrong</b>: <code>no-code</code>, <b>right</b>: <code>noCode</code>.
 * The latter will be <i>rendered</i> as <code>`data-no-code`</code> in HTML, but not in js-code.
 */
const setData = (el, keyValuePairs) => {
  el && isObjectAndNotArray(keyValuePairs) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.dataset[key] = value);
};

/**
 * Style each element of the element collection of the ExtendedNodeList
 * instance <i>within a custom style sheet</i>, using an intermediate class
 * or given className
 * <br><b>Note</b>: the intermediate <code>className</code> starts with`jQLCreated_`.
 * There will be one intermediate class name per element. Subsequent .css calls will
 * change the rules for that class name.
 * <br>Preferably use key-value pairs, even when assigning a single property.
 * @example
 * // presume $ is the alias for ExtendedNodeList
 * $(`<p>`).css({marginLeft: `12px`, color: `green`, borderLeft: `2px solid red`})
 * // the document will now contain <p class="JQLCreated_[a random string]]"></p>
 * // use your own class name
 * $(`<p>`).css({className: `leftRedBorder`, marginLeft: `12px`, color: `green`, borderLeft: `2px solid red`});
 * // the document will now contain <p class="leftRedBorder"></p>
 * @memberOf module:JQLMethods
 * @param keyOrKvPairs {Object.<string, string>|string} Object or string e.g. <code>&#123;marginRight: '12px'&#125;</code>
 * or <code>'margin-right'</code>
 * <br>key or string may be: `paddingRight` or `"padding-right"`
 * <br><b>Note</b>: if you want to use your own class name (so not a random name),
 * include a <code>className</code> property in the Object. See example.
 * @param value {string|undefined} if value is not <code>undefined</code>, keyOrKvPairs should be a string too
 * <br>If the value should be empty (reset: e.g. <code>padding: ""</code>), use a dash "-"
 */
const css = (el, keyOrKvPairs, value) => {
  if (value && keyOrKvPairs.constructor === String) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQLCreated`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQLCreated_${String.createRandomHtmlElementId(12)}`;
  setStyle(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
};

/**
 * Set attribute or property values for each element of the element collection of the ExtendedNodeList.
 * of the ExtendedNodeList instance
 * @memberOf module:JQLMethods
 * @param keyValuePairs {Object} Object e.g. &#123;title: 'I am Groot'&#125;
 */
const assignAttrValues = (el, keyValuePairs) => {
  el && Object.entries(keyValuePairs).forEach(([key, value]) => {
    if (key.startsWith(`data`)) {
      setData(el, {[key]: value});
    }

    if (key.toLowerCase() === "class") {
      value.split(/\s+/).forEach(v => el.classList.add(`${v}`))
    }

    if (value.constructor === String) {
      el[key] = value;
    }
  });
};
/* endregion multiple use */

/* region exports */
export default {
  straigthLoops: {
    /**
     * toggle className (on/off) for each element of the element collection of the ExtendedNodeList.
     * @memberOf module:JQLMethods
     * @param className {string} the class name to toggle (eg 'hidden')
     */
    toggleClass: (el, className) => {
      el.classList.toggle(className);
    },

    /**
     * Toggle individual style properties for each element of the element collection of the ExtendedNodeList.
     * Properties must be key-value pairs
     * Note: this may fail, because browsers may reformat style values in their own way.
     * For colors, hex values are converted (see the [color helper]{@link module:JQLExtensionHelpers~hex2RGBA}).
     * @memberOf module:JQLMethods
     * @param keyValuePairs {Object} e.g. &#123;marginRight: '12px'&#125;
     */
    toggleStyleFragments: (el, keyValuePairs) =>
      el && Object.entries(keyValuePairs).forEach(([key, value]) => {
        if (value instanceof Function) {
          value = value(el);
        }

        if (/color/i.test(key)) {
          value = value.startsWith(`#`)
            ? hex2RGBA(value)
            : value.replace(/(,|,\s{2,})(\w)/g, (...args) => `, ${args[2]}`);
        }

        el.style[key] = `${el.style[key]}` === `${value}` ? "" : value;
      }),

    /**
     * Remove some attribute from each element of the element collection of the ExtendedNodeList.
     * @memberOf module:JQLMethods

     * @param name {string} the attribute name
     */
    removeAttr: (el, name) => el && el.removeAttribute(name),

    /**
     * Toggle attribute [name] with [value] for each element of the element collection of the ExtendedNodeList.
     * @memberOf module:JQLMethods

     * @param name {string} attribute name (e.g. 'title')
     * @param value {string} attribute value to set
     */
    toggleAttr: (el, name, value) =>
      el && el.hasAttribute(name)
        ? el.removeAttribute(name)
        : el.setAttribute(name, value),

    empty,

    /**
     * Alias for empty
     * @memberOf module:JQLMethods
     */
    clear: empty,

    /**
     * Swap [classname] with [...nwClassnames] for each element of the element collection of the ExtendedNodeList.
     * Enables replacing a class name with one or more class name(s)
     * @memberOf module:JQLMethods

     * @param className {string} the className to replace
     * @param nwClassNames {...string} the class name(s) to replace [className] with
     */
    replaceClass: (el, className, ...nwClassNames) => {
      el.classList.remove(className);
      nwClassNames.forEach(name => el.classList.add(name))
    },

    /**
     * Remove [classNames] from for each element of the element collection of the ExtendedNodeList.
     * Class names can be one or more strings.
     * @memberOf module:JQLMethods

     * @param classNames {...string} one or more class names
     */
    removeClass: (el, ...classNames) =>
      classNames.forEach(cn => el.classList.remove(cn)),

    /**
     * Add [classNames] to each element of the element collection of the ExtendedNodeList.
     * Class names can be one or more strings
     * @memberOf module:JQLMethods

     * @param classNames {...string} one or more class names
     */
    addClass: (el, ...classNames) =>
      el && classNames.forEach(cn => el.classList.add(cn)),

    /**
     * Show each element of the element collection of the ExtendedNodeList.
     * @memberOf module:JQLMethods

     */
    show: el => el.style.display = ``,

    /**
     * Hide each element of the element collection of the ExtendedNodeList.
     * @memberOf module:JQLMethods

     */
    hide: el => el.style.display = `none`,

    setData,

    assignAttrValues,

    /**
     * Get or set attributes for each element of the element collection of the ExtendedNodeList
     * of the ExtendedNodeList instance
     * attributes must be key-value pairs
     * style and data-attributes must also be key-value pairs
     * @memberOf module:JQLMethods

     * @param keyOrObj {string|Object} Object e.g. &#123;color: '#c0c0c0'&#125;
     * @param value {string} some value
     * @returns {*|string}
     */
    attr(el, keyOrObj, value) {
      if (!el) {
        return true;
      }

      if (value !== undefined) {
        keyOrObj = {[keyOrObj]: value};
      }

      if (!value && keyOrObj.constructor === String) {
        return el.getAttribute(keyOrObj);
      }

      Object.entries(keyOrObj).forEach(([key, value]) => {
        const keyCompare = key.toLowerCase().trim();

        if (keyCompare === `style`) {
          return css(el, value, undefined);
        }

        if (keyCompare === `data`) {
          return setData(el, value);
        }

        if (value instanceof Object) {
          return assignAttrValues(el, value);
        }

        return el.setAttribute(key, value);
      });
    },

    /**
     * Style each element of the element collection of the ExtendedNodeList <i>inline</i>,
     * so <code>&lt;div style="[the style from parameters]"></code>.
     * Preferably use key-value pairs
     * @memberOf module:JQLMethods
     * @param keyOrKvPairs {Object|string} Object e.g. <code>&#123;marginRight: '12px'&#125</code>,
     * or string e.g. <code>"marginRight"</code>
     * <br>key may be: `paddingRight` or `"padding-right"`
     * @param value {string|undefined} if value is not <code>undefined</code>,
     * keyOrKvPairs should be a string too
     * <br>If the value should be empty (reset: e.g. <code>padding: ""</code>), use a dash "-"
     */
    style: (el, keyOrKvPairs, value) => {
      if (value && keyOrKvPairs.constructor === String) {
        keyOrKvPairs = {[keyOrKvPairs]: value || "none"};
      }

      if (!Array.isArray((keyOrKvPairs)) && keyOrKvPairs.constructor === Object) {
        Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
      }
    },

    css,
  },
  instanceExtensions: {
    /**
     * Get textContent of the first element in the
     * the collection of [extCollection] or set the textContent
     * for each element of the collection. .
     * overwrites current textContent of the first element,
     * or appends the text to it.
     * <br><b>Note</b>: uses textContent, so no html here
     * @memberOf module:JQLMethods
     * @param textValue {string|undefined} the text to inject. No value returns the property value.
     * @param append {boolean} appends textValue if true, otherwise destructive
     * @returns {ExtendedNodeList|string} ExtendedNodeList instance
     * or (if <code>textValue</code> is empty) the property value.
     */
    text: (extCollection, textValue, append) => {
      if (extCollection.isEmpty()) {
        return extCollection;
      }

      const cb = el => el.textContent = append ? el.textContent + textValue : textValue;

      if (!textValue) {
        return extCollection.first().textContent;
      }

      return loop(extCollection, cb);
    },
    /**
     * Alias for loop
     * @memberOf module:JQLMethods
     * @example
     * $(`#somediv`).each( (el, i) => ...);
     * // where $ = the alias for the ExtendedNodeList constructor
     * @param cb {function} lambda to execute on each element of the collection
     */
    each: (extCollection, cb) => loop(extCollection, cb),

    /**
     * Remove each collection element from the DOM tree
     * @memberOf module:JQLMethods
     * @param selector {string}
     */
    remove: (extCollection, selector) => {
      const remover = el => el.remove();
      if (selector) {
        const selectedElements = extCollection.find$(selector);
        !selectedElements.isEmpty() && loop(selectedElements, remover);
        return;
      }
      loop(extCollection, remover);
    },

    /**
     * Get computed style for a css property of the first element of the ExtendedNodeList instance
     * @memberOf module:JQLMethods
     * @param property {string} the css property (e.g. <code>left</code> or <code>display</code>)
     * @returns {CSSStyleDeclaration}
     */
    computedStyle: (extCollection, property) => extCollection.first() && getComputedStyle(extCollection.first())[property],

    /**
     * Get the value of a data-attribute for the first element of the ExtendedNodeList instance
     * @memberOf module:JQLMethods
     * @param dataAttribute {string} some attribute, e.q. 'initial'
     * @param valueWhenFalsy {*} value when the attribute does not exist
     * @returns {string|number|undefined}
     */
    getData: (extCollection, dataAttribute, valueWhenFalsy) => extCollection.first() &&
      extCollection.first().dataset && extCollection.first().dataset[dataAttribute] || valueWhenFalsy,

    /**
     * Is the collection of the current (implicit) ExtendedNodeList instance empty?
     * @memberOf module:JQLMethods
     * @returns {boolean}
     */
    isEmpty: extCollection => extCollection.collection.length < 1,

    /**
     * Checks the values of pseudo selectors :hidden, :visible or :disabled
     * <br><b>Todo</b>: really useful?
     * @memberOf module:JQLMethods
     * @param checkValue {string} one of :visibile, :hidden, :disabled
     * @returns {string|boolean}
     */
    is: (extCollection, checkValue) => {
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
    },

    /**
     * Checks if (one of) [classNames] exist in one of the elements of the
     * ExtendedNodeList instance element collection
     * @memberOf module:JQLMethods
     * @param classNames {...string} one or more classNames
     * @returns {boolean} true if one of classNames exists
     */
    hasClass: (extCollection, ...classNames) => {
      return !extCollection.isEmpty() &&
        extCollection.collection?.filter(el =>
          classNames?.find(cn => el.classList.contains(cn))).length > 0;
    },

    /**
     * Replace a child in the collection of an ExtendedNodeList instance
     * with something else
     * @memberOf module:JQLMethods
     * @param oldChild {HTMLElement|string} <code>HTMLElement</code> or selector string
     * @param newChild {HTMLElement} <code>HTMLElement</code> or
     * <code>ExtendedNodeList</code> instance
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    replace: (extCollection, oldChild, newChild) => {
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
    },

    /**
     * Replace the collection of an ExtendedNodeList instance with something else
     * @memberOf module:JQLMethods
     * @param newChild {HTMLElement|ExtendedNodeList} <code>HTMLElement</code> or
     * <code>ExtendedNodeList</code> instance
     * @returns {ExtendedNodeList} <code>ExtendedNodeList</code> instance, so chainable
     * <br><b>Note:</b> the returned <code>ExtendedNodeList</code> instance is the replaced element.
     */
    replaceMe: (extCollection, newChild) => {
      newChild = newChild instanceof HTMLElement ? new extCollection.constructor(newChild) : newChild;
      extCollection.parent().replace(extCollection, newChild)
      return newChild;
    },

    /**
     * Get or set the value of (the first element of)
     * the ExtendedNodeList instance, where the first
     * element is one of input or select HTMLElement
     * @memberOf module:JQLMethods
     * @param value2Set {string|undefined} string or nothing
     * @returns {string|undefined}
     */
    val: (extCollection, value2Set) => {
      const firstElem = extCollection.first();

      if (!firstElem) {
        return;
      }

      if ([HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement].includes(firstElem?.constructor)) {
        if (value2Set || [String, Number].find(v2s => value2Set.constructor === v2s)) {
          firstElem.value = value2Set;
        }

        return firstElem.value;
      }
    },

    /**
     * Get the direct parent node of the first element of the ExtendedNodeList instance
     * @memberOf module:JQLMethods
     * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
     */
    parent: extCollection => !extCollection.isEmpty() && extCollection.first().parentNode &&
      new extCollection.constructor(extCollection.first().parentNode) || extCollection,

    /**
     * Appends one ore more elements to each element of the instance collection (for real, in the DOM tree).
     * <br>If elems2Append consists of html string(s), they should contain <i>valid</i> html
     * (e.g., no flow content in in elements expecting phrasing content, so for example no <code>&lt;h1></code>
     * within <code>&lt;p></code>)
     * @memberOf module:JQLMethods
     * @param elems2Append {...(string|HTMLElement|Text|Comment|ExtendedNodeList)} The element(s) to append.
     * Types may be mixed.
     * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
     */
    append: (extCollection, ...elems2Append) => {
      if (!extCollection.isEmpty() && elems2Append) {

        for (let i = 0; i < elems2Append.length; i += 1) {
          const elem2Append = elems2Append[i];

          if (elem2Append.constructor === String) {
            extCollection.collection.forEach(el => el.appendChild(createElementFromHtmlString(elem2Append)))
            return extCollection;
          }

          if (isNode(elem2Append)) {
            extCollection.collection.forEach(el =>
              el.appendChild(elem2Append instanceof Comment ? elem2Append : elem2Append.cloneNode(true)));
            return extCollection;
          }

          if (elem2Append.isJQL && !elem2Append.isEmpty()) {
            const elems = elem2Append.collection.slice();
            elem2Append.remove();
            elems.forEach(e2a =>
              extCollection.collection.forEach(el =>
                el.appendChild(e2a instanceof Comment ? e2a : e2a.cloneNode(true))));
          }
        }
      }

      return extCollection;
    },

    /**
     * Injects an element at the start of each element of the collection of an instance of ExtendedNodeList.
     * <br>When [elem] is a html string, it should be valid html, otherwise nothing is prepended obviously
     * (e.g., no flow content in in elements expecting phrasing content, so for example no <code>&lt;h1></code>
     * within <code>&lt;p></code>)
     * @memberOf module:JQLMethods
     * @param elems2Prepend {...(string|HTMLElement|Text|Comment|ExtendedNodeList)} the element(s) to append.
     * The types may be mixed.
     * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
     */
    prepend: (extCollection, ...elems2Prepend) => {
      if (!extCollection.isEmpty() && elems2Prepend) {

        for (let i = 0; i < elems2Prepend.length; i += 1) {
          const elem2Prepend = elems2Prepend[i];

          if (elem2Prepend.constructor === String) {
            extCollection.collection.forEach(el =>
              el.insertBefore(createElementFromHtmlString(elem2Prepend), el.firstChild))
            return extCollection;
          }

          if (isNode(elem2Prepend)) {
            extCollection.collection.forEach(el =>
              el.insertBefore(
                elem2Prepend instanceof Comment ? elem2Prepend : elem2Prepend.cloneNode(true), el.firstChild));
            return extCollection;
          }

          if (elem2Prepend.isJQL && !elem2Prepend.isEmpty()) {
            const elems = elem2Prepend.collection.slice();
            elem2Prepend.remove();
            elems.forEach(e2a =>
              extCollection.collection.forEach(el =>
                el && el.insertBefore(e2a instanceof Comment ? e2a : e2a.cloneNode(true), el.firstChild)));
          }
        }
      }

      return extCollection;
    },

    /**
     * Appends the collection of one ExtendedNodeList instance to another instance,
     * so injects the element(s) of [extCollection] to each element of [extCollection2AppendTo]
     * (for real, injected and visible in the DOM tree).
     * <br><b>Note</b>: this returns the extCollection2AppendTo (so, the parent JQL instance).
     * @memberOf module:JQLMethods
     * @param extCollection2AppendTo {ExtendedNodeList} the instance to append to
     * @returns {ExtendedNodeList} i.c. extCollection2AppendTo
     */
    appendTo: (extCollection, extCollection2AppendTo) => {
      if (!extCollection2AppendTo.isJQL) {
        extCollection2AppendTo = _$.virtual(extCollection2AppendTo);
      }
      return extCollection2AppendTo.append(extCollection);
    },

    /**
     * Prepends the collection of one ExtendedNodeList instance to each element of another instance,
     * so injects the element(s) of [extCollection] to each element of [extCollection2AppendTo]
     * (for real, injected and visible in the DOM tree).
     * <br><b>Note</b>: this returns the extCollection2AppendTo (so, the parent JQL instance).
     * @memberOf module:JQLMethods
     * @param extCollection2PrependTo {ExtendedNodeList} the instance to append to
     * @returns {ExtendedNodeList} i.c. extCollection2PrependTo
     */
    prependTo: (extCollection, extCollection2PrependTo) => {
      if (!extCollection2PrependTo.isJQL) {
        extCollection2PrependTo = _$.virtual(extCollection2PrependTo);
      }

      return extCollection2PrependTo.prepend(extCollection);
    },

    /**
     * Retrieves a single element from an instance of ExtendedNodeList
     * and returns a new ExtendedNodeList instance from that element
     * @memberOf module:JQLMethods
     * @param indexOrSelector {number|string}the index of the instance collection
     * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
     */
    single: (extCollection, indexOrSelector = "0") => {
      if (extCollection.collection.length > 0) {
        if (isNaN(+indexOrSelector) && extCollection.find(indexOrSelector)) {
          return extCollection.find$(indexOrSelector);
        }
        const index = +indexOrSelector;
        return index < extCollection.collection.length
          ? _$(extCollection.collection[indexOrSelector])
          : _$(extCollection.collection.slice(-1));
      } else {
        return extCollection;
      }
    },

    /**
     * Retrieve the extCollection instance collection as a Nodelist. It may
     * be a way to duplicate a collection of nodes (see example).
     * <br><b>Note</b> the list is <b><i>not</b></i> a live Node list.
     * In other words: the nodes are copies of the original (and do not
     * exist in the DOM tree).
     * <br><b>Note</b> if the nodes contain an id, it is removed (element id's
     * must be unique).
     * <br>[See also (ExtendedNodeList instance).duplicate]{@link module:JQLMethods~duplicate}
     * @memberOf module:JQLMethods
     * @example
     * import $ from "JQueryLike.js";
     * // create 2 nodes in the DOM tree and retrieve the collection as NodeList
     * const nodes = $([`<div id="some">Hello</div>`, `<div id="thing">World</div>`]).toNodeList();
     * // change the text of the nodes in the list
     * for (let node of nodes) {
     *   node.textContent += `!`;
     * }
     * // append the nodes (and colorize)
     * $(nodes).style({color: `red`});
     * // result in DOM (classNames are random)
     * <div id="some">Hello</div>
     * <div id="thing">World</div>
     * <div style="color: red;">Hello!</div>
     * <div style="color: red;">World!</div>
     * @returns {NodeList}
     */
    toNodeList: extCollection => {
      const virtual = document.createElement(`div`);

      for (let elem of extCollection.collection) {
        const nodeClone = document.importNode(elem, true);
        nodeClone.removeAttribute(`id`);
        virtual.append(nodeClone);
      }

      return virtual.childNodes;
    },

    /**
     * Duplicate an ExtendedNodeList instance (to memory (default) or
     * to DOM. The elements within the instance are cloned (and their id's removed)
     * and the resulting <code>NodeList</code> is converted to a new instance.
     * <br><b>Note</b> check the cloned nodes classList/properties/attributes: you may want
     * to change them before injecting to DOM.
     * @memberOf module:JQLMethods
     * @example
     * import $ from "JQueryLike.js";
     * const someElem = Object.assign(
     *    document.createElement(`div`),
     *    {innerHTML: `hello`, className: `someClass` });
     * $.setStyle(`.someClass`, {color: `brown`});
     * $( [...Array(2)].map(_ => someElem.cloneNode(true) ) )
     *  .append(document.createTextNode(` world!`))
     *  .prepend(document.createTextNode(`We say: `))
     *  .each(el =>
     *    el.setAttribute(`id`, `_${ Math.floor(10000 + Math.random() * 10000).toString(16)}` ))
     *  // elements are injected to DOM. Now continue with a duplicate
     *  .duplicate(true)
     *  .removeClass(`someClass`)
     *  .text(` That's right folks. Bye!`, true);
     *  // output
     *  <div class="someClass" id="_2f03">We say: hello world!</div>
     *  <div class="someClass" id="_413b">We say: hello world!</div>
     *  <div class>We say: hello world! That's right folks. Bye!</div>
     *  <div class>We say: hello world! That's right folks. Bye!</div>
     * @param toDOM {boolean} true: inject the duplicate to DOM, false (default) to memory
     * @returns {ExtendedNodeList} instance of ExtendedNodeList, so chainable
     */
    duplicate: (extCollection, toDOM = false) => {
      const clonedCollection = extCollection.toNodeList();
      return toDOM ? _$(clonedCollection) : _$.virtual(clonedCollection);
    },

    /**
     * Write an instance of ExtendedNodeList to the DOM ([root] or document.body).
     * <br><b>Note</b>: this works only for virtual instances (so, existing in memory) and
     * can be done once for such an instance.
     * @memberOf module:JQLMethods
     * @param root {HTMLElement} the root to which the instance should be appended
     * @returns {ExtendedNodeList}
     */
    toDOM: (extCollection, root = document.body) => {
      if (extCollection.isVirtual) {
        extCollection.isVirtual = false;
        return _$(extCollection.collection, root);
      }
      return extCollection;
    },

    /**
     * Retrieve the first element of the ExtendedNodeList instance collection
     * @memberOf module:JQLMethods
     * @param asExtCollection {boolean} if true, return new ExtendedNodeList instance, else HTMLElement
     * true => return as new ExtendedNodeList instance, false: as raw HTMLElement
     * @returns {ExtendedNodeList|HTMLElement|undefined} ExtendedNodeList instance, HTMLElement or nothing
     */
    first: (extCollection, asExtCollection = false) => {
      if (extCollection.collection.length > 0) {
        return asExtCollection
          ? extCollection.single()
          : extCollection.collection[0];
      }
      return undefined;
    },

    /**
     * Retrieve first [el] from the collection of the ExtendedNodeList instance
     * and return it as a new ExtendedNodeList instance
     * (if it exists, otherwise undefined)
     * @memberOf module:JQLMethods
     * @param indexOrSelector {number} the collection index
     * @returns {ExtendedNodeList|undefined} ExtendedNodeList instance or nothing
     */
    first$: (extCollection, indexOrSelector) => extCollection.single(indexOrSelector),

    /**
     * Find one or more elements within the ExtendedNodeList instance collection
     * using a css query (e.g. '.someClass')
     * @memberOf module:JQLMethods
     * @param selector {string} css selector
     * @returns {Array|NodeListOf}
     */
    find: (extCollection, selector) =>
      extCollection.first()?.querySelectorAll(selector) || [],

    // 
    /**
     * Find one or more elements within the ExtendedNodeList instance collection
     * using a css query (e.g. '.someClass') and return a new ExtendedNodeList instance
     * from it's result
     * @memberOf module:JQLMethods
     * @param selector {string} css selector
     * @returns {ExtendedNodeList|undefined} a new ExtendedNodeList instance or nothing
     */
    find$: (extCollection, selector) => {
      const found = extCollection.collection.reduce((acc, el) =>
        [...acc, [...el.querySelectorAll(selector)]], [])
        .flat()
        .filter(el => el && el instanceof HTMLElement);
      return found.length && _$.virtual(found);
    },

    /**
     * Get a property/attribute value of first element from
     * the ExtendedNodeList instance collection or set it for each element of
     * the collection
     * TODO: only existing properties, which is quite secure, but may be annonying
     * <br>maybe this should be done via DOMCleanup (weed out forbidden properties)
     * @memberOf module:JQLMethods
     * @param property {string} (e.g. 'title')
     * @param value {string|undefined} If it has a value, then set the property value
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    prop: (extCollection, property, value) => {
      if (value === undefined) {
        return !extCollection.isEmpty ? extCollection.first()[property] : undefined;
      }

      if (!extCollection.isEmpty) {
        loop(extCollection, el => el[property] = value);
      }

      return extCollection;
    },

    /**
     * Add handler lambda for an ExtendedNodeList instance.
     * <br>A handler id is created if applicable (addHandlerId)
     * @memberOf module:JQLMethods
     * @param type {string} event type (e.g. 'click')
     * @param callback {function} handler lambda
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    on: (extCollection, type, callback) => {
      if (extCollection.collection.length) {
        const cssSelector = addHandlerId(extCollection);
        handlerFactory(extCollection, type, cssSelector, callback);
      }

      return extCollection;
    },

    /**
     * Get (inner-) html of the first element in the
     * collection of [extCollection] or set html for each
     * element of the collection.
     * Overwrites current html of the elements, or appends the value to it.
     * Note: the html is always sanitized (see [module HtmlCleanup]{@link: module:HtmlCleanup})
     * @memberOf module:JQLMethods
     * @param htmlValue {ExtendedNodeList|string|undefined} JQL instance, html string or nothing
     * @param append {boolean} appends the html if true, otherwise destructive
     * @returns {string|ExtendedNodeList} current ExtendedNodeList instance or
     * (if <code>htmlValue</code> is empty) the current (inner)html of the first
     * element.
     */
    html: (extCollection, htmlValue, append) => {
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
    },

    /**
     * Retrieves outer html for the first element of the ExtendedNodeList instance
     * @memberOf module:JQLMethods
     * @returns {string|undefined}
     */
    outerHtml: extCollection => (extCollection.first() || {outerHTML: undefined}).outerHTML,

    /**
     * Sets/adds/removes html for an element within the collection
     * of the ExtendedNodeList instance (identified with a css query).
     * @memberOf module:JQLMethods
     * @param forQuery {string} a css query (e.g. `#someId`)
     * @param htmlString {string} the html string to replace or append to exististing.
     * <br><b>Note</b>: if the string is empty, the html is removed
     * <br><b>Note</b>: the html is always sanitized (see DOMCleanup)
     * @param append {boolean} if true html will be appended, otherwise destructive
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    htmlFor: (extCollection, forQuery, htmlString = "", append = false) => {
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
    },

    /**
     * retrieve the current dimensions of the first element in the collection
     * @memberOf module:JQLMethods
     * @returns {DOMRect | undefined}
     */
    dimensions: extCollection => extCollection.first()?.getBoundingClientRect(),

    /**
     * Create event handler lambda(s)
     * @memberOf module:JQLMethods
     * <br><b>Note</b>: may be empty
     * @param type {string} event type (e.g. 'click')
     * @param cssSelector {string} e.g. '#someId'
     * @param callbacks {...function} one or more lambda functions
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    delegate: (extCollection, type, cssSelector, ...callbacks) => {
      callbacks.forEach(callback =>
        handlerFactory(extCollection, type, cssSelector, callback));

      return extCollection;
    },

    /**
     * Add one or multiple handler lambda(s) for event [type] and
     * the ExtendedNodeList instance
     * @memberOf module:JQLMethods
     * @param type {string} event type (e.g. 'click')
     * @param callbacks {...functions} one or more lambda functions
     * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
     */
    ON: (extCollection, type, ...callbacks) => {
      if (extCollection.collection.length) {
        callbacks.forEach(cb => extCollection.on(type, cb));
      }

      return extCollection;
    },
  },
};
/* endregion exports */