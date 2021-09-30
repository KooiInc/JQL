// derived from https://testbed.nicon.nl/showFiddle/ehd2710f
// noinspection JSValidateJSDoc
import {toDashedNotation} from "./Helpers.js";

const createStyle = cssId => {
  const theLink = Object.assign(
    document.createElement(`style`), { id: cssId, type: `text/css` } );
  document.querySelector(`head`).appendChild(theLink);
  return theLink;
}
const getOrCreateStyleSheet = cssId =>
  (document.querySelector(`#${cssId}`) || createStyle(cssId)).sheet;

/**
 * Static JQL extension method, exposed as <code>JQL.setClass</code>
 * @namespace JQL/ExternalStyling
 */
const compareSelectors = (s1, s2) => s1.replace(`::`, `:`) === s2.replace(`::`, `:`);
const setRule = (rule, values) =>
  Object.entries(values)
    .forEach( ([prop, nwValue = ""]) => {
      if (prop === `content`) {
        return rule.style.content = nwValue;
      }
      rule.style.setProperty(toDashedNotation(prop), nwValue);
    } );
/**
 * change or create some css rule in an existing or dynamically created stylesheet (id: cssId) in the document
 * @memberof JQL/ExternalStyling
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
 */
function changeCssStyleRule(selector, styleValues = {}, cssId="customCSS") {
  if (!styleValues ||
    Array.isArray(styleValues) ||
    styleValues.constructor !== Object ||
    Object.keys(styleValues).length < 1) {
    return;
  }

  const styleSheet = getOrCreateStyleSheet(cssId);
  const ruleSet = styleSheet.cssRules;

  if (ruleSet) {
    let rule = [...ruleSet].find(r => compareSelectors(r.selectorText, selector));

    if (!rule) {
      styleSheet.insertRule(`${selector} {}`, styleSheet.cssRules.length || 0);
      rule = ruleSet[styleSheet.cssRules.length-1];
    }

    setRule(rule, styleValues);
  }
}

export default changeCssStyleRule;