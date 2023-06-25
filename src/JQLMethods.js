import {createElementFromHtmlString, insertPositions} from "./DOM.js";
import {
  IS,
  addHandlerId,
  isNode,
  randomString,
  inject2DOMTree,
  isCommentOrTextNode,
} from "./JQLExtensionHelpers.js";
import {ATTRS} from "./EmbedResources.js";
import jql from "../index.js";
import {ExamineElementFeatureFactory, toDashedNotation, toCamelcase, escHtml} from "./Utilities.js";
const loop = (instance, callback) => {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i); }
  return instance;
};
const isIt = ExamineElementFeatureFactory();
const emptyElement = el => el && (el.textContent = "");
const compareCI = (key, compareTo) => key.toLowerCase().trim() === compareTo.trim().toLowerCase();
const setData = (el, keyValuePairs) => {
  el && IS(keyValuePairs, Object) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.setAttribute(`data-${toDashedNotation(key)}`, value));
};
const checkProp = prop => ATTRS.html.find(attr => prop.toLowerCase() === attr);
const css = (el, keyOrKvPairs, value) => {
  if (value && IS(keyOrKvPairs, String)) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "-" ? "" : value};
  }

  let nwClass = undefined;

  if (keyOrKvPairs.className) {
    nwClass = keyOrKvPairs.className;
    delete keyOrKvPairs.className;
  }

  const classExists = ([...el.classList].find(c => c.startsWith(`JQLClass-`) || nwClass && c === nwClass));
  nwClass = classExists || nwClass || `JQLClass-${randomString().slice(1)}`;
  jql.editCssRule(`.${nwClass}`, keyOrKvPairs);
  el.classList.add(nwClass);
};
const assignAttrValues = (/*NODOC*/el, keyValuePairs) => {
  el && Object.entries(keyValuePairs).forEach(([key, value]) => {
    if (key.toLowerCase().startsWith(`data`)) {
      return setData(el, value);
    }

    if (compareCI(key, `class`)) {
      return value.split(/,/).forEach(v => el.classList.add(`${v.trim()}`));
    }

    if (IS(value, String) && checkProp(key)) {
      return el[key] = value;
    }
  });
};
const applyStyle = (el, rules) => {
  if (IS(rules, Object)) {
    Object.entries(rules).forEach(([key, value]) => {
      let priority;
      if (/!important/i.test(value)) {
        value = value.slice(0, value.indexOf(`!`)).trim();
        priority = 'important';
      }

      el.style.setProperty(toDashedNotation(key), value, priority)
    } );
  }
};
const dataWeirdnessProxy = {
  get(obj, key) { return obj[toCamelcase(key)] || obj[key]; }
};

const allMethods = {
  factoryExtensions: {
    is: self => isIt(self),
    length: self => self.collection.length,
    dimensions: self => self.first()?.getBoundingClientRect(),
    parent: self =>{
      const tryParent = jql(self[0]?.parentNode);
      return !tryParent.is.empty ? tryParent : self;
    },
    outerHtml: self => (self.first() || {outerHTML: undefined}).outerHTML,
    data: self => ({
      get all() { return new Proxy(self[0]?.dataset ?? {}, dataWeirdnessProxy); },
      get: (key, whenUndefined) => self.data.all[key] ?? whenUndefined,
      add: (valuesObj = {}) => {
        !self.is.empty && IS(valuesObj, Object) && Object.entries(valuesObj)
          .forEach( ([key,value]) => self.setData( { [key]: value} ) );
        return self;
      },
      remove: key => {
        self[0]?.removeAttribute(`data-${toDashedNotation(key)}`);
        return self;
      },
    }),
    Style: self => ({
      get computed() { return !self.is.empty ? getComputedStyle(self[0]) : {}; },
      inline: styleObj => self.style(styleObj),
      inSheet: styleObj => self.css(styleObj),
      valueOf: key => {
        return !self.is.empty ? getComputedStyle(self[0])[toDashedNotation(key)] : undefined;
      },
      byRule: ({classes2Apply = [], rules = []} = {}) => {
        if (rules?.length || classes2Apply?.length) {
          rules?.length && jql.editCssRules(...rules);
          classes2Apply?.forEach(selector => self.addClass(selector));
        }
        return self;
      },
    }),
    HTML: self => ({
      get: (outer, escaped) => {
        if (self.is.empty) {
          return `NO ELEMENTS IN COLLECTION`;
        }
        const html = outer ? self.outerHtml : self.html();
        return escaped ? escHtml(html) : html;
      },
      replace: str => {
        if (!self.is.empty) { self.html(str); }
        return self;
      },
      append: str => {
        if (!self.is.empty) { self.html(str, true); }
        return self;
      },
      insert: str => {
        if (!self.is.empty) { self.html(`${str.isJQL ? str.HTML.get(true) : str}${self.HTML.get()}`); }
        return self;
      },
    })
  },
  instanceExtensions: {
    isEmpty: self => self.collection.length < 1,
    replaceClass: (self, className, ...nwClassNames) =>
      loop( self, el => {
        el.classList.remove(className);
        nwClassNames.forEach(name => el.classList.add(name));
      } ),
    removeClass: (self, ...classNames) => loop(self, el => el && classNames.forEach(cn => el.classList.remove(cn))),
    addClass: (self, ...classNames) => loop(self, el => el && classNames.forEach(cn => el.classList.add(cn))),
    setData: (self, keyValuePairs) => loop(self, el => setData(el, keyValuePairs)),
    show: self => loop(self, el => applyStyle(el, {display: `revert-layer !important`})),
    hide: self => loop(self, el => applyStyle(el, {display: `none !important`})),
    empty: self => loop(self, emptyElement),
    clear: self => loop(self, emptyElement),
    closest: (self, selector) => {
      const theClosest = IS(selector, String) ? self[0].closest(selector) : null;
      return theClosest ? jql(theClosest) : self
    },
    style: (self, keyOrKvPairs, value) => {
      const loopCollectionLambda = el => {
        if (value && IS(keyOrKvPairs, String)) {
          keyOrKvPairs = { [keyOrKvPairs]: value || `none` };
        }

        applyStyle(el, keyOrKvPairs);
      };
      return loop(self, loopCollectionLambda);
    },
    toggleClass: (self, className) => loop(self, el => el.classList.toggle(className)),
    css: (self, keyOrKvPairs, value) => loop(self, el => css(el, keyOrKvPairs, value)),
    text: (self, textValue, append = false) => {
      if (self.isEmpty()) { return self; }
      if (!IS(textValue, String)) { return self.first().textContent; }
      const loopCollectionLambda = el => el.textContent = append ? el.textContent + textValue : textValue;
      return loop(self, loopCollectionLambda);
    },
    removeAttribute: (self, attrName) => loop(self, el => el.removeAttribute(attrName)),
    each: (self, cb) => loop(self, cb),
    remove: (self, selector) => {
      const remover = el => el.remove();
      const removeFromCollection = () =>
        self.collection = self.collection.filter(el => document.documentElement.contains(el));
      if (selector) {
        const selectedElements = self.find$(selector);
        if (!selectedElements.is.empty) {
          loop(selectedElements, remover);
          removeFromCollection();
        }
        return self;
      }
      loop(self, remover);
      removeFromCollection();
      return self;
    },
    computedStyle: (self, property) => self.first() && getComputedStyle(self.first())[property],
    getData: (self, dataAttribute, valueWhenFalsy) => self.first() &&
      self.first().dataset?.[dataAttribute] || valueWhenFalsy,
    hasClass: (self, ...classNames) => {
      const firstElem = self[0];
      return !firstElem || !firstElem.classList.length
        ? false : classNames.find(cn => firstElem.classList.contains(cn)) && true || false;
    },
    replace: (self, oldChild, newChild) => {
      const firstElem = self.first();

      if (!oldChild || !newChild) {
        console.error(`JQL replace: nothing to replace`);
        return self;
      }

      if (newChild.isJQL) {
        newChild = newChild.first();
      }

      if (IS(newChild, NodeList)) {
        newChild = newChild[0];
      }

      if (firstElem && oldChild) {
        oldChild = IS(oldChild, String)
          ? firstElem.querySelectorAll(oldChild)
          : oldChild.isJQL
            ? oldChild.collection
            : oldChild;

        if (IS(oldChild, HTMLElement, NodeList, Array) && IS(newChild, HTMLElement)) {
          (IS(oldChild, HTMLElement) ? [oldChild] : [...oldChild])
            .forEach(chld => chld.replaceWith(newChild.cloneNode(true)));
        }
      }

      return self;
    },
    replaceMe: (self, newChild) => {
      newChild = IS(newChild, HTMLElement) ? jql(newChild) : newChild;
      self.parent.replace(self, newChild);
      return jql(newChild);
    },
    val: (self, newValue) => {
      const firstElem = self[0];

      if (!firstElem || !IS(firstElem, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement)) {
        return self;
      }

      if (newValue === undefined) {
        return firstElem.value;
      }

      firstElem.value = !IS(newValue, String) ? "" : newValue;

      return self;
    },
    attr: (self, keyOrObj, value) => {
      if (!value && IS(keyOrObj, String)) {
        if (keyOrObj === `class`) {
          return [...self[0]?.classList]?.join(` `);
        }
        return self[0]?.getAttribute(keyOrObj);
      }

      if (IS(keyOrObj, String) && value) {
        keyOrObj = { [keyOrObj]: value };
      }

      if (IS(keyOrObj, Object) && !self.is.empty) {
        assignAttrValues(self[0], keyOrObj);
      }

      return self;
    },
    after: (self, afterEl)  => {
      afterEl = afterEl.isJQL ? afterEl[0] : afterEl;
      loop(self, el => afterEl.after(el));
      return self;
    },
    before: (self, beforeEl)  => {
      beforeEl = beforeEl.isJQL ? beforeEl[0] : beforeEl;
      return loop(self, el => beforeEl.before(el));
    },
    append: (self, ...elems2Append) => {
      if (!self.is.empty && elems2Append.length) {
        for (let elem2Append of elems2Append) {
          if (IS(elem2Append, String)) {
            const isPlainString = !/^<.+>$/m.test(elem2Append.trim());
            loop(self, el =>
              el.append(isPlainString ? jql.text(elem2Append) : createElementFromHtmlString(elem2Append)));
          }

          if (isNode(elem2Append)) {
            let toAppend = elem2Append;
            if (self.length > 1) {
              toAppend = elem2Append;
              toAppend.removeAttribute && toAppend.removeAttribute(`id`);
            }
            loop(self, el => el.append(toAppend));
          }

          if (elem2Append.isJQL && !elem2Append.is.empty) {
            const cloneCollection = self.length > 1 ? elem2Append.duplicate().collection : elem2Append.collection;
            loop(self, el => el.append(...cloneCollection));
          }
        }
      }
      return self;
    },
    prepend: (self, ...elems2Prepend) => {
      if (!self.isEmpty() && elems2Prepend) {

        for (const elem2Prepend of elems2Prepend) {
          if (IS(elem2Prepend, String)) {
            const isPlainString = !/^<.+>$/m.test(elem2Prepend.trim());
            loop(self, el =>
              el.prepend(isPlainString ? jql.text(elem2Prepend) : createElementFromHtmlString(elem2Prepend)));
          }

          if (isNode(elem2Prepend)) {
            let toPrepend = elem2Prepend;
            if (self.length > 1) {
              toPrepend = elem2Prepend.cloneNode(true);
              toPrepend.removeAttribute && toPrepend.removeAttribute(`id`);
            }
            loop(self, el => el.insertBefore(toPrepend, el.firstChild));
          }

          if (elem2Prepend.isJQL && !elem2Prepend.is.empty) {
            const clonedCollection = self.length > 1 ? elem2Prepend.duplicate().collection : elem2Prepend.collection;
            loop(self, el => el.prepend(...clonedCollection));
          }
        }
      }
      return self;
    },
    appendTo: (self, appendTo) => {
      if (!appendTo.isJQL) {
        appendTo = jql(appendTo);
      }
      appendTo.append(self);
      return self;
    },
    prependTo: (self, prependTo) => {
      if (!prependTo.isJQL) {
        prependTo = jql.virtual(prependTo);
      }

      prependTo.prepend(self);
      return self;
    },
    single: (self, indexOrSelector) => {
      if (self.collection.length > 0) {
        if (IS(indexOrSelector, String)) {
          return self.find$(indexOrSelector);
        }

        if (IS(indexOrSelector, Number)) {
          return jql(self.collection[indexOrSelector]);
        }

        return jql(self.collection[0]);
      }

      return self;
    },
    toNodeList: self => [...self.collection].map(el => document.importNode(el, true)),
    duplicate: (self, toDOM = false, root = document.body) => {
      const nodes = self.toNodeList().map(el => el.removeAttribute && el.removeAttribute(`id`) || el);
      const nwJQL = jql.virtual(nodes);
      return toDOM ? nwJQL.toDOM(root) : nwJQL;
    },
    toDOM: (self, root = document.body, position = insertPositions.BeforeEnd) => {
      self.collection = inject2DOMTree(self.collection, root, position);
      if (self.isVirtual) { self.isVirtual = false; }
      return self;
    },
    first: (self, asJQLInstance = false) => {
      if (self.collection.length > 0) {
        return asJQLInstance
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
      return found.length && jql(found) || jql();
    },
    prop: (self, property, value) => {
      if (value && !checkProp(property)) {
        return self;
      }

      if (!value) {
        return self[0]?.[property];
      }

      return loop(self, el => el[property] = value);
    },
    on: (self, type, ...callback) => {
      if (self.collection.length) {
        callback?.forEach(cb => {
          const cssSelector4Handler = addHandlerId(self);
          jql.delegate(type, cssSelector4Handler, cb);
        });
      }

      return self;
    },
    html: (self, htmlValue, append) => {
      if (htmlValue === undefined) {
        return self[0]?.innerHTML;
      }

      if (!self.isEmpty()) {
        const nwElement = createElementFromHtmlString(`<div>${htmlValue.isJQL ? htmlValue.HTML.get(true) : htmlValue}</div>`);

        if (!IS(nwElement, Comment)) {
          const cb = el => el.innerHTML = append ? el.innerHTML + nwElement.innerHTML : nwElement.innerHTML;
          return loop(self, cb);
        }
      }

      return self;
    },
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