import jql from "../index.js";
import {createElementFromHtmlString, element2DOM, insertPositions} from "./DOM.js";
import {IS, logTime, isVisible} from "./JQLExtensionHelpers.js";
import {logStyling} from "./EmbedResources.js";
let logSystem = false;
let useLogging = false;
let log2Console = true;
let reverseLogging = false;
let useHtml = true;
const logBoxId = `#jql_logger`;
const setStyling4Log = setStyle => { logStyling?.forEach(selector => setStyle(selector)); };
const createLogElement = () => {
  if (logStyling) {
    setStyling4Log(jql.createStyle(`JQLLogCSS`));
  }
  const jql_logger_element_name = useHtml ? `div` : `pre`;
  const loggingFieldSet = `<div id="logBox"><div class="legend"><div></div></div><${
    jql_logger_element_name} id="jql_logger"></${jql_logger_element_name}></div>`;
  element2DOM(createElementFromHtmlString(loggingFieldSet), undefined, insertPositions.AfterBegin);
  return jql.node(logBoxId);
};
const decodeForConsole = something => IS(something, String) &&
  Object.assign(document.createElement(`textarea`), {innerHTML: something}).textContent ||
  something;
const Log = (...args) => {
    if (!useLogging) { return; }
    if (!log2Console && !jql.node(`#jql_logger`)) {
      createLogElement();
    }
    const logLine = arg => `${IS(arg, Object) ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => log2Console
      ? console.log(decodeForConsole(arg))
      : jql.node(`#jql_logger`).insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `${logTime()} ${logLine(arg.replace(/\n/g, `<br>`))}`)
    );
};
const logActive = {
  on() {  useLogging = true; Log(`Logging activated`); },
  off() { useLogging = false; console.log(`Logging deactivated`) },
}
const setSystemLog = {
  on() { logSystem = true; },
  off() { logSystem = false; },
};
const systemLog = (...logTxt) => logSystem && Log(...logTxt);
let debugLog = {};
debugLog = {...debugLog,
  isOn: () => useLogging,
  isVisible: () => jql(`#jql_logger`).is(`:visible`), //isVisible(logBox()),
  on: () => {
    logActive.on();
    setSystemLog.on();
    if (!log2Console) {
      const box = jql.node(logBoxId) || createLogElement();
      box?.parentNode["classList"].add(`visible`);
    }
    Log(`Debug logging started. Every call to [jql instance] is logged (${
      reverseLogging ? `ascending: latest last` : `descending: latest first`}).`);
    return debugLog;
  },
  off: () => {
    const logBox = jql(logBoxId);
    if (!logBox.isEmpty) {
      setSystemLog.off();
      Log(`Debug logging stopped`);
      logBox.parent().removeClass(`visible`);
    }
    logActive.off();
    return debugLog;
  },
  toConsole: {
    on: () => {
      log2Console = true;
      Log(`Debug logging to console activated`);
      return debugLog;
    },
    off() {
      log2Console = false;
      Log(`Debug logging to document activated`);
      return debugLog;
    }
  },
  remove: () => {
    logActive.off();
    setSystemLog.off();
    jql(logBoxId)?.remove();
    console?.clear();
    console.log(`${logTime()} logging completely disabled and all entries removed`);
    return debugLog;
  },
  log: (...args) => {
    Log(...args);
    return debugLog;
  },
  hide: () => {
    jql(logBoxId)?.parent()?.removeClass(`visible`);
    return debugLog;
  },
  show: () => {
    jql(logBoxId)?.parent()?.addClass(`visible`);
    return debugLog;
  },
  reversed: {
    on: () => {
      reverseLogging = true;
      Log(`Reverse logging reset: now logging bottom to top (latest first)`);
      return debugLog;
    },
    off: () => {
      reverseLogging = false;
      Log(`Reverse logging reset: now logging top to bottom (latest last)`);
      return debugLog;
    },
  },
  clear: () => {
    jql(logBoxId)?.text(``);
    console.clear();
    Log(`Logging cleared`);
    return debugLog;
  }
};

export { Log, debugLog, systemLog };