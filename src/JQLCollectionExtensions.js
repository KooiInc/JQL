// noinspection JSUnusedLocalSymbols,JSCheckFunctionSignatures,JSValidateJSDoc,JSUnresolvedVariable,DuplicatedCode
// noinspection JSUnresolvedVariable

import {hex2RGBA} from "./JQLExtensionHelpers.js";
import {isObjectAndNotArray,} from "./Helpers.js"
import {setStyle} from "./Styling.js";

//#region collection lambda'style
/**
 * @module
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
 * toggle className (on/off) for each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param className {string} the class name to toggle (eg 'hidden')
 */
const toggleClass = (el, className) => {
  el.classList.toggle(className);
};

/**
 * Toggle individual style properties for each element of the element collection of the ExtendedNodeList.
 * Properties must be key-value pairs
 * Note: this may fail, because browsers may reformat style values in their own way.
 * For colors, hex values are converted (see the [color helper]{@link module:JQLExtensionHelpers~hex2RGBA}).
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} e.g. &#123;marginRight: '12px'&#125;
 */
const toggleStyleFragments = (el, keyValuePairs) =>
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
  });

/**
 * Remove some attribute from each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param name {string} the attribute name
 */
const removeAttr = (el, name) => el && el.removeAttribute(name);

/**
 * Toggle attribute [name] with [value] for each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param name {string} attribute name (e.g. 'title')
 * @param value {string} attribute value to set
 */
const toggleAttr = (el, name, value) =>
  el && el.hasAttribute(name)
    ? el.removeAttribute(name)
    : el.setAttribute(name, value);

/**
 * Remove content for each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const empty = el => el && (el.textContent = "");

/**
 * Alias for empty
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const clear = el => empty(el);

/**
 * Swap [classname] with [...nwClassnames] for each element of the element collection of the ExtendedNodeList.
 * Enables replacing a class name with one or more class name(s)
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
 * Remove each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const remove = el => el.remove();

/**
 * Remove [classNames] from for each element of the element collection of the ExtendedNodeList.
 * Class names can be one or more strings.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param classNames {...string} one or more class names
 */
const removeClass = (el, ...classNames) =>
  classNames.forEach(cn => el.classList.remove(cn));

/**
 * Add [classNames] to each element of the element collection of the ExtendedNodeList.
 * Class names can be one or more strings
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param classNames {...string} one or more class names
 */
const addClass = (el, ...classNames) =>
  el && classNames.forEach(cn => el.classList.add(cn));

/**
 * Show each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const show = el => el.style.display = ``;

/**
 * Hide each element of the element collection of the ExtendedNodeList.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 */
const hide = el => el.style.display = `none`;

//(el, show) => el.style.display = show ? `` : `none`;

/**
 * Set data-attribute for each element of the element collection of the ExtendedNodeList.
 * The attributes must be key-value pairs.
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} Object e.g. &#123;isSet: 'true'&#125;
 * <br><b>Note</b> do <i>not</i> use dashed keys but camelcase if you
 * need to split up the dataset. <b>wrong</b>: <code>no-code</code>, <b>right</b>: <code>noCode</code>.
 * The latter will be <i>rendered</i> as <code>`data-no-code`</code> in HTML, but not in js-code.
 */
const setData = (el, keyValuePairs) => {
  // noinspection JSValidateTypes
  el && isObjectAndNotArray(keyValuePairs) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.dataset[key] = value);
}

/**
 * Set attribute or property values for each element of the element collection of the ExtendedNodeList.
 * of the ExtendedNodeList instance
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyValuePairs {Object} Object e.g. &#123;title: 'I am Groot'&#125;
 */
const assignAttrValues = (el, keyValuePairs) =>
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

/**
 * Get or set attributes for each element of the element collection of the ExtendedNodeList
 * of the ExtendedNodeList instance
 * attributes must be key-value pairs
 * style and data-attributes must also be key-value pairs
 * @param el {HTMLElement} (implicit [ExtendedNodeList instance].collection[i]) an element from the collection
 * @param keyOrObj {string|Object} Object e.g. &#123;color: '#c0c0c0'&#125;
 * @param value {string} some value
 * @returns {*|string}
 */
const attr = (el, keyOrObj, value) => {
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
}

/**
 * Style each element of the element collection of the ExtendedNodeList <i>inline</i>,
 * so <code>&lt;div style="[the style from parameters]"></code>.
 * Preferably use key-value pairs
 * @param el {ExtendedNodeList} (implicit) current ExtendedNodeList instance
 * @param keyOrKvPairs {Object|string} Object e.g. <code>&#123;marginRight: '12px'&#125</code>,
 * or string e.g. <code>"marginRight"</code>
 * <br>key may be: `paddingRight` or `"padding-right"`
 * @param value {string|undefined} if value is not <code>undefined</code>,
 * keyOrKvPairs should be a string too
 * <br>If the value should be empty (reset: e.g. <code>padding: ""</code>), use a dash "-"
 */
const style = (el, keyOrKvPairs, value) => {
    if (value && keyOrKvPairs.constructor === String) {
      keyOrKvPairs = {[keyOrKvPairs]: value || "none"};
    }

    if (!Array.isArray((keyOrKvPairs)) && keyOrKvPairs.constructor === Object) {
      Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
    }
};

const styleInline = style;

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
 * @param el {HTMLElement} (implicit) element from the collection
 * @param keyOrKvPairs {Object|string} Object or string e.g. <code>&#123;marginRight: '12px'&#125;</code>
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

//#endregion collection lambda's

export default {
  toggleClass, addClass, removeClass, attr, removeAttr, style, styleInline,
  toggleAttr, toggleStyleFragments, show, hide, empty, remove, replaceClass,
  clear, setData, css,
};