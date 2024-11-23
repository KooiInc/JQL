import {
   default as IS,
   maybe,
 } from "../typeofAnything/typeofany.module.js";
export default tinyDOM();
const converts = { html: `innerHTML`, text: `textContent`,  class: `className` };

function tinyDOM() {
  const tinyDOMProxyGetter = { get(obj, key) {
      const tag = String(key)?.toLowerCase();
      switch(true) {
        case tag in obj: return obj[tag];
        case validateTag(tag): return createTagFunctionProperty(obj, tag, key);
        default: return createTagFunctionProperty(obj, tag, key, true);
      } } };
  return new Proxy({}, tinyDOMProxyGetter);
}

function createTagFunctionProperty(obj, tag, key, isError = false) {
  Object.defineProperty(obj, tag, { get() { return isError ? _ => errorElement(key) : tag2FN(tag); } } );
  return obj[tag];
}

function processNext(root, argument, tagName) {
  return maybe({
    trial: _ => containsHTML(argument) ? root.insertAdjacentHTML(`beforeend`, argument) : root.append(argument),
    whenError: err => console.info(`${tagName} not created, reason\n`, err)
  });
}

function tagFN(tagName, initial, ...nested) {
  const elem = retrieveElementFromInitial(initial, tagName);
  nested?.forEach(arg => processNext(elem, arg, tagName));
  return elem;
}

function retrieveElementFromInitial(initial, tag) {
  initial = isComment(tag) ? cleanupComment(initial) : initial;
  
  switch(true) {
    case IS(initial, String): return createElement(tag, containsHTML(initial, tag) ? {html: initial} : {text: initial});
    case IS(initial, Node): return createElementAndAppend(tag, initial);
    default: return createElement(tag, initial);
  }
}

function cleanupProps(props) {
  delete props.data;
  if ( Object.keys(props).length < 1 ) { return props; }
  
  Object.keys(props).forEach( key => {
    const keyCI = key.toLowerCase();
    keyCI in converts && (props[converts[keyCI]] = props[key]) && delete props[key]; } );
  return props;
}

function createElementAndAppend(tag, element2Append) {
  const elem = createElement(tag);
  elem.append(element2Append);
  return elem;
}

function createElement(tagName, props = {}) {
  const data = Object.entries(props?.data ?? {});
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    cleanupProps( IS(props, {isTypes: Object, notTypes: Array, defaultValue: {}})) );
  data.length && data.forEach(([key, value]) => elem.dataset[key] = value);
  return elem;
}

function cleanupComment(initial) { return isRealObject(initial) ? initial?.text ?? initial?.textContent ?? `` : String(initial); }
function errorElement(key) { return createElement(`b`, {style:`color:red`,text:`'${key}' is not a valid HTML-tag`}); }
function containsHTML(str, tag) { return !isComment(tag) && IS(str, String) && /<.*>|&[#|0-9a-z]+[^;];/i.test(str); }
function isRealObject(someObject) { return IS(someObject, {isTypes: Object, notTypes: [Array, null, NaN, Proxy]}) }
function isComment(tag) { return /comment/i.test(tag); }
function validateTag(name) { return !IS(createElement(name), HTMLUnknownElement); }
function tag2FN(tagName) { return (initial, ...args) => tagFN(tagName, initial, ...args); }