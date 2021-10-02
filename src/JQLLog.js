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
    border: `1px dotted rgb(153, 153, 153)`,
    height: `25vh`,
    width: `90vw`,
    overflow: `auto`,
    zIndex: 5,
    display: `none`,
  },
  "#logBox.visible": {
    display: `initial`,
  },
  "#logBox legend": {
    textAlign: `center`,
    backgroundColor: `rgb(119, 119, 119)`,
    padding: `2px 5px`,
    marginTop: `-0.8rem`,
    marginBottom: `-0.5rem`,
    left: `50%`,
    right: `50%`,
    color: `white`,
    font: `normal 12px/15px verdana, arial`,
  },
};
let defaultStylingId = `JQLCustomCSS`;
let useLogging = false;
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
 */
const debugLog = {
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
};

const createLogElement = () => {
  const loggingFieldSet = `
          <fieldset id="logBox">
            <legend>Logging</legend>
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
        `afterbegin`,
        `${time()} ${logLine(arg)}`)
    );
};

const setStylingId4Log = id => defaultStylingId = id;
export { JQLLog, debugLog, setStylingId4Log, setStyling4Log };