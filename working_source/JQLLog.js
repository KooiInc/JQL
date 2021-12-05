// noinspection JSAnnotator

/**
 * A small module for logging in a fixed positioned JQLLog box
 * <br>Every line logged is preceded by the time it is logged (granularity: milliseconds)
 * The styling of the logbox happens via a <code>&lt;style></code> element, added to the
 * header of the enclosing document.
 * @module JQL/JQLLog
 */
import {createElementFromHtmlString, element2DOM, insertPositions} from "./DOM.js";
import {setStyle, customStylesheet} from "./Styling.js";
import {time, isVisible} from "./JQLExtensionHelpers.js";
/**
 * Some utility methods for logging
 * @inner {Object.<key, Function|boolean>} debugLog
 * @property {function} debugLog.isVisible Is the JQLLog box visible?
 * @property {function} debugLog.on Activate logging for JQL.
 * @property {function} debugLog.off Deactivate logging for JQL.
 * @property {function} debugLog.remove Deactivate logging for JQL and remove <code>div#logBox</code>.
 * @property {function} debugLog.hide Hide the JQLLog box.
 * @property {function} debugLog.show Show the JQLLog box.
 * @property {function} debugLog.toConsole Log to console.
 * @property {function} debugLog.reversed Log top to bottom or latest first.
 * @property {function} debugLog.clear the log box.
 * @property {boolean} debugLog.isOn (getter) is logging on?
 */
const debugLog = {
  get isOn() { return useLogging; },
  isVisible: () => isVisible(logBox()),
  on() {
    useLogging = true;
    if (!log2Console) {
      const box = logBox() || createLogElement();
      box?.parentNode["classList"].add(`visible`);
    }
    Log(`Logging started (to ${log2Console ? `console` : `document`})`);
  },
  off() {
    if (logBox()) {
      Log(`Logging stopped`);
      logBox()?.parentNode.classList.remove(`visible`);
    }
    useLogging = false;
  },
  /**
   * Log everything to the browser console
   * <br>Exposed as: <code>debugLog.toConsole</code>
   * <br><b>Note</b>: this possibly destroys an alreay created
   * <code>div#logBox</code> in the document if set to true.
   * @memberof module:JQL/JQLLog
   * @param console {boolean} log to browser console (true) or not (false, default)
   */
  toConsole(console = false) {
    log2Console = console;
    useLogging = console;
    console && document.querySelector(`#logBox`)?.remove();
  },
  remove: () => {
    useLogging = false;
    document.querySelector(`#logBox`).remove();
  },
  hide: () => logBox()?.parentNode.classList.remove(`visible`),
  show: () => logBox()?.parentNode.classList.add(`visible`),
  /**
   * Change direction of log entries
   * <br>Exposed as: <code>debugLog.reversed</code>
   * @memberof module:JQL/JQLLog
   * @param reverse {boolean} latest last (false) or latest first (true) (default true)
   */
  reversed(reverse = true) {
    reverseLogging = reverse;
    Log(`Reverse logging reset: now logging ${
      reverse ? `bottom to top (latest first)` : `top to bottom (latest last)`}`);
  },
  clear() {
    const box = logBox();
    box && (box.textContent = ``);
    Log(`Cleared`);
  }
};

/**
 * The default styling to use for the logbox. This is used by [setStyling4Log]{@link module:JQL/JQLLog~setStyling4Log}.
 * @const {Object.<string, Object.<string, string|number>>} stylingDefault4Log
 * @memberof module:JQL/JQLLog
 */
let stylingDefault4Log = {
  "#logBox": {
    minWidth: `0px`,
    maxWidth: `0px`,
    minHeight: `0px`,
    maxHeight: `0px`,
    width: `0`,
    height: `0`,
    zIndex: -1,
    border: `none`,
    padding: `0px`,
    overflow: `hidden`,
    transition: `all 0.3s ease`,
    position: `fixed`,
  },
  "#logBox.visible": {
    backgroundColor: `rgb(255, 255, 224)`,
    zIndex: 1,
    position: `static`,
    border: `1px dotted rgb(153, 153, 153)`,
    maxWidth: `33vw`,
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
  "@media screen and (min-width: 320px) and (max-width: 1024px)": {
    mediaSelectors: {
      "#logBox.visible": {
        maxWidth: `90vw`,
        width: `90vw`,
        resize: `none` },
    }
  },
  "#logBox .legend": {
    textAlign: `center`,
    position: `absolute`,
    marginTop: `-1em`,
    width: `inherit`,
    maxWidth: `inherit`,
  },
  "#logBox .legend div": {
    textAlign: `center`,
    display: `inline-block`,
    maxWidth: `inherit`,
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
    marginTop: `0.7rem`,
    lineHeight: `1.4em`,
    fontFamily: `consolas, monospace`,
    whiteSpace: `pre-wrap`,
    maxWidth: `inherit`,
  }
};
let useLogging = false;
let log2Console = false;
let reverseLogging = true;
let logBox = () => document.querySelector(`#jql_logger`);

/**
 * Add style classes for the JQLLog box to a custom css style element.
 * @param styles {Object} style rules Object, e.g. <code>&#123;margin: `0`, color: `green`&#125;</code>.
 * Default styles are in <code>stylingDefault4Log</code>.
 */
const setStyling4Log = (styles = stylingDefault4Log) =>
  Object.entries(styles).forEach(([selector, style]) => setStyle(selector, style, customStylesheet.id));

let useHtml = true;

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
const Log = (...args) => {
    if (!useLogging) { return; }
    if (!log2Console && !logBox()) {
      createLogElement();
    }
    const logLine = arg => `${arg instanceof Object ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => log2Console
      ? console.log(decodeForConsole(arg))
      : logBox().insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `${time()} ${logLine(arg.replace(/\n/g, `<br>`))}`)
    );
};

export { Log, debugLog, setStyling4Log };