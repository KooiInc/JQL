import _$ from "./JQueryLike.js";
import {setStyle} from "./Styling.js";
import {createElementFromHtmlString} from "./DOM.js";
import {hex2RGBA, loop, addHandlerId, isVisible, isNode, isObjectAndNotArray, randomString} from "./JQLExtensionHelpers.js";
import handlerFactory from "./HandlerFactory.js";

const empty = el => el && (el.textContent = "");
const setData = (el, keyValuePairs) => {
  el && isObjectAndNotArray(keyValuePairs) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.dataset[key] = value);
};
const css = (el, keyOrKvPairs, value) => {
  if (value && keyOrKvPairs.constructor === String) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQLCreated`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQLCreated_${randomString.randomHtmlElementId(12)}`;
  setStyle(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
};
const assignAttrValues = (el, keyValuePairs) => {
  el && Object.entries(keyValuePairs).forEach(([key, value]) => {
    if (key.startsWith(`data`)) {
      setData(el, {[key]: value});
    }

    if (key.toLowerCase() === "class") {
      value.split(/\s+/).forEach(v => el.classList.add(`${v}`))
    }

    if (value.constructor === String) {
      el[key] = value;
    }
  });
};
const allMethods = {
  straigthLoops: {
    toggleClass: (el, className) => el.classList.toggle(className),
    toggleStyleFragments: (el, keyValuePairs) =>
      el && Object.entries(keyValuePairs).forEach(([key, value]) => {
        if (value instanceof Function) {
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

    toggleAttr: (el, name, value) =>
      el && el.hasAttribute(name)
        ? el.removeAttribute(name)
        : el.setAttribute(name, value),

    empty,
    clear: empty,

    replaceClass: (el, className, ...nwClassNames) => {
      el.classList.remove(className);
      nwClassNames.forEach(name => el.classList.add(name))
    },

    removeClass: (el, ...classNames) =>
      classNames.forEach(cn => el.classList.remove(cn)),

    addClass: (el, ...classNames) => el && classNames.forEach(cn => el.classList.add(cn)),

    show: el => el.style.display = ``,

    hide: el => el.style.display = `none`,
    setData,
    assignAttrValues,

    attr(el, keyOrObj, value) {
      if (!el) {
        return true;
      }

      if (value !== undefined) {
        keyOrObj = {[keyOrObj]: value};
      }

      if (!value && keyOrObj.constructor === String) {
        return el.getAttribute(keyOrObj);
      }

      Object.entries(keyOrObj).forEach(([key, value]) => {
        const keyCompare = key.toLowerCase().trim();

        if (keyCompare === `style`) {
          return css(el, value, undefined);
        }

        if (keyCompare === `data`) {
          return setData(el, value);
        }

        if (value instanceof Object) {
          return assignAttrValues(el, value);
        }

        return el.setAttribute(key, value);
      });
    },
    style: (el, keyOrKvPairs, value) => {
      if (value && keyOrKvPairs.constructor === String) {
        keyOrKvPairs = {[keyOrKvPairs]: value || "none"};
      }

      if (!Array.isArray((keyOrKvPairs)) && keyOrKvPairs.constructor === Object) {
        Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
      }
    },

    css,
  },
  instanceExtensions: {
    text: (extCollection, textValue, append) => {
      if (extCollection.isEmpty()) {
        return extCollection;
      }

      const cb = el => el.textContent = append ? el.textContent + textValue : textValue;

      if (!textValue) {
        return extCollection.first().textContent;
      }

      return loop(extCollection, cb);
    },
    each: (extCollection, cb) => loop(extCollection, cb),
    remove: (extCollection, selector) => {
      const remover = el => el.remove();
      if (selector) {
        const selectedElements = extCollection.find$(selector);
        !selectedElements.isEmpty() && loop(selectedElements, remover);
        return;
      }
      loop(extCollection, remover);
    },
    computedStyle: (extCollection, property) => extCollection.first() && getComputedStyle(extCollection.first())[property],
    getData: (extCollection, dataAttribute, valueWhenFalsy) => extCollection.first() &&
      extCollection.first().dataset && extCollection.first().dataset[dataAttribute] || valueWhenFalsy,
    isEmpty: extCollection => extCollection.collection.length < 1,
    is: (extCollection, checkValue) => {
      const firstElem = extCollection.first();

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
    hasClass: (extCollection, ...classNames) => {
      const firstElem = extCollection.first();
      return extCollection.isEmpty() || !firstElem.classList.length
        ? false : classNames.find(cn => firstElem.classList.contains(cn)) || false;
    },
    replace: (extCollection, oldChild, newChild) => {
      const firstElem = extCollection.first();

      if (newChild.isJQL) {
        newChild = newChild.first();
      }

      if (firstElem && oldChild) {
        oldChild = oldChild.constructor === String
          ? firstElem.querySelector(oldChild)
          : oldChild.isJQL
            ? oldChild.first()
            : oldChild;

        if (oldChild && newChild) {
          oldChild.replaceWith(newChild);
        }
      }

      return extCollection;
    },
    replaceMe: (extCollection, newChild) => {
      newChild = newChild instanceof HTMLElement ? new extCollection.constructor(newChild) : newChild;
      extCollection.parent().replace(extCollection, newChild)
      return newChild;
    },
    val: (extCollection, value2Set) => {
      const firstElem = extCollection.first();

      if (!firstElem) {
        return;
      }

      if ([HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement].includes(firstElem["constructor"])) {
        if (value2Set || [String, Number].find(v2s => value2Set.constructor === v2s)) {
          firstElem.value = value2Set;
        }

        return firstElem.value;
      }
    },
    parent: extCollection => !extCollection.isEmpty() && extCollection.first().parentNode &&
      new extCollection.constructor(extCollection.first().parentNode) || extCollection,
    append: (extCollection, ...elems2Append) => {
      if (!extCollection.isEmpty() && elems2Append) {

        for (let i = 0; i < elems2Append.length; i += 1) {
          const elem2Append = elems2Append[i];

          if (elem2Append.constructor === String) {
            extCollection.collection.forEach(el => el.appendChild(createElementFromHtmlString(elem2Append)))
            return extCollection;
          }

          if (isNode(elem2Append)) {
            extCollection.collection.forEach(el =>
              el.appendChild(elem2Append instanceof Comment ? elem2Append : elem2Append.cloneNode(true)));
            return extCollection;
          }

          if (elem2Append.isJQL && !elem2Append.isEmpty()) {
            const elems = elem2Append.collection.slice();
            elem2Append.remove();
            elems.forEach(e2a =>
              extCollection.collection.forEach(el =>
                el.appendChild(e2a instanceof Comment ? e2a : e2a.cloneNode(true))));
          }
        }
      }

      return extCollection;
    },
    prepend: (extCollection, ...elems2Prepend) => {
      if (!extCollection.isEmpty() && elems2Prepend) {

        for (let i = 0; i < elems2Prepend.length; i += 1) {
          const elem2Prepend = elems2Prepend[i];

          if (elem2Prepend.constructor === String) {
            extCollection.collection.forEach(el =>
              el.insertBefore(createElementFromHtmlString(elem2Prepend), el.firstChild))
            return extCollection;
          }

          if (isNode(elem2Prepend)) {
            extCollection.collection.forEach(el =>
              el.insertBefore(
                elem2Prepend instanceof Comment ? elem2Prepend : elem2Prepend.cloneNode(true), el.firstChild));
            return extCollection;
          }

          if (elem2Prepend.isJQL && !elem2Prepend.isEmpty()) {
            const elems = elem2Prepend.collection.slice();
            elem2Prepend.remove();
            elems.forEach(e2a =>
              extCollection.collection.forEach(el =>
                el && el.insertBefore(e2a instanceof Comment ? e2a : e2a.cloneNode(true), el.firstChild)));
          }
        }
      }

      return extCollection;
    },
    appendTo: (extCollection, extCollection2AppendTo) => {
      if (!extCollection2AppendTo.isJQL) {
        extCollection2AppendTo = _$.virtual(extCollection2AppendTo);
      }
      return extCollection2AppendTo.append(extCollection);
    },
    prependTo: (extCollection, extCollection2PrependTo) => {
      if (!extCollection2PrependTo.isJQL) {
        extCollection2PrependTo = _$.virtual(extCollection2PrependTo);
      }

      return extCollection2PrependTo.prepend(extCollection);
    },
    single: (extCollection, indexOrSelector = "0") => {
      if (extCollection.collection.length > 0) {
        if (isNaN(+indexOrSelector) && extCollection.find(indexOrSelector)) {
          return extCollection.find$(indexOrSelector);
        }
        const index = +indexOrSelector;
        return index < extCollection.collection.length
          ? _$(extCollection.collection[indexOrSelector])
          : _$(extCollection.collection.slice(-1));
      } else {
        return extCollection;
      }
    },
    toNodeList: extCollection => {
      const virtual = document.createElement(`div`);

      for (let elem of extCollection.collection) {
        const nodeClone = document.importNode(elem, true);
        nodeClone.removeAttribute(`id`);
        virtual.append(nodeClone);
      }

      return virtual.childNodes;
    },
    duplicate: (extCollection, toDOM = false) => {
      const clonedCollection = extCollection.toNodeList();
      return toDOM ? _$(clonedCollection) : _$.virtual(clonedCollection);
    },
    toDOM: (extCollection, root = document.body) => {
      if (extCollection.isVirtual) {
        extCollection.isVirtual = false;
        return _$(extCollection.collection, root);
      }
      return extCollection;
    },
    first: (extCollection, asExtCollection = false) => {
      if (extCollection.collection.length > 0) {
        return asExtCollection
          ? extCollection.single()
          : extCollection.collection[0];
      }
      return undefined;
    },
    first$: (extCollection, indexOrSelector) => extCollection.single(indexOrSelector),
    find: (extCollection, selector) =>
      extCollection.first()?.querySelectorAll(selector) || [],

    find$: (extCollection, selector) => {
      const found = extCollection.collection.reduce((acc, el) =>
        [...acc, [...el.querySelectorAll(selector)]], [])
        .flat()
        .filter(el => el && el instanceof HTMLElement);
      return found.length && _$.virtual(found);
    },
    prop: (extCollection, property, value) => {
      if (value === undefined) {
        return !extCollection.isEmpty ? extCollection.first()[property] : undefined;
      }

      if (!extCollection.isEmpty) {
        loop(extCollection, el => el[property] = value);
      }

      return extCollection;
    },
    on: (extCollection, type, callback) => {
      if (extCollection.collection.length) {
        const cssSelector = addHandlerId(extCollection);
        handlerFactory(extCollection, type, cssSelector, callback);
      }

      return extCollection;
    },
    html: (extCollection, htmlValue, append) => {
      if (htmlValue === undefined) {
        return extCollection.first()?.innerHTML;
      }

      if (!extCollection.isEmpty()) {
        const nwElement = htmlValue.isJQL
          ? htmlValue.first() : createElementFromHtmlString(`<div>${htmlValue}</div>`);

        if (!(nwElement instanceof Comment)) {
          const cb = el => el.innerHTML = append ? el.innerHTML + nwElement.innerHTML : nwElement.innerHTML;
          return loop(extCollection, cb);
        }
      }

      return extCollection;
    },
    outerHtml: extCollection => (extCollection.first() || {outerHTML: undefined}).outerHTML,
    htmlFor: (extCollection, forQuery, htmlString = "", append = false) => {
      if (forQuery && extCollection.collection.length) {
        const el2Change = extCollection.find$(forQuery);
        if (!el2Change) {
          return extCollection;
        }

        if (`{htmlValue}`.trim().length < 1) {
          el2Change.textContent = "";
          return extCollection;
        }

        const nwElement = createElementFromHtmlString(`<div>${htmlString}</div>`);
        nwElement && el2Change.html(nwElement.innerHTML, append);
      }
      return extCollection;
    },
    dimensions: extCollection => extCollection.first()?.getBoundingClientRect(),
    delegate: (extCollection, type, cssSelector, ...callbacks) => {
      callbacks.forEach(callback =>
        handlerFactory(extCollection, type, cssSelector, callback));

      return extCollection;
    },
    ON: (extCollection, type, ...callbacks) => {
      if (extCollection.collection.length) {
        callbacks.forEach(cb => extCollection.on(type, cb));
      }

      return extCollection;
    },
  },
};

export default allMethods;