// derived from https://testbed.nicon.nl/showFiddle/ehd2710f
// noinspection JSValidateJSDoc
import {toDashedNotation} from "./Helpers.js";

/**
 * Add or change style rules in a <code>&lt;style></code> element, added to the
 * header of the enclosing document if not already done so
 * @module Styling
 */
const createStyle = cssId => {
  const theLink = Object.assign(
    document.createElement(`style`), { id: cssId, type: `text/css` } );
  document.querySelector(`head`).appendChild(theLink);
  return theLink;
}

const getMediaSelector = selector => {
  if (selector.startsWith(`@media`)) {
    const [media, mSelector] = selector.split(`[`);
    return [media, mSelector.slice(0, -1)];
  }
  return [, selector];
}

const getOrCreateStyleSheet = cssId =>
  (document.querySelector(`#${cssId}`) || createStyle(cssId)).sheet;

const compareSelectors = (s1, s2) => s1.replace(`::`, `:`) === s2.replace(`::`, `:`);
const setRule = (rule, values) =>
  Object.entries(values)
    .forEach( ([prop, nwValue = ""]) => rule.style.setProperty(toDashedNotation(prop), nwValue) );
/**
 * Change or create some css rule in an existing or dynamically created stylesheet (id: cssId) in the document
 * A @media rule can also be inserted, using <code>[@media rule][style rule]</code>
 * @param selector {string} the (css) selectorText, like <code>ul li.inActive</code>, <code>.someClass</code> etc.
 * @param styleValues {Object} an object with CSSStyleDeclarations
 * <br><b>Note</b>: enclose a string value of `content` in quotes (e.g. <code>&#123;content: `'Some string'`&#125;</code>)
 * <br><b>Note</b>: rule keys should be valid (e.g. <code>&#123;marginRight: `0.3rem`&#125;</code>
 * or <code>&#123;"margin-right": `0.3rem`&#125;</code>)
 * @param cssId {string|undefined} id of the css stylesheet (to create or retrieve), default "customCSS"
 * @example
 * // assume changeRuleset is imported as setStyleRule
 * setStyleRule(".myClass", {color: "#c0c0c0", padding: "0 4px 0 15px"}, "YesItsMyCss");
 * //           ^ someRule  ^                                             ^
 * //                       ^ styleProps                                  ^
 * //                                                                     ^ id of the stylesheet
 * //
 * // set a @media rule
 * setStyleRule("@media(max-width: 1200px)[div.myClass]", {width: 800px}, "YesItsMyCss");
 * //            ^ @media selector         ^
 * //                                      ^ rule selector (must be between [])
 */
function changeCssStyleRule(selector, styleValues = {}, cssId="customCSS") {
  if (!styleValues ||
    Array.isArray(styleValues) ||
    styleValues.constructor !== Object ||
    Object.keys(styleValues).length < 1) {
    return;
  }

  const styleSheet = getOrCreateStyleSheet(cssId);
  const [mediaRule, realSelector]  = getMediaSelector(selector);
  let mediaRuleset = undefined;
  selector = mediaRule ? realSelector : selector;

  let ruleSet = styleSheet.cssRules;

  if (mediaRule) {
    ruleSet = [...ruleSet].find( r => r.cssText.startsWith(mediaRule));

    if (!ruleSet) {
      styleSheet.insertRule(`${mediaRule} {}`, styleSheet.cssRules.length || 0);
      mediaRuleset = styleSheet.cssRules[styleSheet.cssRules.length-1];
      ruleSet = mediaRuleset.cssRules;
    }
    mediaRuleset = ruleSet;
    ruleSet = ruleSet.cssRules;
  }

  if (ruleSet) {
    let rule = [...ruleSet].find( r => compareSelectors((r.selectorText || ``), selector) );

    if (!rule && !mediaRule) {
      styleSheet.insertRule(`${selector} {}`, styleSheet.cssRules.length || 0);
      rule = ruleSet[styleSheet.cssRules.length-1];
    }

    if (!rule && mediaRule) {
      mediaRuleset.insertRule(`${selector} {}`, 0);
      rule = mediaRuleset.cssRules[mediaRuleset.cssRules.length-1];
    }

    setRule(rule, styleValues);
  }
}
export default changeCssStyleRule;