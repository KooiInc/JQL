// noinspection JSValidateJSDoc

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
 */
let defaultStyling = {
  "#logBox": {
    minWidth: 0,
    maxWidth: 0,
    minHeight: 0,
    maxHeight: 0,
    opacity: 0,
    border: `none`,
    padding: 0,
    overflow: `hidden`,
    transition: `all 1s`,
    position: `fixed`,
  },
  "#logBox.visible": {
    backgroundColor: `white`,
    position: `relative`,
    zIndex: 5,
    opacity: 1,
    border: `1px dotted rgb(153, 153, 153)`,
    minWidth: `97vw`,
    minHeight: `20vh`,
    maxWidth: `97vw`,
    overflow: `auto`,
    maxHeight: `20vh`,
    margin: `1rem auto auto`,
    padding: `0 8px 19px 8px`,
  },
  "#logBox legend": {
    textAlign: `center`,
    backgroundColor: `rgba(119, 119, 119, 1.0)`,
    padding: `2px 10px`,
    color: `rgba(255, 255, 255, 1.0)`,
    font: `normal 12px/15px verdana, arial`,
    boxShadow: `2px 1px 10px #777`,
    borderRadius: `4px`,
  },
  "#logBox legend:before": {
    content: `'JQL Logging'`,
  },
};
let defaultStylingId = `JQLCustomCSS`;
let useLogging = false;
let log2Console = false;
let reverseLogging = true;
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
  isVisible() {
    const logBox = document.querySelector(`#logBox`);
    return logBox && isVisible(logBox);
  },
  on() {
    useLogging = true;
    document.querySelector(`#logBox`).classList.add(`visible`);
    JQLLog(`Logging started`);
  },
  off() {
    JQLLog(`Logging stopped`);
    document.querySelector(`#logBox`).classList.remove(`visible`);
    useLogging = false;
  },
  toConsole(yes) {
    log2Console = yes;
    if (yes) {
      document.querySelector(`#logBox`).classList.remove(`visible`);
      useLogging = false;
    }
  },
  hide() {
    const logBox = document.querySelector(`#logBox`);
    if (logBox) {
      document.querySelector(`#logBox`).classList.remove(`visible`);
    }
  },
  show() {
    const logBox = document.querySelector(`#logBox`);
    if (logBox) {
      document.querySelector(`#logBox`).classList.add(`visible`);
    }
  },
  reversed(reverse) {
    reverseLogging = reverse;
  },
  clear() {
    document.querySelector(`#logBox #jql_logger`).textContent = ``;
  }
};

const createLogElement = () => {
  setStyling4Log();
  const loggingFieldSet = `
    <fieldset id="logBox">
      <legend></legend>
      <${useHtml ? `div` : `pre`} id="jql_logger"></pre>
    </fieldset>`;
  element2DOM(createElementFromHtmlString(loggingFieldSet), document.body, insertPositions.BeforeBegin);
  return document.querySelector(`#jql_logger`);
};

const logBox = document.querySelector("#jql_logger") || createLogElement();

/**
 * Create JQLLog entry/entries, preceded with the time of logging (millisecond granularity).
 * <br>If the local [useLogging] boolean is false, nothing is logged
 * <br> in JQL exposed as <code>JQL.log</code>
 * @param args {...(string|Object)} string(s) or Object(s) to print in the JQLLog box
 * * <br><b>Note</b> Objects are converted to JSON representation
 */
const JQLLog = (...args) => {
    if (!useLogging) { return; }
    const logLine = arg => `${arg instanceof Object ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => 
      logBox.insertAdjacentHTML(
        reverseLogging ? `afterbegin` : `beforeend`,
        `${time()} ${logLine(arg)}`)
    );
};

const setStylingId4Log = id => defaultStylingId = id;
export { JQLLog, debugLog, setStylingId4Log, setStyling4Log };