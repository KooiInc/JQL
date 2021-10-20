// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols,JSUnresolvedFunction,JSValidateJSDoc,JSUnresolvedVariable
// noinspection JSUnresolvedFunction

import {
  debugLog,
  JQLLog,
  setStyling4Log } from "./JQLLog.js";

import {
  time,
  truncateHtmlStr,
} from "./Helpers.js";

import {
  setTagPermission,
  allowUnknownHtmlTags,
} from "./DOMCleanup.js";

import {
  createElementFromHtmlString,
  insertPositions,
} from "./DOM.js";

import setStyle from "./Styling.js";

import {
  initializePrototype,
  isHtmlString,
  isArrayOfHtmlStrings,
  inject2DOMTree,
  isCommentNode,
  ElemArray2HtmlString,
  checkInput,
  setCollectionFromCssSelector,
} from "./JQLExtensionHelpers.js";

const customStylesheetId = `JQLCustomCSS`;
const logLineLength = 75;
let logSystem = false;

/**
 * The JQL core
 * @module JQL
 */
// -------------------------------------------------------------------- //
/**
 * The core constructor for creating and/or deliver a node(list), exposed as
 * <code>JQL</code>
 * <br>It delivers an instance of <code>ExtendedNodeList</code> containing a collection of
 * <code>HTMLElement</code>s (may be empty), for which a number of jquery-like extension methods is
 * available (e.g. <code>[instance].<b style="color:red">addClass</b></code>).<br>When the parameter
 * contains html (e.g. <code>&lt;p class="someClass">Hello wrld>&lt;/p></code>), the element(s) is/are
 * created and by default injected in de DOM tree unless [<code>root</code>] is a <code>HTMLBRElement</code>.
 * <br><b>Note</b>: any html creation triggers checking and sanitizing the html to prevent script injection etc.
 * @param input One of<ul>
 * <li><code>Node</code> list
 * <li><code>HtmlElement</code> instance
 * <li><code>ExtendedNodeList</code> instance
 * <li><code>string</code> css selector (e.g. <code>'#someElem'</code>).<br>
 * <b>Note</b>: up to selectors level 3 for most modern browsers,
 *  maybe level 4 (draft) for more advanced browsers
 * <br>(see selectors {@link https://drafts.csswg.org/selectors-3/ level 3}
 *  or {@link https://drafts.csswg.org/selectors-4/ level 4 draft})
 * <li><code>string</code> html element string (e.g. <code>'&lt;div>Hello&lt;/div>'</code>)
 * <li><code>Array</code> of <code>string</code>
 *  (e.g. <code>['&lt;span>Hello&lt;/span>', '&lt;span>world&lt;/span>']</code>)
 * </ul>
 * @param root {HTMLElement} The root element to which an element to create must be appended or inserted into/before/after
 * (see [position] parameter)<ul>
 * <li>Defaults to <code>document.body</code>
 * <li>If one or more elements is/are created they will not be inserted into the DOM tree
 * when [root] is an instance of <code>HTMLBRElement</code> (so <code>&lt;br></code>)</ul>
 * @param position {string} Position within or before/after the root where the element must be injected
 * relative to [root]
 * - e.g. 'afterbegin' (or import and use insertPositions from DOM.js)
 * @returns {ExtendedNodeList} An instance of ExtendedNodeList
 * @example
 * import $ from "JQueryLike.js";
 * // a few examples
 * $(document.querySelectorAll(`p`));
 * $(document.querySelector(`p.something`));
 * $($(`.something`));
 * $(`.something`);
 * $(`<p class="something" id="ex1">Hi. I am <b>Groot</b><p>`);
 * $([`<p class="something" id="ex2">Hi. I am <b>Groot</b><p>`, `<div id="Groot">Yup, aren't you?</div>`]);
 * // extensions (most are chainable)
 * $(`#ex1`).text(`. Say no more`, true).addClass(`done`);
 * $(`#Groot`)
 *   .css({color: `green`, fontWeight: `bold`})
 *   .html(`<i>You are, really. And it's fine.</i>`, true);
 */
const ExtendedNodeList = function (
  input,
  root = document.body,
  position = insertPositions.BeforeEnd) {

  if (ExtendedNodeList.prototype.isSet === undefined) {
    initializePrototype(ExtendedNodeList);
  }

  checkInput(input, this);

  if (Array.isArray(this.collection)) {
    return this;
  }

  try {
    this.collection = [];
    root = root instanceof ExtendedNodeList ? root.first() : root;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml;

    if (!shouldCreateElements) {
      logSystem && JQLLog(setCollectionFromCssSelector(input, root, this));
      return this;
    }

    const logStr = (`(JQL log) raw input: [${
      truncateHtmlStr(isRawHtmlArray ? input.join(``) : input, 80)}]`);

    if (shouldCreateElements) {
      [input].flat()
        .forEach(htmlFragment => this.collection.push(createElementFromHtmlString(htmlFragment)));
    }

    if (shouldCreateElements && this.collection.length > 0) {
      this.collection = !(root instanceof HTMLBRElement)
        ? inject2DOMTree(this.collection, root, position).filter(el => !isCommentNode(el))
        : this.collection;

      logSystem && JQLLog(`${logStr}\n  Created (outerHTML truncated) [${
        truncateHtmlStr(ElemArray2HtmlString(this.collection) || "sanitized: no elements remaining")
          .substr(0, logLineLength)}]`);
    }
  } catch (error) {
    const msg = `Caught jql selector or html error:\n${error.stack ? error.stack : error.message}`;
    debugLog.isOn && logSystem && JQLLog(msg) || console.log(msg);
  }
}

const JQL = (...args) => new ExtendedNodeList(...args);

Object.entries({
  /**
   * alias for <code>document.querySelector</code>
   * @param selector {string} a css selector
   * @returns {HTMLElement|null}
   */
  node: selector => document.querySelector(selector),

  /**
   * Alias for <code>document.querySelectorAll</code>
   * @param selector {string} a css selector
   * @returns {NodeListOf<*>}
   */
  nodes: selector => document.querySelectorAll(selector),

  /**
   * Create an ExtendedNodeList instance without injecting elements (so, collection elements in memory)
   * <code>JQL.virtual</code>,
   * @example
   * import $ from "JQueryLike.js";
   * const inMemoryParagraph = $.virtual(`<p>I am and I am not</p>`);
   * // you won't see this in the DOM, but you can manipulate properties
   * inMemoryParagraph.styleInline({color: `green`}).setData({IAmGreen: `yep`});
   * $(`body`).append(inMemoryParagraph);
   * // result: <p style="color:green" data-i-am-green="yep">I am and I am not</p>
   * //                                ^ Note: stringified output from the browser
   * // now, there it is
   * $(`<div>Hello stranger. Try hovering me!</div>`).addClass(`something`);
   * @poram html {string} a HTML string e.g. <code>&lt;div class="hi">a div&lt;/div></code>
   * @returns {ExtendedNodeList} An instance of ExtendedNodeList
   */
  virtual: html => new ExtendedNodeList(html, document.createElement("br")),

  /**
   * Set style rules in the JQL custom stylesheet element
   * <ul><li>The rules are written to a custom style sheet with id <code>#JQLCustomCSS</code> into the document
   * <li>You can use pseudo selectors. In case of creating a rule with the <code>content</code> property
   * be sure to quote the text value (see example)</ul>
   * <code>JQL.setStyle</code>,
   * @param selector {string} the selector e.g. <code>#someElem.someClass</code>
   * @param ruleValues {Object} an object containing the rules for the selector
   * @example
   * import $ from "JQueryLike.js";
   * $.setStyle(`body`, {font: `normal 12px/15px verdana, arial`, margin: `2em`});
   * $.setStyle(`.something:hover:after`, {content: `' You hovered me!'`, color: `red`});
   * // usage
   * $(`<div>Hello stranger. Try hovering me!</div>`).addClass(`something`);
   */
  setStyle: (selector, ruleValues) => setStyle(selector, ruleValues, customStylesheetId),

  /**
   * Activate/deactivate/show/hide (debug-)logging
   * <code>JQL.JQLLog</code>,
   * see <a href="./module-Log.html">Log (type: debugLog)</a>
   */
  debugLog,

  /**
   * Log stuff to the logger (if active)
   * * <code>JQL.JQLLog</code>,
   * see <a href="./module-JQLLog.html#~JQLLog">JQL/JQLLog</a>
   */
  log: JQLLog,

  /**
   * Allow/disallow the use of certain HTML tags when creating elements using JQL
   * <code>JQL.setTagPermission</code>,
   * see <a href="./module-HTMLCleanup.html#~setTagPermission">HTMLCleanup</a>
   */
  setTagPermission,

  /**
   * Allow/disallow unknown HTML tags
   * <code>JQL.allowUnknownHtmlTags,</code>,
   * see <a href="./module-HTMLCleanup.html">HTMLCleanup</a>
   */
  allowUnknownHtmlTags,

  /**
   * Positions for use in insertAdjacentHTML(-Element)
   * <code>JQL.insertPositions</code>,
   * See <a href="module-DOM.html">DOM (type: adjacents)</a>
   */
  insertPositions,

  /**
   * Set the styling for the logger element (<code>#logBox</code>)
   * <code>JQL.setStyling4Log</code>,
   * see <a href="./module-Log.html#~setStyling4Log">Log.setStyling4Log</a>
   */
  setStyling4Log,

  /**
   * Activate or deactive logging of system messages. Default: false
   * <code>JQL.setSystemLogActiveState([state])</code>,
   * see <a href="./module-Log.html#~setStyling4Log">Log.setStyling4Log</a>
   * @param activeState {boolean} on (true) or off (default false)
   */
  setSystemLogActiveState: activeState => logSystem = activeState,

/**
   * Current time helper
   * <code>JQL.time</code>, see <a href="module-Helpers.html#~time">Helpers.time</a>
   */
  time,
  customStylesheetId,
}).forEach(([methodKey, method]) => JQL[methodKey] = method);

export default JQL;