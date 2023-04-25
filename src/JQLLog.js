import jql from "../index.js";
import {createElementFromHtmlString, element2DOM, insertPositions} from "./DOM.js";
import {IS, logTime,} from "./JQLExtensionHelpers.js";
import {logStyling} from "./EmbedResources.js";
let logSystem = false;
let useLogging = false;
let log2Console = true;
let reverseLogging = false;
let useHtml = true;
let editLogRule;
const logBoxId = `#jql_logger`;

const setStyling4Log = setStyle => { logStyling?.forEach(selector => setStyle(selector)); };
const createLogElement = () => {
  if (logStyling) {
    setStyling4Log(editLogRule);
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
    editLogRule = jql.createStyle(`JQLLogCSS`);
    if (!log2Console && !jql.node(`#jql_logger`)) {
      editLogRule = jql.createStyle(`JQLLogCSS`);
      createLogElement();
    }
    const logLine = arg => `${IS(arg, Object) ? JSON.stringify(arg, null, 2) : arg}\n`;
    args.forEach( arg => log2Console
      ? console.info(`${logTime()} ✔ ${decodeForConsole(arg)}`)
      : jql.node(`#jql_logger`).insertAdjacentHTML(
          reverseLogging ? `afterbegin` : `beforeend`,
          `<div class="entry">${logTime()} ${logLine(arg.replace(/\n/g, `<br>`))}</div>`)
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
const debugLog = {
  isOn: () => useLogging,
  isVisible: () => jql(`#jql_logger`).is(`visible`),
  on: () => {
    logActive.on();
    setSystemLog.on();
    if (!log2Console) {
      const box = jql.node(logBoxId) || createLogElement();
      box?.parentNode["classList"].add(`visible`);
    }
    Log(`Debug logging started. Every call to [jql instance] is logged`);
    return debugLog;
  },
  off: () => {
    const logBox = jql(logBoxId);
    if (!logBox.isEmpty) {
      setSystemLog.off();
      Log(`Debug logging stopped`);
      logBox.parent.removeClass(`visible`);
    }
    logActive.off();
    return debugLog;
  },
  toConsole: {
    on: () => {
      log2Console = true;
      Log(`Started logging to console`);
      return debugLog;
    },
    off() {
      Log(`Stopped logging to console`);
      log2Console = false;
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
    jql(logBoxId)?.parent?.removeClass(`visible`);
    return debugLog;
  },
  show: () => {
    jql(logBoxId)?.parent?.addClass(`visible`);
    return debugLog;
  },
  reversed: {
    on: () => {
      reverseLogging = true;
      Log(`Reverse logging set: now logging bottom to top (latest first)`);
      jql(`#logBox .legend`).addClass(`reversed`);
      return debugLog;
    },
    off: () => {
      reverseLogging = false;
      jql(`#logBox .legend`).removeClass(`reversed`);
      Log(`Reverse logging reset: now logging chronological (latest last)`);
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