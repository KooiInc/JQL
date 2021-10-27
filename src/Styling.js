// derived from https://testbed.nicon.nl/showFiddle/ehd2710f
// noinspection JSValidateJSDoc,JSUnresolvedVariable
// noinspection JSUnresolvedVariable

import {toDashedNotation} from "./Helpers.js";
let cssId = `customCSS`;

const globalCssID = {
  set id(id) { cssId = id; },
  get id() { return cssId }
}
/**
 * Add or change style rules in a <code>&lt;style></code> element, added to the
 * header of the enclosing document if not already done so
 * @module Styling
 */
const injectStyleElement = cssId => document.querySelector(`head`)
    .insertAdjacentElement(
      `beforeend`,
      Object.assign(document.createElement(`style`), { id: cssId, type: `text/css` } )
    );
const getOrCreateStyleSheet = cssId => (document.querySelector(`#${cssId}`) || injectStyleElement(cssId)).sheet;
const compareSelectors = (s1, s2) => s1.replace(`::`, `:`) === s2.replace(`::`, `:`);
const setRule4Selector = (rule, values) => Object.entries(values)
    .forEach( ([prop, nwValue = ""]) => rule.style.setProperty(toDashedNotation(prop), nwValue) );
const setRules = (cssRules, selector, rulesContainer, styleRules) => {
    const rule4Selector = [...cssRules].find( r => compareSelectors((r.selectorText || ``), selector) ) ||
      cssRules[rulesContainer.insertRule(`${selector} {}`, rulesContainer.cssRules.length || 0)];
    setRule4Selector(rule4Selector, styleRules);
};
const setMediaRule = (selector, styleValues, styleSheet) => {
  const mediaCssRule = [...styleSheet.cssRules].find( r => r.cssText.startsWith(selector)) ||
    styleSheet.cssRules[styleSheet.insertRule(`${selector} {}`, styleSheet.cssRules.length || 0)];
  const mediaStyleRules = styleValues.mediaSelectors;

  for (let selector in mediaStyleRules) {
    setRules(mediaCssRule.cssRules, selector, mediaCssRule, mediaStyleRules[selector]);
  }
};
const checkParams = (selector, styleValues) => selector &&
    selector.constructor === String && selector.trim().length &&
    !Array.isArray(styleValues) &&
    styleValues.constructor === Object &&
    Object.keys(styleValues).length;

/**
 * Change or create some css rule in an existing or dynamically created stylesheet (id: cssId) in the document
 * <br><br>A @media rule can also be inserted. Use a media rule for the selector (e.g.<code>@media print</code>)
 * and set the style rules for it for one or more selectors using an object with one key: <i>mediaSelectors</i>, e.g.:
 * <br><code>{mediaSelectors: { "div#x": {display: `none`}, "div#y": color: `green`} }</code>
 * @todo: buggy, make it better
 * @param selector {string} the (css) selectorText, like <code>ul li.inActive</code>, <code>.someClass</code> etc.
 * @param styleValues {Object} an object with CSSStyleDeclarations
 * <br><b>Note</b>: enclose a string value of `content` in quotes (e.g. <code>&#123;content: `'Some string'`&#125;</code>)
 * <br><b>Note</b>: rule keys should be valid (e.g. <code>&#123;marginRight: `0.3rem`&#125;</code>
 * or <code>&#123;"margin-right": `0.3rem`&#125;</code>)
 * @param cssId {string|undefined} id of the css stylesheet (to create or retrieve), default "customCSS"
 * @example
 * // assume changeRuleset is imported as setStyleRule
 * setStyleRule(".myClass", {color: "#c0c0c0", padding: "0 4px 0 15px"}, "YesItsMyCss");
 * //           ^ someRule   ^                                            ^
 * //                        ^ css rules                                  ^
 * //                                                                     ^ id of the stylesheet
 * //
 * // set a @media rule
 * setStyleRule( "@media(max-width: 1200px)",
 * //             ^ @media rule
 *              { mediaSelectors: {".someClass": {width: `500px`}, "#someDiv": {color: red}} } )
 * //                              ^ selector                                   ^
 * //                                                                           ^ css rule(s)
 */
function changeCssStyleRule(selector, styleValues = {}) {
  if ( !checkParams(selector, styleValues) ) { return; }

  const styleSheet = getOrCreateStyleSheet(globalCssID.id);

  return selector.startsWith(`@media`)
    ? setMediaRule(selector, styleValues, styleSheet)
    : setRules(styleSheet.cssRules, selector, styleSheet, styleValues);
}

export {
  changeCssStyleRule as setStyle,
  globalCssID,
};