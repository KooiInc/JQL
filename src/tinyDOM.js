import {
  default as IS,
  maybe,
} from "https://cdn.jsdelivr.net/gh/KooiInc/typeofAnything/typeofany.module.min.js";
export default ( function tagProxyFactory() {
  const tinyDOMProxyGetter = { get(obj, key) {
    const tag = String(key)?.toLowerCase();
    switch(true) {
      case tag in obj: return obj[tag];
      case validateTag(tag): return (obj[tag] = tag2FN(key)) && obj[tag];
      default: return createErrorElementFN(obj, tag, key);
    }
  } };
  return new Proxy({}, tinyDOMProxyGetter); }
)();

const converts = {html: `innerHTML`, text: `textContent`,  class: `className`};

function createErrorElementFN(obj, tag, key) {
  obj[tag] = () => createElement(`b`, {style:`color:red`,text:`'${key}' is not a valid HTML-tag`});
  return obj[tag];
}

function validateTag(name) {
  return isComment(name) || IS(createElement(name), {isTypes: [HTMLElement, CharacterData], notTypes: HTMLUnknownElement});
}

function processNext(root, argument, tagName) {
  return maybe({
    trial: _ => containsHTML(argument) ? root.insertAdjacentHTML(`beforeend`, argument) : root.append(argument),
    whenError: err => console.info(`${tagName} not created, reason\n`, err)
  });
}

function tag2FN(tagName) {
  return (initial, ...args) => tagFN(tagName, initial, ...args);
}

function tagFN(tagName, initial, ...nested) {
  const elem = retrieveElementFromInitial(initial, tagName);
  nested?.forEach(arg => processNext(elem, arg, tagName));
  return elem;
}

function cleanupComment(initial) {
  return IS(initial, {isTypes: Object, notTypes: Array})
    ? initial?.text ?? initial?.textContent ?? `` : String(initial);
}

function retrieveElementFromInitial(initial, tag) {
  initial = isComment(tag) ? cleanupComment(initial) : initial;
  
  switch(true) {
    case IS(initial, String):
      return createElement(tag, containsHTML(initial, tag) ? {html: initial} : {text: initial});
    case IS(initial, HTMLElement): return createElementAndAppend(tag, initial);
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

function isComment(tag) { return /comment/i.test(tag); }

function createElementAndAppend(tag, element2Append) {
  const elem = createElement(tag);
  elem.append(element2Append);
  return elem;
}

function createElement(tagName, props = {}) {
  const data = Object.entries(structuredClone(props?.data || {}));
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    cleanupProps( IS(props, {isTypes: Object, notTypes: Array, defaultValue: {}})) );
  data.length && data.forEach(([key, value]) => elem.dataset[key] = value);
  return elem;
}

function containsHTML(str, tag) {
  return !isComment(tag) && str.constructor === String && /<.*>|&[#|0-9|a-z]+[^;];/i.test(str);
}