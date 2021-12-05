import {createElementFromHtmlString, element2DOM, insertPositions} from "./DOM.js";
import {setStyle, customStylesheet} from "./Styling.js";
import {time, isVisible} from "./JQLExtensionHelpers.js";
const debugLog = {
  get isOn() { return useLogging; },
  isVisible: () => logBox && isVisible(logBox),
  on() {
    useLogging = true;
    if (!log2Console) {
      logBox = document.querySelector("#jql_logger") || createLogElement();
      logBox.parentNode["classList"].add(`visible`);
    }
    Log(`Logging started (to ${log2Console ? `console` : `document`})`);
  },
  off() {
    if (logBox) {
      Log(`Logging stopped`);
      logBox && logBox.parentNode.classList.remove(`visible`);
    }
    useLogging = false;
  },
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
  reversed(reverse = true) {
    reverseLogging = reverse;
    Log(`Reverse logging reset: now logging ${
      reverse ? `bottom to top (latest first)` : `top to bottom (latest last)`}`);
  },
  clear() {
    if (logBox) {
      logBox.textContent = ``;
      Log(`Cleared`);
    }
  }
};

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
let logBox = undefined;

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

const Log = (...args) => {
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

export { Log, debugLog, setStyling4Log };