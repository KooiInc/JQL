// noinspection JSValidateJSDoc,JSUnresolvedVariable,JSUnusedGlobalSymbols

/**
 * A small module for logging in a fixed positioned JQLLog box
 * <br>Every line logged is preceded by the time it is logged (granularity: milliseconds)
 * The styling of the logbox happens via a <code>&lt;style></code> element, added to the
 * header of the enclosing document.
 * @module JQLLog
 */
import {createElementFromHtmlString, element2DOM, insertPositions } from "./DOM.js";
import setStyle from "./Styling.js";
import {time} from "./Helpers.js";
import {isVisible} from "./JQLExtensionHelpers.js";

/**
 * defaultStyling is the styling used for a the box used for logging (a <code>HTMLFieldSetElement</code> element).
 * May be overridden by your own styles, but must use the id <code>#logBox</code>.
 * @var defaultStyling
 */
let defaultStyling = {
  "#logBox": {
    minWidth: `0px`,
    maxWidth: `0px`,
    minHeight: `0px`,
    maxHeight: `0px`,
    opacity: `0`,
    border: `none`,
    padding: `0px`,
    overflow: `hidden`,
    transition: `all 1s ease 0s`,
    position: `fixed`,
  },
  "#logBox.visible": {
    backgroundColor: `rgb(255, 255, 224)`,
    position: `static`,
    opacity: `1`,
    border: `1px dotted rgb(153, 153, 153)`,
    maxWidth: `90vw`,
    minWidth: `30vw`,
    minHeight: `10vh`,
    maxHeight: `90vh`,
    overflow: `auto`,
    width: `50vw`,
    height: `20vh`,
    margin: `1rem 0px`,
    padding: `0px 8px 19px`,
    resize: `both`,
  },
  "#logBox .legend": {
    textAlign: `center`,
    position: `absolute`,
    marginTop: `-1em`,
    width: `inherit`,
  },
  "#logBox .legend div": {
    textAlign: `center`,
    display: `inline-block`,
    width: `auto`,
    height: `1.2rem`,
    backgroundColor: `rgb(119, 119, 119)`,
    padding: `2px 10px`,
    color: `rgb(255, 255, 255)`,
    boxShadow: `rgb(119 119 119) 2px 1px 10px`,
    borderRadius: `4px`,
  },
  "#logBox .legend div:before": {
    content: `"JQL Logging"`,
  },
};

let defaultStylingId = `JQLCustomCSS`;
let useLogging = false;
let log2Console = false;
let reverseLogging = true;
let logBox = undefined;
/**
 * Add style classes for the JQLLog box to a custom css style element.
 * @param styles {Object} style rules Object, e.g. <code>&#123;margin: `0`, color: `green`&#125;</code>.
 * Default styles are in <code>defaultStyling</code>
 * @param cssId {string} the id of the custom style element (automagically created in the
 * header of the document in which JQL is used). Default is 'JQLCustomCSS'.
 */
const setStyling4Log = (styles = defaultStyling, cssId = defaultStylingId) => {
  const exists = document.querySelector(cssId);
  // this triggers rename (id) of existing stylesheet
  if (exists) { exists.id = cssId; }
    Object.entries(styles).forEach(([selector, style]) => setStyle(selector, style, cssId));
};

let useHtml = false;

/**
 * Use logging for debug (set on/off or show/hide the JQLLog box).
 * @typedef debugLog
 * @type {Object}
 * @property {function} isVisible Is the JQLLog box visible?
 * @property {function} on Activate logging for JQL.
 * @property {function} off Deactivate logging for JQL.
 * @property {function} hide Hide the JQLLog box.
 * @property {function} show Show the JQLLog box.
 * @property {function} toConsole Log to console.
 * @property {function} reversed Log top to bottom (false) or latest first (default true)
 * @property {function} clear the log box
 * @property {function} (getter) isOn is logging on?
 */
const debugLog = {
  get isOn() { return useLogging; },
  isVisible: () => logBox && isVisible(logBox),
  on() {
    useLogging = true;
    if (!log2Console) {
      logBox = document.querySelector("#jql_logger") || createLogElement();
      logBox.parentNode.classList.add(`visible`);
    }
    JQLLog(`Logging started (to ${log2Console ? `console` : `document`})`);
  },
  off() {
    if (logBox) {
      JQLLog(`Logging stopped`);
      logBox && logBox.parentNode.classList.remove(`visible`);
    }
    useLogging = false;
  },
  /**
   * log everything to console
   * <code>debugLog.toConsole([true/false])</code>
   * <br><b>Note</b>: this destroys the div#logBox in the document
   * if applicable.
   * @function debugLog/toConsole
   * @param reverse {boolean} latest last (false) or latest first (true) (default true)
   */
  toConsole(yep) {
    log2Console = yep;
    useLogging = yep;
    yep && logBox && logBox.parentNode.remove();
  },
  hide: () => logBox && logBox.parentNode.classList.remove(`visible`),
  show: () => logBox && logBox.parentNode.classList.add(`visible`),
  /**
   * Change log direction
   * <code>debugLog.reversed([true/false])</code>
   * @name debugLog#reversed
   * @function debugLog/reversed
   * @param reverse {boolean} latest last (false) or latest first (true) (default true)
   */
  reversed(reverse) {
    reverseLogging = reverse;
    JQLLog(`Reverse logging reset: now logging ${
      reverse ? `bottom to top (latest first)` : `top to bottom (latest last)`}`);
  },
  clear() {
    if (logBox) {
      logBox.textContent = ``;
      JQLLog(`Cleared`);
    }
  }
};

const createLogElement = () => {
  setStyling4Log();
  const loggingFieldSet = `
    <div id="logBox">
      <div class="legend">
        <div></div>
      </div>
      <${useHtml ? `div` : `pre`} id="jql_logger"></pre>
    </div>`;
  // noinspection JSCheckFunctionSignatures
  element2DOM(createElementFromHtmlString(loggingFieldSet), undefined, insertPositions.AfterBegin);
  return document.querySelector(`#jql_logger`);
};

/**
 * Create JQLLog entry/entries, preceded with the time of logging (millisecond granularity).
 * <br>If the local [useLogging] boolean is false, nothing is logged
 * <br> in JQL exposed as <code>JQL.log</code>
 * @param args {...(string|Object)} string(s) or Object(s) to print in the JQLLog box
 * * <br><b>Note</b> Objects are converted to JSON representation
 */
const JQLLog = (...args) => {
    if (!useLogging) { return; }
    if (!log2Console && !logBox) {
      createLogElement();
    }
    const logLine = arg => `${arg instanceof Object ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => log2Console
      ? console.log(arg.replace(/&lt;/g, `<`).replace(/&hellip;/g, `...`))
      : logBox.insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `${time()} ${logLine(arg.replace(/\n/g, `<br>`))}`)
    );
};

const setStylingId4Log = id => defaultStylingId = id;
export { JQLLog, debugLog, setStylingId4Log, setStyling4Log };