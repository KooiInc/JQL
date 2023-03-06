import {createElementFromHtmlString, insertPositions} from "./DOM.js";
import {
  IS,
  hex2RGBA,
  loop,
  addHandlerId,
  isVisible,
  isNode,
  randomString,
  inject2DOMTree } from "./JQLExtensionHelpers.js";
import {ATTRS} from "./EmbedResources.js";
import jql from "../index.js";

const empty = el => el && (el.textContent = "");
const compareCI = (key, compareTo) => key.toLowerCase().trim() === compareTo.trim().toLowerCase();
const setData = (el, keyValuePairs) => {
  el && IS(keyValuePairs, Object) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.dataset[key] = value);
};
const checkProp = prop => ATTRS.html.find(attr => prop === attr);

const css = (el, keyOrKvPairs, value) => {
  const { setStyle } = jql;

  if (value && IS(keyOrKvPairs, String)) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQLCreated`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQLCreated${randomString()}`;
  setStyle(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
};
const assignAttrValues = (/*NODOC*/el, keyValuePairs) => {
  el && Object.entries(keyValuePairs).forEach(([key, value]) => {
    if (key.startsWith(`data`)) {
      setData(el, {[key]: value});
    }

    if (compareCI(key, `class`)) {
      value.split(/\s+/).forEach(v => el.classList.add(`${v}`))
    }

    if (IS(value, String) && checkProp(key)) {
      el[key] = value;
    }
  });
};
const allMethods = {
  straigthLoops: {
    toggleClass: (el, className) => el.classList.toggle(className),
    toggleStyleFragments: (/*NODOC*/ el, keyValuePairs) =>
      el && Object.entries(keyValuePairs).forEach(([key, value]) => {
        if (IS(value, Function)) {
          value = value(el);
        }

        if (/color/i.test(key)) {
          value = value.startsWith(`#`)
            ? hex2RGBA(value)
            : value.replace(/(,|,\s{2,})(\w)/g, (...args) => `, ${args[2]}`);
        }

        el.style[key] = `${el.style[key]}` === `${value}` ? "" : value;
      }),
    removeAttr: (el, name) => el && el.removeAttribute(name),
    toggleAttr: (el, name) => {
      if (el.hasAttribute(name)) {
        if (!el.dataset[`previous${name}`]) {
          el.dataset[`previous${name}`] = el.getAttribute(name);
        }
        return el.removeAttribute(name);
      }

      if (el.dataset[`previous${name}`]) {
        return el.setAttribute(name, el.dataset[`previous${name}`]);
      }
    },
    empty,
    clear:  empty,
    replaceClass: (el, className, ...nwClassNames) => {
      el.classList.remove(className);
      nwClassNames.forEach(name => el.classList.add(name))
    },
    removeClass: (el, ...classNames) =>
      classNames.forEach(cn => el.classList.remove(cn)),
    addClass: (el, ...classNames) => el && classNames.forEach(cn => el.classList.add(cn)),
    show: el => {
      el.style.display = ``;
      el.style.visibility = ``;
      el.style.opacity = `1`;
    },
    hide: el => el.style.display = `none`,
    setData: setData,
    style: (el, keyOrKvPairs, value) => {
      if (value && IS(keyOrKvPairs, String)) {
        keyOrKvPairs = { [keyOrKvPairs]: value || `none` };
      }

      if (IS(keyOrKvPairs, Object)) {
        Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
      }
    },
    css,
  },
  instanceExtensions: {
    text: (self, textValue, append = false) => {
      if (self.isEmpty()) {
        return self;
      }

      const cb = el => el.textContent = append ? el.textContent + textValue : textValue;

      if (!IS(textValue, String)) {
        return self.first().textContent;
      }

      return loop(self, cb);
    },
    each: (self, cb) => loop(self, cb),
    remove: (self, selector) => {
      const remover = el => el.remove();
      if (selector) {
        const selectedElements = self.find$(selector);
        !selectedElements.isEmpty() && loop(selectedElements, remover);
        return;
      }
      loop(self, remover);
    },
    computedStyle: (self, property) => self.first() && getComputedStyle(self.first())[property],
    getData: (self, dataAttribute, valueWhenFalsy) => self.first() &&
      self.first().dataset?.[dataAttribute] || valueWhenFalsy,
    isEmpty: self => self.collection.length < 1,
    is: (self, checkValue) => {
      const firstElem = self.first();

      if (!firstElem) {
        return true;
      }

      switch (checkValue) {
        case ":visible": {
          return isVisible(firstElem); // TODO
        }
        case ":hidden":
          return !isVisible(firstElem);
        case ":disabled":
          return firstElem.getAttribute("readonly") || firstElem.getAttribute("disabled");
        default:
          return true;
      }
    },
    hasClass: (self, ...classNames) => {
      const firstElem = self.first();
      return self.isEmpty() || !firstElem.classList.length
        ? false : classNames.find(cn => firstElem.classList.contains(cn)) || false;
    },
    replace: (self, oldChild, newChild) => {
      const firstElem = self.first();

      if (newChild.isJQL) {
        newChild = newChild.first();
      }

      if (firstElem && oldChild) {
        oldChild = IS(oldChild, String)
          ? firstElem.querySelector(oldChild)
          : oldChild.isJQL
            ? oldChild.first()
            : oldChild;

        if (oldChild && newChild) {
          oldChild.replaceWith(newChild);
        }
      }

      return self;
    },
    replaceMe: (self, newChild) => {
      newChild = IS(newChild, HTMLElement) ? jql(newChild) : newChild;
      self.parent().replace(self, newChild)
      return jql(newChild);
    },
    val: (self, newValue) => {
      const firstElem = self.first();

      if (!firstElem || !IS(firstElem, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement)) {
        return self;
      }

      if (newValue === undefined) {
        return firstElem.value;
      }

      firstElem.value = `${newValue}`.length < 1 ? "" : newValue;

      return self;
    },
    attr(self, keyOrObj, value) {
      if (!value && IS(keyOrObj, String)) {
        console.log(`nou lekker hoor ... ${keyOrObj}, ${self[0].getAttribute(keyOrObj)}`);
        return self[0].getAttribute(keyOrObj);
      }

      if (IS(keyOrObj, String) && value) {
        keyOrObj = { [keyOrObj]: value };
      }

      Object.entries(keyOrObj).forEach(([key, value]) => {
        if (!checkProp(key)) { return false; }

        if (compareCI(key, `style`)) {
          return css(self[0], value, undefined);
        }

        if (compareCI(key, `data`)) {
          return setData(self[0], value);
        }

        if (IS(value, Object)) {
          return assignAttrValues(self[0], value);
        }

        self[0].setAttribute(key, value);
      });

      return self;
    },
    parent: self => self.collection.length && self.first().parentNode &&
      jql(self.first().parentNode) || self,
    append: (self, ...elems2Append) => {
      if (!self.isEmpty() && elems2Append.length) {
        for (const elem of elems2Append) {
          if (IS(elem, String)) {
            self.collection.forEach(el => el.appendChild(createElementFromHtmlString(elem)));
          }

          if (isNode(elem)) {
            self.collection.forEach( el =>
              el.appendChild(IS(elem, Comment) ? elem : elem.cloneNode(true)));
          }

          if (elem.isJQL && elem.collection.length) {
            if (elem.isVirtual) { elem.toDOM(); }
            const elems = elem.collection;
            elem.remove();
            elems.forEach( e2a =>
              self.collection.forEach( el =>
                el.appendChild( IS(e2a, Comment) ? e2a : e2a.cloneNode(true) ) ) );
          }
        }
      }

      return self;
    },
    prepend: (self, ...elems2Prepend) => {
      // todo: maybe better to only prepend to root element!
      if (!self.isEmpty() && elems2Prepend) {

        for (let i = 0; i < elems2Prepend.length; i += 1) {
          const elem2Prepend = elems2Prepend[i];

          if (IS(elem2Prepend, String)) {
            self.collection.forEach(el =>
              el.insertBefore(createElementFromHtmlString(elem2Prepend), el.firstChild))
            return self;
          }

          if (isNode(elem2Prepend)) {
            self.collection.forEach(el =>
              el.insertBefore(
                IS(elem2Prepend, Comment) ? elem2Prepend : elem2Prepend.cloneNode(true), el.firstChild));
            return self;
          }

          if (elem2Prepend.isJQL && !elem2Prepend.isEmpty()) {
            const elems = elem2Prepend.collection.slice();
            elem2Prepend.remove();
            elems.forEach(e2a =>
              self.collection.forEach(el =>
                el && el.insertBefore(IS(e2a, Comment) ? e2a : e2a.cloneNode(true), el.firstChild)));
          }
        }
      }

      return self;
    },
    appendTo: (self, appendTo) => {
      if (!appendTo.isJQL) {
        appendTo = self.virtual(appendTo);
      }
      return appendTo.append(self);
    },
    prependTo: (self, prependTo) => {
      if (!prependTo.isJQL) {
        prependTo = self.virtual(prependTo);
      }

      return prependTo.prepend(self);
    },
    single: (self, indexOrSelector = "0") => {
      if (self.collection.length > 0) {
        if (isNaN(+indexOrSelector) && self.find(indexOrSelector)) {
          return self.find$(indexOrSelector);
        }
        const index = +indexOrSelector;
        return index < self.collection.length
          ? jql(self.collection[indexOrSelector])
          : jql(self.collection.slice(-1));
      } else {
        return self;
      }
    },
    toNodeList: self => {
      const virtual = document.createElement(`div`);

      for (const elem of self.collection) {
        const nodeClone = document.importNode(elem, true);
        nodeClone.removeAttribute(`id`);
        virtual.append(nodeClone);
      }

      return virtual.childNodes;
    },
    duplicate: (self, toDOM = false, root = document.body) => {
      const clonedCollection = jql.virtual([...self.toNodeList()]);
      return toDOM ? clonedCollection.toDOM(root) : clonedCollection;
    },
    toDOM: (self, root = document.body, position = insertPositions.BeforeEnd) => {
      if (self.isVirtual) {
        self.isVirtual = false;
        inject2DOMTree(self.collection, root, position);
      }
      return self;
    },
    first: (self, asself = false) => {
      if (self.collection.length > 0) {
        return asself
          ? self.single()
          : self.collection[0];
      }
      return undefined;
    },
    first$: (self, indexOrSelector) => self.single(indexOrSelector),
    find: (self, selector) => self.first()?.querySelectorAll(selector) || [],
    find$: (self, selector) => {
      const found = self.collection.reduce((acc, el) =>
        [...acc, [...el.querySelectorAll(selector)]], [])
        .flat()
        .filter(el => IS(el, HTMLElement));
      return found.length && jql(found[0]) || jql();
    },
    prop: (self, property, value) => {
      if (value && !checkProp(property)) {
        return self;
      }

      if (!value) {
        return self.collection.length ? self.first()[property] : self;
      }

      if (self.collection.length) {
        return loop(self, el => el[property] = value);
      }

      return self;
    },
    on: (self, type, callback) => {
      if (self.collection.length) {
        const cssSelector = addHandlerId(self);
        jql.handle(self, type, cssSelector, callback);
      }

      return self;
    },
    html: (self, htmlValue, append) => {
      if (htmlValue === undefined) {
        return self.first()?.innerHTML;
      }

      if (!self.isEmpty()) {
        const nwElement = htmlValue.isJQL
          ? htmlValue.first() : createElementFromHtmlString(`<div>${htmlValue}</div>`);

        if (!IS(nwElement, Comment)) {
          const cb = el => el.innerHTML = append ? el.innerHTML + nwElement.innerHTML : nwElement.innerHTML;
          return loop(self, cb);
        }
      }

      return self;
    },
    outerHtml: self => (self.first() || {outerHTML: undefined}).outerHTML,
    htmlFor: (self, forQuery, htmlString = "", append = false) => {
      if (forQuery && self.collection.length) {
        const el2Change = self.find$(forQuery);
        if (!el2Change) {
          return self;
        }

        if (`{htmlValue}`.trim().length < 1) {
          el2Change.textContent = "";
          return self;
        }

        const nwElement = createElementFromHtmlString(`<div>${htmlString}</div>`);
        nwElement && el2Change.html(nwElement.innerHTML, append);
      }
      return self;
    },
    dimensions: self => self.first()?.getBoundingClientRect(),
    delegate: (/*NODOC*/self, type, cssSelector, ...callbacks) => {
      callbacks.forEach(callback => jql.handle(self, type, cssSelector, callback));
      return self;
    },
    ON: (self, type, ...callbacks) => {
      if (self.collection.length) {
        callbacks.forEach(cb => self.on(type, cb));
      }

      return self;
    },
    trigger: (self, evtType, SpecifiedEvent = Event, options = {}) => {
      if (self.collection.length) {
        const evObj = new SpecifiedEvent( evtType, { ...options, bubbles: options.bubbles??true} );
        for( let elem of self.collection ) { elem.dispatchEvent(evObj); }
      }
      return self;
    },
  },
};
export default allMethods;