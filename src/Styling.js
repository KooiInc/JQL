import {toDashedNotation} from "./JQLExtensionHelpers.js";
let cssId = `customCSS`;

const customStylesheet = {
  set id(nwId) { cssId = nwId; },
  get id() { return cssId; },
  get getSheet() { return getOrCreateStyleSheet(); },
};
const injectStyleElement = (idCss = customStylesheet.id) => document.querySelector(`head`)
    .insertAdjacentElement(
      `beforeend`,
      Object.assign(document.createElement(`style`), { id: idCss, type: `text/css` } )
    );
const getOrCreateStyleSheet = (cssId = customStylesheet.id) => (document.querySelector(`#${cssId}`) || injectStyleElement(cssId)).sheet;
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
  const mediaStyleRules = styleValues["mediaSelectors"];

  for (let selector in mediaStyleRules) {
    setRules(mediaCssRule.cssRules, selector, mediaCssRule, mediaStyleRules[selector]);
  }
};
const checkParams = (selector, styleValues) => selector &&
    selector.constructor === String && selector.trim().length &&
    !Array.isArray(styleValues) &&
    styleValues.constructor === Object &&
    Object.keys(styleValues).length;

function changeCssStyleRule(selector, rules = {}, customCssId = customStylesheet.id) {
  if ( !checkParams(selector, rules) ) { return; }

  const styleSheet = getOrCreateStyleSheet(customCssId);

  return selector.startsWith(`@media`)
    ? setMediaRule(selector, rules, styleSheet)
    : setRules(styleSheet.cssRules, selector, styleSheet, rules);
}

export {
  changeCssStyleRule as setStyle,
  customStylesheet,
};