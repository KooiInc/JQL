// noinspection JSValidateJSDoc,JSUnresolvedVariable,JSUnusedGlobalSymbols

/**
 * A small module for logging in a fixed positioned JQLLog box
 * <br>Every line logged is preceded by the time it is logged (granularity: milliseconds)
 * The styling of the logbox happens via a <code>&lt;style></code> element, added to the
 * header of the enclosing document.
 * @module JQLLog
 */
import {createElementFromHtmlString, element2DOM, insertPositions } from "./DOM.js";
import {setStyle, customStylesheet} from "./Styling.js";
import {time} from "./Helpers.js";
import {isVisible} from "./JQLExtensionHelpers.js";

/**
 * Helpers for logging
 * @type {object}
 * @name debugLog
 * @property {function} debugLog.isVisible Is the JQLLog box visible?
 * @property {function} debugLog.on Activate logging for JQL.
 * @property {function} debugLog.off Deactivate logging for JQL.
 * @property {function} debugLog.remove Deactivate logging for JQL and remove <code>div#logBox</code>.
 * @property {function} debugLog.hide Hide the JQLLog box.
 * @property {function} debugLog.show Show the JQLLog box.
 * @property {function} debugLog.toConsole Log to console
 *  (see <a href="#.debugLog%255BtoConsole%255D">debugLog[toConsole]</a>).
 * @property {function} debugLog.reversed Log top to bottom or latest first
 *  (see <a href="#.debugLog%255Breversed%255D">debugLog[reversed]</a>).
 * @property {function} debugLog.clear the log box.
 * @property {boolean} debugLog.isOn (getter) is logging on?
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
   * Log everything to thje browser console
   * <br>Exposed as: <code>debugLog.toConsole</code>
   * <br><b>Note</b>: this possibly destroys an alreay created
   * <code>div#logBox</code> in the document if set to true.
   * @static
   * @method debugLog[toConsole]
   * @param console {boolean} log to browser console (true) or not (false, default)
   */
  toConsole(console = false) {
    log2Console = console;
    useLogging = console;
    console && logBox && logBox.parentNode.remove();
  },
  remove: () => {
    useLogging = false;
    document.querySelector(`#logBox`).remove();
  },
  hide: () => logBox && logBox.parentNode.classList.remove(`visible`),
  show: () => logBox && logBox.parentNode.classList.add(`visible`),
  /**
   * Change direction of log entries
   * <br>Exposed as: <code>debugLog.reversed</code>
   * @static
   * @method debugLog[reversed]
   * @param reverse {boolean} latest last (false) or latest first (true) (default true)
   */
  reversed(reverse = true) {
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

let stylingDefault4Log = {
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
  "#logBox #jql_logger": {
    lineHeight: `1.4em`,
    fontFamily: `consolas, monospace`,
  }
};
let useLogging = false;
let log2Console = false;
let reverseLogging = true;
let logBox = undefined;
/**
 * Add style classes for the JQLLog box to a custom css style element.
 * @param styles {Object} style rules Object, e.g. <code>&#123;margin: `0`, color: `green`&#125;</code>.
 * Default styles are in <code>stylingDefault4Log</code>
 * header of the document in which JQL is used). Default is 'JQLCustomCSS'.
 */
const setStyling4Log = (styles = stylingDefault4Log) =>
  Object.entries(styles).forEach(([selector, style]) => setStyle(selector, style, customStylesheet.id));

let useHtml = false;

const createLogElement = () => {
  setStyling4Log();
  const jql_logger_element = useHtml ? `div` : `pre`;
  const loggingFieldSet = `
    <div id="logBox">
      <div class="legend">
        <div></div>
      </div>
      <${jql_logger_element} id="jql_logger"></${jql_logger_element}>
    </div>`;
  element2DOM(createElementFromHtmlString(loggingFieldSet), undefined, insertPositions.AfterBegin);
  return document.querySelector(`#jql_logger`);
};

const decodeForConsole = something => something.constructor === String &&
  Object.assign(document.createElement(`textarea`), {innerHTML: something}).textContent ||
  something;

/**
 * Create JQLLog entry/entries, preceded with the time of logging (millisecond granularity).
 * <br>If the local [useLogging] boolean is false, nothing is logged
 * <br> in JQL exposed as <code>JQL.log</code>
 * @param args {...(string|Object)} string(s) or Object(s) to print in the JQLLog box
 * <br><b>Note</b> Objects are converted to JSON representation
 */
const JQLLog = (...args) => {
    if (!useLogging) { return; }
    if (!log2Console && !logBox) {
      createLogElement();
    }
    const logLine = arg => `${arg instanceof Object ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => log2Console
      ? console.log(decodeForConsole(arg))
      : logBox.insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `${time()} ${logLine(arg.replace(/\n/g, `<br>`))}`)
    );
};

const setStylingId4Log = id => defaultStylingId = id;
export { JQLLog, debugLog, setStyling4Log };