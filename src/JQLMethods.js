import {createElementFromHtmlString, insertPositions} from "./DOM.js";
import {
  IS,
  addHandlerId,
  isNode,
  randomString,
  inject2DOMTree,
  isCommentOrTextNode
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
const empty = el => el && (el.textContent = "");
const compareCI = (key, compareTo) => key.toLowerCase().trim() === compareTo.trim().toLowerCase();
const setData = (el, keyValuePairs) => {
  el && IS(keyValuePairs, Object) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.setAttribute(`data-${toDashedNotation(key)}`, value));
};
const checkProp = prop => ATTRS.html.find(attr => prop === attr);
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
    parent: self => self.collection.length && jql(self.first()?.parentNode) || self,
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
    empty: self => loop(self, empty),
    clear: self => loop(self, empty),
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
    hasClass: (self, ...classNames) => {
      const firstElem = self.first();
      return self.isEmpty() || !firstElem.classList.length
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

    append: (self, ...elems2Append) => {
      if (!self.is.empty && elems2Append.length) {
        for (const elem2Append of elems2Append) {
          if (IS(elem2Append, String)) {
            return loop(self, el => el.append(createElementFromHtmlString(elem2Append)));
          }

          if (isNode(elem2Append)) {
            return loop(self, el => el.append(elem2Append.cloneNode(true)));
          }

          if (elem2Append.isJQL && !elem2Append.is.empty) {
            const elems = elem2Append.collection.slice().map(el => !IS(el, Comment) ? el.cloneNode(true) : el);
            elem2Append.remove();
            elems.forEach( e2a => loop(self, el => el.appendChild(e2a) ) );
            elem2Append.collection = elems;
          }
        }
      }
      return self;
    },
    prepend: (self, ...elems2Prepend) => {
      if (!self.isEmpty() && elems2Prepend) {

        for (const elem2Prepend of elems2Prepend) {

          if (IS(elem2Prepend, String)) {
            return loop(self, el => el.insertBefore(createElementFromHtmlString(elem2Prepend), el.firstChild))
          }

          if (isNode(elem2Prepend)) {
            return loop( self, el => el.insertBefore( elem2Prepend.cloneNode(true), el.firstChild) );
          }

          if (elem2Prepend.isJQL && !elem2Prepend.is.empty) {
            const elems = elem2Prepend.collection.slice().map(el => !IS(el, Comment) ? el.cloneNode(true) : el);
            elem2Prepend.remove();
            elems.forEach(e2a => loop( self, el => el && el.insertBefore( e2a, el.firstChild) ) );
            elem2Prepend.collection = elems;
          }
        }
      }
      return self;
    },
    appendTo: (self, appendTo) => {
      if (!appendTo.isJQL) {
        appendTo = jql(appendTo);
      }

      return appendTo.append(self);
    },
    prependTo: (self, prependTo) => {
      if (!prependTo.isJQL) {
        prependTo = self.virtual(prependTo);
      }

      return prependTo.prepend(self);
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
      const clonedCollection = jql.virtual(...self.toNodeList());
      return toDOM ? clonedCollection.toDOM(root) : clonedCollection;
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