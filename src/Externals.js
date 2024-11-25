const {IS, maybe} = TOAFactory();
const defaultTinyDOM = tinyDOM();
export { IS, defaultTinyDOM as default };

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

function processNext(root, next, tagName) {
  next = next?.isJQL && next.first() || next;
  return maybe({
    trial: _ => containsHTML(next) ? root.insertAdjacentHTML(`beforeend`, next) : root.append(next),
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
  props = isObjectCheck(props, {});
  const data = Object.entries(props.data ?? {});
  const elem = Object.assign(
    isComment(tagName) ? new Comment() : document.createElement(tagName),
    cleanupProps( props ) );
  data.length && data.forEach(([key, value]) => elem.dataset[key] = value);
  return elem;
}

function isObjectCheck(someObject, defaultValue) {
  return defaultValue
    ? IS(someObject, {isTypes: Object, notTypes: [Array, null, NaN, Proxy], defaultValue})
    : IS(someObject, {isTypes: Object, notTypes: [Array, null, NaN, Proxy]});
}

function cleanupComment(initial) { return isObjectCheck(initial) ? initial?.text ?? initial?.textContent ?? `` : String(initial); }
function errorElement(key) { return createElement(`b`, {style:`color:red`,text:`'${key}' is not a valid HTML-tag`}); }
function containsHTML(str, tag) { return !isComment(tag) && IS(str, String) && /<.*>|&[#|0-9a-z]+[^;];/i.test(str); }
function isComment(tag) { return /comment/i.test(tag); }
function validateTag(name) { return !IS(createElement(name), HTMLUnknownElement); }
function tag2FN(tagName) { return (initial, ...args) => tagFN(tagName, initial, ...args); }

function TOAFactory() {
  Symbol.proxy = Symbol.for(`toa.proxy`);
  Symbol.is = Symbol.for(`toa.is`);
  Symbol.type = Symbol.for(`toa.type`);
  Symbol.any = Symbol.for(`toa.any`);
  addSymbols2Anything();
  const maybe = maybeFactory();
  const [$Wrap, xProxy] = [WrapAnyFactory(), setProxyFactory()];
  xProxy.custom();
  return { IS, maybe, $Wrap, isNothing, xProxy };
  
  function IS(anything, ...shouldBe) {
    if (maybe({trial: _ => `isTypes` in (shouldBe?.[0] ?? {})})) {
      const isTypeObj = shouldBe[0];
      return `defaultValue` in (isTypeObj)
        ? isOrDefault(anything, isTypeObj) : `notTypes` in isTypeObj
          ? isExcept(anything, isTypeObj) : IS(anything, ...[isTypeObj.isTypes].flat());
    }
    
    const input = typeof anything === `symbol` ? Symbol.any : anything;
    return shouldBe.length > 1 ? ISOneOf(input, ...shouldBe) : determineType(anything, ...shouldBe);
  }
  
  function typeOf(anything) {
    return anything?.[Symbol.proxy] ?? IS(anything);
  }
  
  function determineType(input, ...shouldBe) {
    let { noInput, noShouldbe, compareTo, inputCTOR, isNaN, isInfinity, sbFirstIsNothing } = processInput(input, ...shouldBe);
    shouldBe = shouldBe.length && shouldBe[0];
    
    switch(true) {
      case sbFirstIsNothing: return String(input) === String(compareTo);
      case input?.[Symbol.proxy] && noShouldbe: return input[Symbol.proxy];
      case isNaN:  return noShouldbe ? `NaN` : maybe({trial: _ => String(compareTo)}) === String(input);
      case isInfinity:  return noShouldbe ? `Infinity` : maybe({trial: _ => String(compareTo)}) === String(input);
      case noInput: return noShouldbe ? String(input) : String(compareTo) === String(input);
      case inputCTOR === Boolean: return !shouldBe ? `Boolean` : inputCTOR === shouldBe;
      default: return getResult(input, shouldBe, noShouldbe, getMe(input, inputCTOR));
    }
  }
  
  function getMe(input, inputCTOR) {
    return input === 0 ? Number : input === `` ? String : !input ? {name: String(input)} : inputCTOR;
  }
  
  function processInput(input, ...shouldBe) {
    const noShouldbe = shouldBe.length < 1;
    const compareTo = !noShouldbe && shouldBe[0];
    const sbFirstIsNothing = !noShouldbe && isNothing(shouldBe[0]);
    const noInput = input === undefined || input === null;
    const inputCTOR = !noInput && Object.getPrototypeOf(input)?.constructor;
    const isNaN = maybe({trial: _ => String(input)}) === `NaN`;
    const isInfinity = maybe({trial: _ => String(input)}) === `Infinity`;
    return { noInput, noShouldbe, compareTo, inputCTOR, isNaN, isInfinity, sbFirstIsNothing};
  }
  
  function getResult(input, compareWith, noShouldbe, me) {
    if (!noShouldbe && compareWith === input) { return true; }
    if (input?.[Symbol.proxy] && compareWith === Proxy) { return compareWith === Proxy; }
    if (maybe({trial: _ => String(compareWith)}) === `NaN`) { return String(input) === `NaN`; }
    if (input?.[Symbol.toStringTag] && IS(compareWith, String)) {
      return String(compareWith) === input[Symbol.toStringTag];
    }
    
    return compareWith
      ? maybe({ trial: _ => input instanceof compareWith, }) ||
        compareWith === me || compareWith === Object.getPrototypeOf(me) ||
        `${compareWith?.name}` === me?.name
      : input?.[Symbol.toStringTag] && `[object ${input?.[Symbol.toStringTag]}]`|| me?.name || String(me);
    
  }
  
  function ISOneOf(obj, ...params) {
    return params.some(param => IS(obj, param));
  }
  
  function isNothing(maybeNothing, all = false) {
    let nada = maybeNothing === null || maybeNothing === undefined;
    nada = all ? nada || IS(maybeNothing, Infinity) || IS(maybeNothing, NaN) : nada;
    return nada;
  }
  
  function maybeFactory() {
    const tryFn = (maybeFn, maybeError) => maybeFn?.constructor === Function ? maybeFn(maybeError) : undefined;
    return function({trial, whenError = () => undefined} = {}) {
      try { return tryFn(trial) } catch(err) { return tryFn(whenError, err); }
    };
    
  }
  
  function WrapAnyFactory() {
    return function(someObj) {
      return Object.freeze({
        get value() { return someObj; },
        get [Symbol.type]() { return typeOf(someObj); },
        get type() { return typeOf(someObj); },
        [Symbol.is](...args) { return IS(someObj, ...args); },
        is(...args) { return IS(someObj, ...args); }
      });
    }
  }
  
  function isOrDefault(input, { defaultValue, isTypes = [undefined], notTypes } = {}) {
    isTypes = isTypes?.constructor !==  Array ? [isTypes] : isTypes;
    notTypes = notTypes && notTypes?.constructor !== Array ? [notTypes] : [];
    return notTypes.length < 1
      ? IS(input, ...isTypes) ? input : defaultValue
      : isExcept(input, {isTypes, notTypes}) ? input : defaultValue;
  }
  
  function isExcept(input, { isTypes = [undefined], notTypes = [undefined] } = {} ) {
    isTypes =  isTypes?.constructor !== Array ? [isTypes] : isTypes;
    notTypes = notTypes?.constructor !== Array ? [notTypes] : notTypes;
    return IS(input, ...isTypes) && !IS(input, ...notTypes);
  }
  
  function addSymbols2Anything() {
    if (!Object.getOwnPropertyDescriptors(Object.prototype)[Symbol.is]) {
      Object.defineProperties(Object.prototype, {
        [Symbol.type]: { get() { return typeOf(this); }, },
        [Symbol.is]: { value: function (...args) { return IS(this, ...args); }, },
      });
      Object.defineProperties(Object, {
        [Symbol.type]: { value(obj) { return typeOf(obj); }, },
        [Symbol.is]: { value: function (obj, ...args) { return IS(obj, ...args); }, },
      });
    }
  }
  
  function ctor2String(obj) {
    const str = String(Object.getPrototypeOf(obj)?.constructor);
    return str.slice(str.indexOf(`ion`)+3, str.indexOf(`(`)).trim();
  }
  
  function setProxyFactory() {
    const nativeProxy = Proxy;
    return {
      native() {
        Proxy = nativeProxy;
      },
      custom() {
        // adaptation of https://stackoverflow.com/a/53463589
        Proxy = new nativeProxy(nativeProxy, {
          construct(target, args) {
            const proxy = new target(...args);
            proxy[Symbol.proxy] = `Proxy (${ctor2String(args[0])})`;
            return proxy;
          }
        });
      }
    };
  }
}