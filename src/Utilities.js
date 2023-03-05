const characters4RandomString = [...Array(26)]
  .map((x, i) => String.fromCharCode(i + 65))
  .concat([...Array(26)].map((x, i) => String.fromCharCode(i + 97)))
  .concat([...Array(10)].map((x, i) => `${i}`));
const invalid = `Invalid parameter(s)`;
const pad0 = (nr, n=2) => `${nr}`.padStart(n, `0`);
const ISOneOf = (obj, ...params) => !!params.find( param => IS(obj, param) );
const randomNr = (max, min = 0) => {
  [max, min] = [Math.floor(max), min = Math.ceil(min)];
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
// ---
const truncateHtmlStr = (str, maxLength = 120) => str.trim()
  .slice(0, maxLength)
  .replace(/>\s+</g, `><`)
  .replace(/</g, `&lt;`)
  .replace(/\s{2,}/g, ` `)
  .replace(/\n/g, `\\n`) + (str.length > maxLength ? ` &hellip;` : ``).trim();
const toDashedNotation = str2Convert =>str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
const IS = (obj, ...shouldBe) => {
  if (shouldBe.length > 1) { return ISOneOf(obj, ...shouldBe); }
  shouldBe = shouldBe.shift();
  const self = obj === 0 ? Number : obj === `` ? String : !obj ? {name: invalid} :
    Object.getPrototypeOf(obj)?.constructor;
  return shouldBe ? shouldBe === self?.__proto__ || shouldBe === self : self?.name;
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

export {
  IS,
  randomString,
  toDashedNotation,
  truncateHtmlStr,
  truncate2SingleStr,
  logTime,
  hex2RGBA,
};