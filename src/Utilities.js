import jql from "../index.js";
const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const invalid = `Invalid parameter(s)`;
const pad0 = (nr, n=2) => `${nr}`.padStart(n, `0`);
const ISOneOf = (obj, ...params) => !!params.find( param => IS(obj, param) );
const randomNr = (max, min = 0) => {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( ([...crypto.getRandomValues(new Uint32Array(1))].shift() / 2 ** 32 ) * (max - min + 1) + min );
};
const shuffle = array => {
  let i = array.length;
  while (i--) {
    const ri = randomNr(i);
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
};
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};
const truncateHtmlStr = (str, maxLength = 120) => `${str}`.trim()
  .slice(0, maxLength)
  .replace(/>\s+</g, `><`)
  .replace(/</g, `&lt;`)
  .replace(/\s{2,}/g, ` `)
  .replace(/\n/g, `\\n`) + (str.length > maxLength ? ` &hellip;` : ``).trim();
const toDashedNotation = str2Convert =>str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
const ucFirst = ([first, ...theRest]) => `${first.toUpperCase()}${theRest.join(``)}`;
const toCamelcase = str2Convert =>
  IS(str2Convert, String) ? str2Convert.toLowerCase()
    .split(`-`)
    .map( (str, i) => i && `${ucFirst(str)}` || str)
    .join(``) : str2Convert;
const IS = (obj, ...shouldBe) => {
  const ISOneOf = (obj, ...params) => !!params.find( param => IS(obj, param) );
  const checkNaN = thing => `${thing}` === `NaN`;
  if (shouldBe.length > 1) { return ISOneOf(obj, ...shouldBe); }
  shouldBe = shouldBe.length > 0 && shouldBe.shift();

  // is nothing stuff
  const shouldBeNaN = `${shouldBe}` === `NaN`;
  if (shouldBeNaN) { return checkNaN(obj); }
  const isNothing = obj === null || obj === undefined;
  const shouldBeNothing = /null|undefined/.test(`${shouldBe}`);
  if (isNothing && !shouldBeNothing && shouldBe) { return false; }
  if (isNothing && !shouldBeNothing) { return `${obj}`; }
  if (isNothing && shouldBeNothing) { return (`${obj}` === `${shouldBe}`); }
  // end is nothing stuff

  // boolean stuff
  if (obj === false && shouldBe === Boolean) { return true; }
  if (obj === false && !shouldBe) { return `Boolean`; }
  // end boolean stuff

  const self = obj === 0 ? Number : obj === `` ? String : !obj ? {name: obj.toString()} :
    Object.getPrototypeOf(obj)?.constructor;
  return shouldBe ? !!(shouldBe === self?.__proto__ || shouldBe === self || shouldBe.toString === self?.name)
    : self?.name;
};
const randomString = () => `_${shuffle(characters4RandomString).slice(0, 8).join(``)}`;
const truncate2SingleStr = (str, maxLength = 120) =>
  truncateHtmlStr(str, maxLength).replace(/&lt;/g, `<`);
const logTime = () => ((d) =>
  `[${pad0(d.getHours())}:${pad0(d.getMinutes())}:${
    pad0(d.getSeconds())}.${pad0(d.getMilliseconds(), 3)}]`)(new Date());
const hex2RGBA = function (hex, opacity = 100) {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity / 100}` : ""})`;
};
const escHtml = html => html.replace(/</g, `&lt;`);

function ExamineElementFeatureFactory() {
  const isVisible = function(el) {
    if (!el) { return undefined; }
    const elStyle = el.style;
    const computedStyle = getComputedStyle(el);
    const invisible = [elStyle.visibility, computedStyle.visibility].includes("hidden");
    const noDisplay = [elStyle.display, computedStyle.display].includes("none");
    const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0
      || el.offsetLeft > document.body.offsetWidth;
    const noOpacity = +computedStyle.opacity === 0 || +(elStyle.opacity || 1) === 0;
    return !(offscreen || noOpacity || noDisplay || invisible);
  };
  const isWritable = function(elem) {
    return !!jql.nodes(`:is(:read-write)`, elem.parentNode).find(el => el === elem);
  };
  const isModal = function(elem) {
    return !!jql.nodes(`:is(:modal)`, elem.parentNode).find(el => el === elem);
  };
  const notApplicable = `n/a`;
  const noElements = { writable: notApplicable, modal: notApplicable, empty: true, open: notApplicable, visible: notApplicable, };

  return self => {
    const firstElem = self[0];
    return firstElem ? {
      get writable() {
        return isWritable(firstElem);
      },
      get modal() {
        return isModal(firstElem);
      },
      get open() {
        return firstElem.open;
      },
      get visible() {
        return isVisible(firstElem);
      },
      get disabled() {
        return firstElem.hasAttribute("readonly") || firstElem.hasAttribute("disabled")
      },
      get empty() {
        return false;
      },
      get virtual() {
        return self.isVirtual;
      }
    } : noElements;
  };
}

export {
  IS,
  randomString,
  toDashedNotation,
  toCamelcase,
  truncateHtmlStr,
  truncate2SingleStr,
  logTime,
  randomNr,
  hex2RGBA,
  escHtml,
  ExamineElementFeatureFactory,
};