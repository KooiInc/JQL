// noinspection JSUnusedGlobalSymbols,JSUnresolvedFunction,JSCheckFunctionSignatures,JSUnusedLocalSymbols

/**
 * Helper methods
 * @module Helpers
 */

import {setTagPermission} from "./DOMCleanup.js";
import {createElementFromHtmlString} from "./DOM.js";
const pad0 = (nr, n=2) => `${nr}`.padStart(n, `0`);
const cleanWhitespace = str => str.replace(/\s{2,}/g, " ");
const toZeroPaddedEuropeanDate = val =>
  val.split("/").reverse().map(v => `${v}`.padStart(2, "0")).join("/");
const date2EuropeanDate = date =>
  date.toISOString().split("T").shift().split("-").reverse().map(v => `${v}`.padStart(2, "0")).join("-");
const displayHour = h => `${h}`.padStart(2, `0`) + `:00`;
const throwIf = (assertion = false, message = `Unspecified error`, ErrorType = Error) =>
  assertion && (() => {
    throw new ErrorType(message);
  })();
/**
 * Returns the current time, including milliseconds enclosed in square brackets,
 * e.q. <code>[12:32:34.346]</code>.
 * @returns {string}
 */
const time = () => ((d) => 
  `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
    pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
const Logger = (forceConsole = false) => {
  let logEl;
  if (typeof window === "object" && !forceConsole) {
      logEl = document.querySelector("#JQLLog") || (() => {
        return document.body.insertAdjacentElement(
          Object.assign(document.createElement('pre'), { id: "log" })
        );
      })();
  return (...logLines) => {
      if (logLines.length < 1) {
        logEl.textContent = "";
      } else {
        logLines.forEach(s => logEl.textContent += `${s}\n`);
      }
      logEl.normalize();
    };
  }
};
/**
 * A tagged template function to create a <code>Regexp</code> from
 * multiple lines, with or without comments.
 * @example
 * createRegExp`
 *   ^[\p{L}]              //=> always start with a letter
 *   [\p{L}_\.#\-\d+~=!]+  //=> followed by letters including _ . # - 0-9 ~ = or !
 *   // [...]
 *   ${`gui`}              //=> flags ([g]lobal, case [i]nsensitive, [u]nicode)`
 * // ---
 * // Result: /^[\p{L}][\p{L}_\.#\-\d+~=!]+/giu
 * @param {template} regexStr
 * @param {string }flags
 * @returns {RegExp}
 */
const createRegExp = (regexStr, flags = ``) => new RegExp(
  regexStr.raw[0]
    .split(`\n`)
    .map( line => line.replace(/\/\/.*$/, ``).trim() )
    .join(``), flags );
/**
 * Trunctate a html string (e.g. from <code>[element]outerHTML</code>)
 * to a single line with a maximum length
 * @param str {string} The html string
 * @param maxLength {Number} The length to truncate to (default: 120)
 * @returns {string}
 */
const truncateHtmlStr = (str, maxLength = 120) => str.trim()
  .substr(0, maxLength)
  .replace(/>\s+</g, `><`)
  .replace(/</g, `&lt;`)
  .replace(/\s{2,}/g, ` `)
  .replace(/\n/g, `\\n`) + (str.length > maxLength ? `&hellip;` : ``).trim();

const truncate2SingleStr = (str, maxLength = 120) =>
  truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`)

/**
 * Split up a given time (in milliseconds) to days/hours/minutes/seconds/milliseconds
 * @param milliseconds {Number} The number of milliseconds (e.g. from <code>new Date().getTime()</code>)
 * @returns {{hours: number, seconds: number, minutes: number, days: number, milliSeconds: number}}
 */
const time2Fragments = (milliseconds) => {
  milliseconds = Math.abs(milliseconds);
  let secs = Math.floor(Math.abs(milliseconds) / 1000);
  let mins = Math.floor(secs / 60);
  let hours = Math.floor(mins / 60);
  let days = Math.floor(hours / 24);
  const millisecs = Math.floor(Math.abs(milliseconds)) % 1000;

  return {
    days: days,
    hours: hours % 24,
    minutes: mins % 60,
    seconds: secs % 60,
    milliSeconds: millisecs,
  };
};

/**
 * Generic function to check for duplicates with certain keys
 * within an array of objects
 * @param data {Array} The array
 * @param keys {string[]} The keys to filter on
 * @returns {boolean}
 */
function hasDuplicatesForKeys(data, ...keys) {
  let check = new Set();
  data.forEach( d => check.add( keys.map( k => d[k] ).join(``) ) );
  return [...check].length < data.length;
}

/**
 * Simple even/odd checker
 * @param nr {Number} the input number to check
 * @returns {boolean}
 */
const isEven = nr => !(nr & 1);

const shuffleLuckyNumbers = n => {
  const shuffleFisherYates = (array) => {
    let i = array.length;
    while (i--) {
      const ri = Math.floor(Math.random() * i);
      [array[i], array[ri]] = [array[ri], array[i]];
    }
    return array;
  }
  return shuffleFisherYates([...Array(n)].map((...[, i]) => i+1 <= n ? i+1 : i + 1 - n));
};
// no map or forEach, to keep it (a bit) faster
const parseAllToTemplate = (objects2Parse, intoTemplate, fallback = String.fromCharCode(0)) => {
  let lines = [...Array(objects2Parse.length)];
  for (let i = 0; i < objects2Parse.length; i += 1) {
    lines[i] = parseTemplate(intoTemplate, objects2Parse[i], fallback);
  }
  return lines.join("");
};

const randomStringExtension = () => {
  if (String.getRandom) {
    return;
  }
  const characters = [...Array(26)]
    .map((x, i) => String.fromCharCode(i + 65))
    .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
    .concat([...Array(10)].map((x, i) => `${i}`));
  const getCharacters = excludes =>
    excludes && characters.filter(c => !~excludes.indexOf(c)) || characters;

  String.getRandom = (len = 12, excludes = []) => {
    const chars = getCharacters(excludes);
    return [...Array(len)]
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  };
  // html element-id's can not start with a number
  String.createRandomHtmlElementId = (len = 12, excludes = []) => {
    const charsWithoutNumbers = getCharacters(excludes.concat('0123456789'.split("")));
    const firstChr = charsWithoutNumbers[Math.floor(Math.random() * charsWithoutNumbers.length)];
    return firstChr.concat(String.getRandom(len - 1, excludes));
  };
};

/**
 * Get frequencies for all elements of [arr]
 * If [arr] is not an Array, just returns it
 * @param arr {Array}
 * @returns {Object|Array}
 */
const frequencies = arr =>
  Array.isArray(arr) && arr.reduce((acc, curr) => ({...acc, [curr]: -~acc[curr]}), {}) || arr;

/**
 * Repeat a given string [n] times
 * @param str {string} The string to repeat
 * @param n {Number} The number of time to repeat the string
 * @example
 * console.log(repeat(`-`, 10)); //=> -----------
 * @returns {string}
 */
const repeat = (str, n) => n > 0 ? Array(n).fill(str).join('') : str;
const parseTemplate = (template, valuesMapping, fallback = String.fromCharCode(0)) =>
  template.replace(/{[^}]+}/g, (match) =>
    valuesMapping[match.slice(1, -1)] || fallback || match);
const addCssIfNotAlreadyAdded = (cssId, styleSheetLocation) => {
  const fileOrigin = /^file:/i.test(location.href);
  setTagPermission("link", true);
  if (![...document.styleSheets].find(sheet => sheet.id === cssId)) {
    const cssLink = createElementFromHtmlString(`
        <link id="${cssId}" href="${fileOrigin ? "https:" : ""}${styleSheetLocation}" 
          type="text/css" rel="stylesheet"/>`);
    document.querySelector("head").appendChild(cssLink);
  }
  setTagPermission("link", false);
};

const initDefault = (value, defaultValue, ...includeFalsies) => {
  const empty = value => includeFalsies &&
    includeFalsies.filter(v =>
      value !== undefined && isNaN(value) ? isNaN(v) : v === value).length
      ? false : Boolean(value) === false;
  return empty(value) ? defaultValue : value;
};

/**
 * Convert a camel-cased term to dashed string, e.g. for style rule keys
 * @example
 * toDashedNotation(`marginRight`); //=> `margin-right`
 * toDashedNotation(`borderTopLeftRadius`); //=> `border-top-left-radius`
 * @param str2Convert {string} The (property)string to convert
 * @returns {string}
 */
const toDashedNotation = str2Convert =>
  str2Convert
    .replace(/[A-Z]/g, a => `-${a.toLowerCase()}`)
    .replace(/^-|-$/, ``);

/**
 * Convert a dashed term to camelCased string e.g.
 * @example
 * toUndashedNotation(`margin-right`); //=> `marginRight`
 * toUndashedNotation(`border-top-left-adius`); //=> `borderTopLeftRadius`
 * @param prop {string} The (property)string to convert
 * @returns {string}
 */
const toUndashedNotation = prop => [...prop.toLowerCase()]
  .reduce( (acc, v) => {
    const isDash = v === `-`;
    acc = {...acc, s: acc.s.concat(isDash ? `` : acc.nextUpcase ? v.toUpperCase() : v)};
    acc.nextUpcase = isDash;
    return acc;
  }, {s: '', nextUpcase: false}).s;

/**
 * Is [obj] really an object (and not a <code>Date</code> or <code>Array</code>)?
 * @param obj {Object}
 * @returns {boolean|false|number}
 */
const isObjectAndNotArray = obj =>
  (obj.constructor !== Date &&
    !Array.isArray(obj) && JSON.stringify(obj) === "{}") ||
  obj.constructor !== String && Object.keys(obj).length;

const importAsync = (url, callback) => import(url).then(callback);
const createDeepCloneExtension = () => {
  const isImmutable = val =>
    val === null || val === undefined || [String, Boolean, Number].find(V => val.constructor === V);
  const isObjectAndNotArray = obj =>
    (obj.constructor !== Date && !Array.isArray(obj) && JSON.stringify(obj) === "{}") || Object.keys(obj).length;
  const cloneArr = arr => arr.reduce( (acc, value) =>
    [...acc, isObjectAndNotArray(value) ? cloneObj(value) : value], []);
  const isCyclic = obj => {
    try {
      JSON.stringify(obj);
    } catch(err) {
      return err.message;
    }
    return null;
  };

  function cloneObj(obj) {
    const cyclic = isCyclic(obj);
    return cyclic ? {
        error: `Object clone error: the structure is cyclic and can not be cloned, sorry.`,
        initial: obj } :
      Object.keys(obj).length === 0 ? obj :
        Object.entries(obj)
          .reduce( (acc, [key, value]) => ( {
            ...acc,
            [key]:
              Array.isArray(value)
                ? cloneArr(value) :
                !isImmutable(value) && isObjectAndNotArray(value)
                  ? cloneObj(value)
                  : value && value.constructor
                  ? new value.constructor(value)
                  : value } ),  {} );
  }
  Object.clone = cloneObj;
};

/**
 * <b>Todo</b> use Number.toLocaleString is way simpler, check for edge cases
 * @param number
 * @param locale
 * @returns {*|string}
 */
const groupDigits = (number, locale = "DecimalComma") => {
  const separators = {
    DecimalDot: { thousands: ",", decimal: "." },
    DecimalComma: { thousands: ".", decimal: "," },
  };
  locale = Object.keys(separators).find(v => v === locale) ? locale : "DecimalComma";

  return number.constructor !== Number ? number : (() => {
    const precision = (number, len) => number.toFixed(12).split(".").pop().slice(0, len);
    const separateIntegerPart = numberPart => {
      let n = [...numberPart];
      let i = -3;

      while (n.length + i > 0) {
        n.splice(i, 0, separators[locale].thousands);
        i -= 4;
      }

      return n.join(``);
    };
    const parts = `${number}`
      .split(/[.,]/)
      .reduce((acc, val, i) =>
        ({ ...acc, [i < 1 ? "integer" : "decimal"]: (i < 1 ? val : precision(number, val.length)) }), {});

    return `${separateIntegerPart(parts["integer"])}${
      parts.decimal ? `${separators[locale].decimal}${parts.decimal}` : ``}`;
  })();
};

const curry = fn => {
  const curryFn = (...args1) => args1.length >= fn.length ? fn(...args1) : (...args2) => curryFn(...args1, ...args2);
  return curryFn;
};
const infiniteCurry = (fn, seed) => {
  const reduceValue = (args, seedValue) =>
    args.reduce((acc, a) => fn.call(fn, acc, a), seedValue);
  const next = (...args) =>
    (...x) =>
      !x.length ? reduceValue(args, seed) : next(...args, reduceValue(x, seed));
  return next();
};
const clipBoardFactory = elementId  => {
  return (str = "-1") => {
    const el = (() => {
      const ta = Object.assign(
        document.createElement(`textarea`), {
          id: elementId,
          readonly: true,
          value: str,
          style: `position:absolute;left:-9999px`, }
      );
      document.body.appendChild(ta);
      return ta;
    })();
    el.select();                    // Select the <input> content
    document.execCommand('copy');   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);  // Remove the <input> element
  }
};
const tryParseJson = jsonTrialValue => {
  if (!jsonTrialValue) { return null; }
  try {
    return JSON.parse(jsonTrialValue);
  } catch (err) {
    return jsonTrialValue;
  }
};
/**
 * @typedef storage
 * @description A helper for <code>localStorage</code>.
 * @property get {function} (key:string) retrieve item with [key].
 * @property object {function} see <code>getObject</code>.
 * @property getObject {function} alias for <code>storage.object</code>.
 *  (key:string) retrieve item [key] where value is JSON and return as parsed Object.
 *  <br>If parsing did not succeed (aka, value is not or not valid JSON) this returns the plain value.
 *  @property set {function} (key:string, value: string) create a <code>localStorage</code>
 *  item with [key] and [value].
 *  @property setJSON {function} (key:string, value: Object) create a <code>localStorage</code> item with [key]/
 *  and [value] where value is an Object (and will be converted to JSON).
 *  @property remove {function} (key: string) remove item with key [key] from <code>localStorage</code>.
 *  @property clear {function}: remove evertything from <code>localStorage</code>
 */
const storage = {
  get: key => localStorage.getItem(key),
  object: key => tryParseJson(localStorage.getItem(key)), // backward compatibility
  getObject: key => tryParseJson(localStorage.getItem(key)),
  set: (key, value) => localStorage.setItem(key, value),
  setJson: (key, object) => localStorage.setItem(key, JSON.stringify(object)),
  remove: key => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// see also: https://stackblitz.com/edit/typescript-mmrre8?file=index.ts
const round2NDecimals = (input, decimals = 2, toString = false) => {
  // just return input value if it's not a recognizable number
  if (input === null ||
        input.constructor === Boolean ||
        isNaN(+input)) { return input; }

  const currentNOfDecimals = (String(input).split(".")[1] || ``).length - 1;
  // recurse per decimal if necessary
  const converted = currentNOfDecimals > decimals
    ? round2NDecimals( +( `${Math.round( parseFloat( `${input}e${currentNOfDecimals}` )  )}e-${
        currentNOfDecimals}` ), decimals )
    : +( `${Math.round( parseFloat( `${input}e${decimals}` )  )}e-${decimals}` );

  return toString ? converted.toFixed(decimals) : converted;
};

export {
  cleanWhitespace,
  toZeroPaddedEuropeanDate,
  date2EuropeanDate,
  createRegExp,
  displayHour,
  throwIf,
  Logger,
  time2Fragments,
  parseAllToTemplate,
  parseTemplate,
  randomStringExtension,
  addCssIfNotAlreadyAdded,
  repeat,
  initDefault,
  createDeepCloneExtension,
  groupDigits,
  curry,
  infiniteCurry,
  clipBoardFactory,
  storage,
  tryParseJson,
  round2NDecimals,
  importAsync,
  time,
  isObjectAndNotArray,
  toDashedNotation,
  toUndashedNotation,
  truncateHtmlStr,
  truncate2SingleStr
};
