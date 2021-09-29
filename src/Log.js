// noinspection JSValidateJSDoc

/**
 * Static JQL extension method. A small log library for JQL debugging purposes.
 * @namespace JQL/Log
 */

import {createElementFromHtmlString, } from "./DOM.js";
import setStyle from "./Styling.js";
import {time} from "./Helpers.js";
import {isVisible} from "./ExtensionHelpers.js";

/**
 * defaultStyling is the styling used for a the box used for logging (a <code>HTMLFieldSetElement</code> element).
 * May be overridden by your own styles, but must use the id <code>#logBox</code>.
 * @memberof JQL/Log
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
let useLogging = false;
/**
 * Add style classes for the log box to a custom css style element. Exposed as <code>JQL.setStyling4Log</code>
 * @memberof JQL/Log
 * @param styles {Object} style rules Object, e.g. <code>&#123;margin: `0`, color: `green`&#125;</code>.
 * Default styles are in <code>defaultStyling</code>
 * @param cssId {string} the id of the custom style element (automagically created in the
 * header of the document in which JQL is used). Default is 'JQLCustomCSS'.
 */
const setStyling4Log = (styles = defaultStyling, cssId = `JQLCustomCSS`) => {
  const exists = document.querySelector(`#JQLCustomCSS`);
  // this triggers rename (id) of existing stylesheet
  if (exists) { exists.id = cssId; }
    Object.entries(styles).forEach(([selector, style]) => setStyle(selector, style, cssId));
};

let useHtml = false;

/** @namespace JQL/Log/debugLog */
/**
 * Use logging for debug (set on/off or show/hide the log box), exposed as <code>JQL.debugLog</code>
 * @memberof JQL/debugLog
 */
const debugLog = {
  /**
   * Is the log box visible?
   * @memberof JQL/Log/debugLog
   */
  isVisible() {
    const logBox = document.querySelector(`#logBox`);
    return logBox && isVisible(logBox);
  },
  /**
   * Activate logging for JQL.
   * @memberof JQL/Log/debugLog
   */
  on() {
    useLogging = true;
    document.querySelector(`#logBox`).classList.add(`visible`);
    log(`Logging started`);
  },
  /**
   * Deactivate logging for JQL.
   * @memberof JQL/Log/debugLog
   */
  off() {
    log(`Logging stopped`);
    document.querySelector(`#logBox`).classList.remove(`visible`);
    useLogging = false;
  },
  /**
   * Hide the log box.
   * @memberof JQL/Log/debugLog
   */
  hide() {
    const logBox = document.querySelector(`#logBox`);
    if (logBox) {
      document.querySelector(`#logBox`).classList.remove(`visible`);
    }
  },
  /**
   * Show the log box.
   * @memberof JQL/Log/debugLog
   */
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
  document.body.insertBefore(createElementFromHtmlString(loggingFieldSet, document.body), document.body.childNodes[0]);
  return document.querySelector(`#jql_logger`);
};

const logBox = document.querySelector("#jql_logger") || createLogElement();

/**
 * Create log entry/entries, preceded with the time of logging (millisecond granularity).
 * <br>Exposed as <code>JQL.log</code>
 * <br>If the local [useLogging] boolean is false, nothing is logged
 * @memberof JQL/Log
 * @param args {...(string|Object)} string(s) or Object(s) to print in the log box
 * * <br><b>Note</b> Objects are converted to JSON representation
 */
const log = (...args) => {
    if (!useLogging) { return; }
    const logLine = arg => `${arg instanceof Object ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => 
      logBox.insertAdjacentHTML(
        `afterbegin`,
        `${time()} ${logLine(arg)}`)
    );
};

const logStatus = () => useLogging;
export { log, debugLog, logStatus, setStyling4Log };