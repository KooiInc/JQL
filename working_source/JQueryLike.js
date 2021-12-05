// noinspection DuplicatedCode

import {
  debugLog,
  Log,
  setStyling4Log } from "./JQLLog.js";

import popupFactory from "./Popup.js";

import {
  setTagPermission,
  allowUnknownHtmlTags,
  logElementCreationErrors,
} from "./DOMCleanup.js";

import {
  createElementFromHtmlString,
  insertPositions,
} from "./DOM.js";

import {setStyle, customStylesheet} from "./Styling.js";

import {
  initializePrototype,
  isHtmlString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  time,
  truncateHtmlStr,
} from "./JQLExtensionHelpers.js";

const logLineLength = 75;
let logSystem = false;

customStylesheet.id = `JQLCustomCSS`;

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
 * created and by default injected in de DOM tree unless [<code>root</code>] is a <code>HTMLBRElement</code>
 * (the static method <code>virtual</code> is provided for the latter).
 * <br><b>Note</b>: any html creation triggers [checking and sanitizing the html]{@link module:JQL/XHelpers/HtmlCleanup}
 * to prevent script injection etc.
 * @param input One of<ul>
 * <li><code>Node</code> Array, Nodelist or single Node of
 *   <ul>
 *      <li><code>HtmlElement</code>
 *      <li><code>Comment</code>
 *      <li><code>Text</code>
 *    </ul></li>
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
 * @param root {HTMLElement|ExtendedNodeList}
 * The root element to which an element to create must be appended or inserted into (see [position] parameter)<ul>).
 * <br>If root is an ExtendedNodeList instance, the first element of that is considered the
 * root element.
 *
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
 *
 * // static methods
 * const $$ = $.virtual;
 * $.setStyle(`.done`, {color: `green`, fontWeight: `bold`});
 *
 * // ExtendedNodeList instances
 * $(document.querySelectorAll(`p`));
 * $(document.querySelector(`p.something`));
 * $($$(`.something`));
 * $(`.something`);
 * $$(`<p class="something" id="ex1">Hi. I am <b>Groot</b><p>`); // in memory
 * $(`<p class="something" id="ex1">Hi. I am <b>Groot</b><p>`); // in DOM tree
 * $([`<p class="something" id="ex2">Hi. I am <b>Groot</b><p>`,
 *    `<div id="Groot">Yup, aren't you?</div>`]);
 *
 * // extensions (most are chainable)
 * $(`#ex1`).text(`. Say no more`, true).addClass(`done`);
 * $(`#Groot`)
 *   .css({color: `green`, 'font-weight': `bold`})
 *   .html(`<i>You are, really. And it's fine.</i>`, true)
 *   .prepend(document.createElement(`\u2022 `));
 */
const ExtendedNodeList = function ( input, root = document.body, position = insertPositions.BeforeEnd ) {
  if (ExtendedNodeList.prototype.isJQL === undefined) { initializePrototype(ExtendedNodeList); }

  this.collection = input2Collection(input);
  const isRawElemCollection = isArrayOfHtmlElements(this.collection);

  if (Array.isArray(this.collection) && !isRawElemCollection) {
    return this;
  }

  try {
    this.collection = this.collection || [];
    this.isVirtual = root instanceof HTMLBRElement;
    root = root instanceof ExtendedNodeList ? root.first() : root;
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = isArrayOfHtmlStrings(input);
    const shouldCreateElements = isRawHtmlArray || isRawHtml || isRawElemCollection;

    if (!shouldCreateElements) {
      const forLog = setCollectionFromCssSelector(input, root, this);
      logSystem && Log(forLog);
      return this;
    }

    const logStr = (`(JQL log) raw input: [${
      truncateHtmlStr(isRawHtmlArray
        ? input.join(``) 
        : isRawElemCollection ? `Element(s): ${this.collection.map(el => el.outerHTML || el.textContent).join(``)}`
          : input, logLineLength)}]`);

    if (shouldCreateElements && !isRawElemCollection) {
      [input].flat()
        .forEach(htmlFragment => this.collection.push(createElementFromHtmlString(htmlFragment)));
    }

    if (shouldCreateElements && this.collection.length > 0) {
      const errors = this.collection.filter( el => el.dataset?.jqlcreationerror );
      this.collection = this.collection.filter(el => !el.dataset?.jqlcreationerror);
      !this.isVirtual && inject2DOMTree(this.collection, root, position);
      logSystem && Log(`${logStr}\n  Created ${this.isVirtual ? `VIRTUAL` : ``}(outerHTML truncated) [${
        truncateHtmlStr(ElemArray2HtmlString(this.collection) || "sanitized: no elements remaining", logLineLength)}]`);
      errors.length && console.error(`JQL: not rendered illegal html: "${
        errors.reduce( (acc, el) => acc.concat(`${el.textContent}\n`), ``).trim()}"` );
    }
  } catch (error) {
    const msg = `Caught jql selector or html error:\n${error.stack ? error.stack : error.message}`;
    debugLog.isOn && logSystem && (Log(msg) || console.log(msg));
  }
}

const JQL = (...args) => new ExtendedNodeList(...args);

Object.entries({
  /**
   * alias for <code>document.querySelector</code>
   * @function JQL/node
   * @param selector {string} a css selector
   * @returns {HTMLElement|null}
   */
  node: selector => document.querySelector(selector),

  /**
   * Alias for <code>document.querySelectorAll</code>
   * @function JQL/nodes
   * @param selector {string} a css selector
   * @returns {NodeListOf<*>}
   */
  nodes: selector => document.querySelectorAll(selector),

  /**
   * Create an ExtendedNodeList instance without injecting elements (so, collection elements in memory)
   * <code>[JQL instance].virtual</code>,
   * @function JQL/virtual
   * @example
   * import $ from "JQueryLike.js";
   * const inMemoryParagraph = $.virtual(`<p>I am and I am not</p>`);
   * // you won't see this in the DOM, but you can manipulate properties
   * inMemoryParagraph.styleInline({color: `green`}).setData({IAmGreen: `yep`});
   * $(`body`).append(inMemoryParagraph);
   * // result: <p style="color:green" data-i-am-green="yep">I am and I am not</p>
   * //                                ^ Note: data-attribute displays stringified output from the browser
   * @poram html {string} a HTML string e.g. <code>&lt;div class="hi">a div&lt;/div></code>
   * @returns {ExtendedNodeList} An instance of ExtendedNodeList
   */
  virtual: html => new ExtendedNodeList(html, document.createElement("br")),

  /**
   * Set style rules in the JQL custom stylesheet element
   * <ul><li>The rules are written to a custom style sheet with id <code>#JQLCustomCSS</code> into the document
   * <li>You can use pseudo selectors. In case of creating a rule with the <code>content</code> property
   * be sure to quote the text value (see example)</ul>
   * <code>[JQL instance].setStyle</code>,
   * See [module Styling]{@link module:JQL/XHelpers/Styling~changeCssStyleRule}
   * @function JQL/setStyle
   * @param selector {string} the selector e.g. <code>#someElem.someClass</code>
   * @param ruleValues {Object} an object containing the rules for the selector
   * @param cssId {string} optionally the id for the style element (default 'JQLCustomCSS')
   * @example
   * import $ from "JQueryLike.js";
   * $.setStyle(`body`, {font: `normal 12px/15px verdana, arial`, margin: `2em`});
   * $.setStyle(`.something:hover:after`, {content: `' You hovered me!'`, color: `red`});
   * // usage
   * $(`<div>Hello stranger. Try hovering me!</div>`).addClass(`something`);
   */
  setStyle: (selector, ruleValues, cssId) => setStyle(selector, ruleValues, cssId),

  /**
   * Activate/deactivate/show/hide (debug-)logging.
   * See [module JQLLog]{@link module:JQL/JQLLog~debugLog}
   * @function JQL/debugLog
   */
  debugLog,

  /**
   * Log stuff to the logger ([if activated]{@link module:JQL/JQLLog~Log}).
   * <br><code>[JQL instance].log</code>,
   * @function JQL/log
   */
  log: Log,

  /**
   * Allow/disallow the use of certain HTML tags when creating elements using JQL.
   * See [module HtmlTags]{@link module:JQL/XHelpers/HtmlTags~setTagPermission}
   * @function JQL/setTagPermission
   */
  setTagPermission,

  /**
   * Allow/disallow unknown HTML tags.
   * * <br><code>[JQL instance].allowUnknownHtmlTags</code>,
   * See [module HtmlCleanup]{@link module:JQL/XHelpers/HtmlCleanup~allowUnknownHtmlTags}
   * @function JQL/allowUnknownHtmlTags

   */
  allowUnknownHtmlTags,

  /**
   * Positions for use in insertAdjacentHTML(-Element).
   * See [module DOM.adjacents]{@link module:JQL/XHelpers/DOM~adjacents}
   * @function JQL/insertPositions

   */
  insertPositions,

  /**
   * Activate/deactivate logging of element creation errors (in the console)
   * <br><code>[JQL instance].logElementCreationErrors</code>,
   * See [module HtmlCleanup]{@link module:JQL/XHelpers/HtmlCleanup~logElementCreationErrors}
   * @function JQL/logElementCreationErrors
   */
  logElementCreationErrors,

  /**
   * Set the styling for the logger element (<code>#logBox</code>).
   * <br><code>[JQL instance].setStyling4Log</code>
   * See [module Log]{@link module:JQL/JQLLog~setStyling4Log}
   * @function JQL/setStyling4Log
   */
  setStyling4Log,

  /**
   * Activate or deactive logging of system messages. Default: false
   * <br><code>[JQL instance].setSystemLogActiveState</code>
   * @function JQL/setSystemLogActiveState
   * @param activeState {boolean} on (true) or off (default false)
   */
  setSystemLogActiveState: activeState => logSystem = activeState,

  /**
   * <code>JQL.time</code><br>
   * Current time helper.
   * See [module Helpers]{@link module:JQL/XHelpers/GenericHelpers~time}
   * @function JQL/time
   */
  time,

  /**
   * <code>JQL.popup</code><br>
   * A small library for creation of (modal) popup boxes.
   * Initialize before use
   * See [module Popup]{@link module:JQL/Popup}
   * @example
   * import $ from "JQueryLike.js";
   * const myPopups = $.popup();
   * myPopups.create(`Hi, I am a popup`);
   * @function JQL/popup
   */
  popup: () => popupFactory(JQL),

  /**
   * Utiltity to create a textNode or a comment
   * (for use as parameter creating a JQL instance).
   * Alias for <code>document.createText</code> / <code>document.createComment</code
   * @function text
   * @example
   * import $ from "JQueryLike.js";
   * $($.txt(`HELLO World`));
   * @param str {string} The content of the Text element
   * @param isComment {boolean} false (default) as Text, true as Comment
   * @returns {Text|Comment} a Text or Comment element (CharacterData)
   */
  text: (str, isComment = false) => isComment ? document.createComment(str) : document.createTextNode(str),

}).forEach(([methodKey, method]) => JQL[methodKey] = method);

export default JQL;