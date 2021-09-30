// noinspection JSUnusedLocalSymbols,JSCheckFunctionSignatures,JSValidateJSDoc,JSUnresolvedVariable
// noinspection JSUnresolvedVariable

import {hex2RGBA} from "./ExtensionHelpers.js";
import {isObjectAndNotArray, } from "./Helpers.js"
import setStyle from "./Styling.js";

//#region collection lambda'style
/**
 * @namespace CollectionLambdas
 * @description These lambda functions will be used to loop through every element
 * of an ExendedNodelist instance. The loop always returns the instance, so
 * every instance method is chainable.
 * <p><b>Notes</b></p><ul>
 *  <li>All methods are <i>chainable</i>.
 *  <li><code>(implicit)</code> means the parameter should not be provided in the caller
 *  <br>so: <code>[instance].toggleClass(<s>someHTMLElement,</s> `someClass`)</code>
 *  </ul>
 * @example
 * // presume $ is the alias for ExtendedNodeList
 * $(`.shouldBeRed`)
 *   .css({color: red})
 *   .setData({isRed: `yes`});
 * // so, every element with className `shouldBeRed` within
 * // the instance collection will be styled inline (with red color)
 * // and it will contain a data-attribute [data-is-red="yes"]
 */

/**
 * toggle className (on/off) of all elements of the collection
 * of the ExtendedNodeList instance
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param className {string} the class name to toggle (eg 'hidden')
 */
const toggleClass= (el, className) => {
  el.classList.toggle(className);
};

/**
 * toggle individual style properties for all elements of the collection
 * of the ExtendedNodeList instance
 * properties must be key-value pairs
 * Note: this may fail, because browsers may reformat
 * style values in their own way. See the color stuff
 * for example. Use rgba if you want to toggle opacity
 * for a color too
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} e.g. &#123;marginRight: '12px'&#125;
 */
const toggleStyleFragments = (el, keyValuePairs) =>
  el && Object.entries(keyValuePairs).forEach( ([key, value]) => {
    if (value instanceof Function) {
      value = value(el);
    }

    if (/color/i.test(key)) {
      value = value.startsWith(`#`)
        ? hex2RGBA(value)
        : value.replace(/(,|,\s{2,})(\w)/g, (...args) => `, ${args[2]}`);
    }

    el.style[key] = `${el.style[key]}` === `${value}` ? "" : value;
  });

/**
 * Remove some attribute from all elements of the collection
 * of the ExtendedNodeList instance
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param name {string} the attribute name
 */
const removeAttr = (el, name) => el && el.removeAttribute(name);

/**
 * Toggle attribute [name] with [value] for all elements of the collection
 * of the ExtendedNodeList instance
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param name {string} attribute name (e.g. 'title')
 * @param value {string} attribute value to set
 */
const toggleAttr = (el, name, value) =>
  el && el.hasAttribute(name)
    ? el.removeAttribute(name)
    : el.setAttribute(name, value);

/**
 * remove content for all elements of the collection
 * of the ExtendedNodeList instance
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const empty = el => el && (el.textContent = "");

/**
 * alias for empty
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const clear = el => empty(el);

/**
 * swap [classname] with [...nwClassnames] of all elements of the collection
 * of the ExtendedNodeList instance
 * enables replacing a class name with one or more class name(s)
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param className {string} the className to replace
 * @param nwClassNames {...string} the class name(s) to replace [className] with
 */
const replaceClass = (el, className, ...nwClassNames) => {
  console.log(className, nwClassNames);
  el.classList.remove(className);
  nwClassNames.forEach(name => el.classList.add(name));
}

/**
 * remove all elements of the collection
 * of the ExtendedNodeList instance from the DOM tree
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const remove = el => el.remove();

/**
 * remove [classNames] from all elements of the collection
 * of the ExtendedNodeList instance. Class names can be one
 * or more strings
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param classNames {...string} one or more class names
 */
const removeClass = (el, ...classNames) =>
    classNames.forEach( cn => el.classList.remove(cn) );

/**
 * add [classNames] to all elements of the collection
 * of the ExtendedNodeList instance. Class names can be one
 * or more strings
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param classNames {...string} one or more class names
 */
const addClass = (el, ...classNames) =>
    el && classNames.forEach( cn => el.classList.add(cn) );

/**
 * show all elements of a collection
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const show = el => el.style.display = ``;

/**
 * hide all elements of a collection
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const hide = el => el.style.display = `none`;

  //(el, show) => el.style.display = show ? `` : `none`;

/**
 * set data-attribute for all elements of the collection
 * of the ExtendedNodeList instance.
 * attributes must be key-value pairs
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} Object e.g. &#123;isSet: 'true'&#125;
 * <br><b>Note</b> do <i>not</i> use dashed keys but camelcase if you
 * need to split up the dataset. <b>wrong</b>: <code>no-code</code>, <b>right</b>: <code>noCode</code>.
 * The latter will be <i>rendered</i> as <code>`data-no-code`</code> in HTML, but not in js-code.
 */
const setData = (el, keyValuePairs) => {
  // noinspection JSValidateTypes
  el && isObjectAndNotArray(keyValuePairs) &&
    Object.entries(keyValuePairs).forEach( ([key, value]) => el.dataset[key] = value );
}

/**
 * Set attribute or property values for all elements of the collection
 * of the ExtendedNodeList instance
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} Object e.g. &#123;title: 'I am Groot'&#125;
 */
const assignAttrValues = (el, keyValuePairs) =>
    el && Object.entries(keyValuePairs).forEach( ([key, value]) => {
      if (key.startsWith(`data`)) {
        setData(el, {[key]: value});  
      }

      if (key.toLowerCase() === "class") {
        value.split(/\s+/).forEach(v => el.classList.add(`${v}`))
      } 

      if (value.constructor === String) {
        el[key] = value;
      }
    } );

/**
 * Get or set attributes for all elements of the collection
 * of the ExtendedNodeList instance
 * attributes must be key-value pairs
 * style and data-attributes must also be key-value pairs
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyOrObj {string|Object} Object e.g. &#123;color: '#c0c0c0'&#125;
 * @param value {string} some value
 * @returns {*|string}
 */
const attr = (el, keyOrObj, value) => {
  if (!el) { return true; }

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
}

/**
 * RUNNING?
 * Style the elements of the collection of an ExtendedNodeList instance <i>inline</i>,
 * so <code>&lt;div style="[the style from parameters]"></code>.
 * Preferably use key-value pairs
 * @memberof CollectionLambdas
 * @param el {HTMLElement} (implicit) current ExtendedNodeList instance
 * @param keyOrKvPairs {Object|string} Object e.g. <code>&#123;marginRight: '12px'&#125</code>,
 * or string e.g. <code>"marginRight"</code>
 * <br>key may be: `paddingRight` or `"padding-right"`
 * @param value {string|undefined} if value is not <code>undefined</code>,
 * keyOrKvPairs should be a string too
 * <br>If the value should be empty (reset: e.g. <code>padding: ""</code>), use a dash "-"
 * @returns {ExtendedNodeList|string} ExtendedNodeList instance, so chainable
 */
const styleInline = (el, keyOrKvPairs, value) => {
  if (value && keyOrKvPairs.constructor === String) {
    keyOrKvPairs = { [keyOrKvPairs]: value || "none" };
  }

  if (!Array.isArray((keyOrKvPairs)) && keyOrKvPairs.constructor === Object) {
    Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
  }
};

/**
 * Style the elements of a collection of the ExtendedNodeList
 * instance <i>within a custom style sheet</i>, using an intermediate class.
 * <br><b>Note</b>: the intermediate <code>className</code> starts with`jQLCreated_`.
 * There will be one intermediate class name per element. Subsequent .css calls will
 * change the rules for that class name.
 * <br>Preferably use key-value pairs, even when assigning a single property.
 * @memberof CollectionLambdas
 * @example
 * // presume $ is the alias for ExtendedNodeList
 * $(`<p>`).css({marginLeft: `12px`, color: `green`, borderLeft: `2px solid red`})
 * // the document will now contain <p class="JQLCreated_[a random string]]"></p>
 * // use your own class name
 * $(`<p>`).css({className: `leftRedBorder`, marginLeft: `12px`, color: `green`, borderLeft: `2px solid red`});
 * // the document will now contain <p class="leftRedBorder"></p>
 * @param el {HTMLElement} (implicit) current ExtendedNodeList instance
 * @param keyOrKvPairs {Object|string} Object or string e.g. <code>&#123;marginRight: '12px'&#125;</code>
 * or <code>'margin-right'</code>
 * <br>key or string may be: `paddingRight` or `"padding-right"`
 * <br><b>Note</b>: if you want to use your own class name (so not a random name),
 * include a <code>className</code> property in the Object. See example.
 * @param value {string|undefined} if value is not <code>undefined</code>, keyOrKvPairs should be a string too
 * <br>If the value should be empty (reset: e.g. <code>padding: ""</code>), use a dash "-"
 * @returns {ExtendedNodeList} ExtendedNodeList instance, so chainable
 */
const css = (el, keyOrKvPairs, value) => {
  if (value && keyOrKvPairs.constructor === String) {
    keyOrKvPairs = { [keyOrKvPairs]: value === "-" ? "" : value };
  }
  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists  = ([...el.classList].find(c => c.startsWith(`JQLCreated`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQLCreated_${String.createRandomHtmlElementId(12)}`;
    setStyle(`.${nwClass}`, keyOrKvPairs, `JQLCustomCSS`);
    el.classList.add(nwClass);
};

//#endregion collection lambda's
const extendedNodeListCollectionLamdas = {
  toggleClass, addClass, removeClass, attr, removeAttr,
  toggleAttr, toggleStyleFragments, show, hide, empty, remove,
  replaceClass, clear, setData, css, styleInline};

export default extendedNodeListCollectionLamdas;