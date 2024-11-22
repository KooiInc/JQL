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
import {debugLog} from "./JQLLog.js";
const loop = (instance, callback) => {
  const cleanCollection = instance.collection.filter(el => !isCommentOrTextNode(el));
  for (let i = 0; i < cleanCollection.length; i += 1) {
    callback(cleanCollection[i], i); }
  return instance;
};
const isIt = ExamineElementFeatureFactory();
const emptyElement = el => el && (el.textContent = "");
const compareCI = (key, compareTo) => key.toLowerCase().trim() === compareTo.trim().toLowerCase();
const cloneAndDestroy = elem => {
  const cloned = elem.cloneNode(true)
  cloned.removeAttribute && cloned.removeAttribute(`id`);
  elem.isConnected ? elem.remove() : elem = null;
  return cloned;
};
const setData = (el, keyValuePairs) => {
  el && IS(keyValuePairs, Object) &&
  Object.entries(keyValuePairs).forEach(([key, value]) => el.setAttribute(`data-${toDashedNotation(key)}`, value));
};
const before = (self, elem2AddBefore) => {
  return self.andThen(elem2AddBefore, true);
};
const after = (self, elem2AddAfter) => {
  return self.andThen(elem2AddAfter);
};
const checkProp = prop => prop.startsWith(`data`) || ATTRS.html.find(attr => prop.toLowerCase() === attr);
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
    
    if (IS(value, String) && checkProp(key)) {
      el.setAttribute(key, value.split(/[, ]/)?.join(` `));
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

const logDebug = (...args) => {
  debugLog.log(`❗` + args.map(v => String(v)).join(`, `) ) ;
}

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
      set: (valuesObj = {}) => {
        !self.is.empty && IS(valuesObj, Object) && Object.entries(valuesObj)
          .forEach( ([key,value]) => self.setData( { [key]: value} ) );
         return self;
      },
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
      nwRule: rule => self.Style.byRule({rules: rule}),
      byRule: ({classes2Apply = [], rules = []} = {}) => {
        const isSingleRule = IS(rules, String);
        const addClassNameOrID = isSingleRule && !classes2Apply.length ? rules.split(`{`)[0].trim() : ``;
        rules = rules && IS(rules, String) ? [rules] : rules;
        classes2Apply = classes2Apply && IS(classes2Apply, String) ? [classes2Apply] : classes2Apply;

        if (rules?.length || classes2Apply?.length) {
          rules?.length && jql.editCssRules(...rules);
          classes2Apply?.forEach(selector => self.addClass(selector));
        }

        if (addClassNameOrID?.startsWith(`.`)) {
          self.addClass(addClassNameOrID.slice(1));
        }

        if (addClassNameOrID?.startsWith(`#`) && !self.attr(`id`)) {
          self.prop({id: addClassNameOrID.slice(1)});
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
      set: (content, append = false, escape = false) => {
        content = content.isJQL ? content.HTML.get(1) : content;
        const isString = IS(content, String);
        content = isString && escape ? escHtml(content) : content;
        if (isString && (content || ``).trim().length) { self.html(content, append); }
        return self;
      },
      replace: (content, escape = false) => {
        return self.HTML.set(content, false, escape);
      },
      append: (content, escape = false) => {
        content = IS(content, HTMLElement)
          ? content[Symbol.jqlvirtual].HTML.get(1) : content.isJQL ? content.HTML.get(1) : content;
        return self.HTML.set(content, true, escape);
      },
      insert: (content, escape = false) => {
        content = IS(content, HTMLElement)
          ? content[Symbol.jqlvirtual].HTML.get(1) : content.isJQL ? content.HTML.get(1) : content;
        return self.HTML.set(content + self.HTML.get(), false, escape);
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
      const firstElem = self[0];

      if (!oldChild || (!newChild || !IS(newChild, HTMLElement) && !newChild.isJQL)) {
        console.error(`JQL replace: invalid replacement value`);
        return self;
      }

      if (newChild.isJQL) {
        newChild = newChild[0];
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
    replaceWith: (self, newChild) => {
      newChild = IS(newChild, Element) ? newChild : newChild.isJQL ? newChild[0] : undefined;

      if (newChild) {
        self[0].replaceWith(newChild);
        self = jql.virtual(newChild);
      }

      return self;
    },
    replaceMe: (self, newChild) => /*NODOC*/ self.replaceWith(newChild),
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
      const firstElem = self[0];
      
      if (!firstElem) { return self }
      
      if (!value && IS(keyOrObj, String)) {
        if (keyOrObj === `class`) {
          return [...firstElem?.classList]?.join(` `);
        }
        
        return firstElem?.getAttribute(keyOrObj);
      }

      if (IS(keyOrObj, String) && value) {
        keyOrObj = { [keyOrObj]: value };
      }

      if (IS(keyOrObj, Object) && !self.is.empty) {
        assignAttrValues(firstElem, keyOrObj);
      }

      return self;
    },
    andThen: (self, elem2Add, before = false) => {
      if (!elem2Add || !IS(elem2Add, String, Node, Proxy)) {
        logDebug(`[JQL instance].[beforeMe | afterMe | andThen]: insufficient input [${elem2Add}]`, );
        return self;
      }
      
      elem2Add = elem2Add?.isJQL
        ? elem2Add.collection
        : IS(elem2Add, Node) ? jql.virtual(elem2Add).collection
          : jql.virtual(createElementFromHtmlString(elem2Add)).collection;
      
      const [index, method, reCollected] = before
        ? [0, `before`, elem2Add.concat(self.collection)]
        : [self.collection.length - 1, `after`, self.collection.concat(elem2Add)];
      
      self[index][method](...elem2Add);
      self.collection = reCollected;
      return self;
    },
    after,
    afterMe: after,
    before,
    beforeMe: before,
    append: (self, ...elems2Append) => {
      if (!self.is.empty && elems2Append.length) {
        const shouldMove = self.length === 1;
        
        for (let elem2Append of elems2Append) {
          if (IS(elem2Append, String)) {
            const elem2Append4Test = elem2Append.trim();
            const isPlainString = !/^<(.+)[^>]+>$/m.test(elem2Append4Test);
            let toAppend = isPlainString ? jql.text(elem2Append) : createElementFromHtmlString(elem2Append);
            loop(self, el => el.append(shouldMove ? toAppend : cloneAndDestroy(toAppend)));
          }
          
          if (isNode(elem2Append)) {
            loop(self, el => el.append(shouldMove ? elem2Append : cloneAndDestroy(elem2Append)));
          }
          
          if (elem2Append.isJQL && !elem2Append.is.empty) {
            loop(self, el =>
              elem2Append.collection.forEach(elem =>
                el.append(shouldMove ? elem : cloneAndDestroy(elem)))
            );
          }
        }
      }
      return self;
    },
    prepend: (self, ...elems2Prepend) => {
      if (!self.is.empty && elems2Prepend) {
        const shouldMove = self.length === 1;
        
        for (let elem2Prepend of elems2Prepend) {
          if (IS(elem2Prepend, String)) {
            elem2Prepend = elem2Prepend.trim();
            const isPlainString = !/^<(.+)[^>]+>$/m.test(elem2Prepend);
            let toPrepend = isPlainString ? jql.text(elem2Prepend) : createElementFromHtmlString(elem2Prepend);
            toPrepend = shouldMove ? toPrepend : cloneAndDestroy(toPrepend);
            loop(self, el => el.prepend(toPrepend.cloneNode(true)));
          }

          if (isNode(elem2Prepend)) {
            loop(self, el => el.prepend(shouldMove ? elem2Prepend : cloneAndDestroy(elem2Prepend)));
          }
          
          if (elem2Prepend.isJQL && !elem2Prepend.is.empty) {
            elem2Prepend.collection.length > 1 && elem2Prepend.collection.reverse();
            loop(self, el => loop( elem2Prepend, elem => el.prepend(shouldMove ? elem : cloneAndDestroy(elem)) ) );
            elem2Prepend.collection.reverse();
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
    find: (self, selector) => self.collection.length > 0 ? [...self.first()?.querySelectorAll(selector)] : [],
    find$: (self, selector) => { return self.collection.length > 0 ? jql(selector, self) : self; },
    prop: (self, nameOrProperties, value) => {
      if (IS(nameOrProperties, String) && !value) {
        return nameOrProperties.startsWith(`data`)
          ? self[0]?.dataset[nameOrProperties.slice(nameOrProperties.indexOf(`-`)+1)]
          : self[0]?.[nameOrProperties];
      }

      const props = !IS(nameOrProperties, Object) ? { [nameOrProperties]: value } : nameOrProperties;
      Object.entries(props).forEach( ([propName, propValue]) => {
        propName = propName.trim();

        if (propValue && !checkProp(propName) || !propValue) {
          return false;
        }

        const isId = propName.toLowerCase() === `id`;

        if (isId) { return self[0].id = propValue; }

        loop(self, el => {
          if (propName.startsWith(`data`)) {
            return el.dataset[propName.slice(propName.indexOf(`-`)+1)] = propValue;
          }
          
          el[propName] = propValue;
        });
      });

      return self;
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
        if (!forQuery || !IS(htmlString, String)) { return self; }
        
        const el2Change = self.find$(forQuery);
        
        if (el2Change.length < 1) { return self; }

        const nwElement = createElementFromHtmlString(`<span>${htmlString}</span>`);
        
        el2Change.each(el => {
          if (!append) { el.textContent = ``; }
          el.insertAdjacentHTML(`beforeend`, nwElement.innerHTML)
        });
        
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
