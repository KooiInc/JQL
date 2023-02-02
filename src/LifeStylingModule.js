export default LifeStyleFactory;

function LifeStyleFactory({styleSheet, createWithId}) {
  const {cssRuleFromText, checkAtRules, toDashedNotation,
    ruleExists, checkParams, consider, atMedia2String, sheet} = getHelpers({styleSheet, createWithId});

  const setRule4Selector = (rule, properties) => Object.entries(properties)
    .forEach( ([prop, value]) => rule.style.setProperty(toDashedNotation(prop), value));

  const setRules = (selector, styleRules, sheetOrMediaRules = sheet) => {
    const exists = ruleExists(selector, true);
    const rule4Selector = exists
      || sheetOrMediaRules.cssRules[sheetOrMediaRules.insertRule(`${selector} {}`,
        sheetOrMediaRules.cssRules.length || 0)];
    return consider( () => setRule4Selector(rule4Selector, styleRules), selector, exists );
  };

  const doParse = cssDeclarationString => {
    const rule = cssDeclarationString.trim().split(/{/, 2);
    const selector = rule.shift().trim();
    const cssRules =  cssRuleFromText(rule);

    return setRules(selector, cssRules);
  };

  const styleFromString = cssDeclarationString => {
    const checkAts = checkAtRules(cssDeclarationString);
    return checkAts.done ? checkAts.existing : doParse(cssDeclarationString);
  }

  const styleFromObject = (selector, rulesObj) => {
    if (selector.trim().startsWith(`@media`)) {
      return styleFromString(atMedia2String(selector, rulesObj));
    }
    return setRules(selector, rulesObj);
  };

  return (cssBlockOrSelector, rulesObj = {}) =>
    checkParams(cssBlockOrSelector, rulesObj) && (
      Object.keys(rulesObj).length ?
        styleFromObject(cssBlockOrSelector, rulesObj) :
        styleFromString(cssBlockOrSelector) );
}

function getHelpers({styleSheet, createWithId}) {
  const notification = `Note: The rule or some of its properties may not be supported by your browser (yet)`;

  const escape4RegExp = str => str.replace(/([\*\[\]()-+{}.$\?\\])/g, '\\$1');

  const createSheet = id => document.head.insertAdjacentElement(`beforeend`,
    Object.assign( document.createElement(`style`), { id, type: `text/css` } )).sheet;

  styleSheet = styleSheet ?? createSheet(createWithId);

  const createRE = (regexStr, ...args) => {
    const flags = args.length && Array.isArray(args.slice(-1)) ? args.pop().join(``) : ``;

    return new RegExp(
      (args.length &&
        regexStr.raw.reduce( (a, v, i ) => a.concat(args[i-1] || ``).concat(v), ``) ||
        regexStr.raw.join(``))
        .split(`\n`)
        .map( line => line.replace(/\s|\/\/.*$/g, ``).trim().replace(/(@s!)/g, ` `) )
        .join(``), flags);
  };

  const ruleExists = (ruleFragOrSelector, isSelector) => ([...styleSheet.cssRules] || []).find(r =>
    isSelector ?
      compareSelectors((r.selectorText || ``), ruleFragOrSelector) :
      createRE`${escape4RegExp(ruleFragOrSelector)}${[...`gim`]}`.test(r.cssText))

  const checkAtRules = (cssDeclarationString) =>
    /@import|@charset|@font-face/i.test(cssDeclarationString) ?
      { existing: tryParse(cssDeclarationString, 0), done: true } :
      atRulesRE.test(cssDeclarationString) ?
        { ok: tryParse(cssDeclarationString, styleSheet.cssRules.length), done: true } :
        { ok: false, done: false };

  const IS = (obj, isObject) => {
    const self = obj?.constructor;
    return isObject ?
      isObject === self :
      ( self?.name
        || (String(self).match(/^function\s*([^\s(]+)/im)
          || [0,'ANONYMOUS_CONSTRUCTOR'])[1] ); };

  const atRulesRE = createRE`
          @keyframes
        | @font-feature-values
        | @font-palette-values
        | @layer
        | @namespace
        | @page
        | @counter-style
        | @container
        | @media
        ${[`i`]}`;

  const cssRuleFromText = rule =>
    rule[0]
      .trim()
      .replace(/[}{]/, ``)
      .split(`\n`).map(r => r.trim())
      .filter(v => v).reduce( (acc, v) => {
      const [key, value] = [
        v.slice(0, v.indexOf(`:`)).trim(),
        v.slice(v.indexOf(`:`) + 1).trim().replace(/;$|;.+(?=\/*).+\/$/, ``)];
      return key && value ? {...acc, [key]: value} : acc; }, {} );

  const toDashedNotation = str2Convert =>
    str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/[^--]^-|-$/, ``);

  const compareSelectors = (s1, s2) => s1?.replace(`::`, `:`) === s2?.replace(`::`, `:`);

  const checkParams = (cssBlockOrSelector, rulesObj) =>
    cssBlockOrSelector
    && IS(cssBlockOrSelector, String)
    && cssBlockOrSelector.trim().length
    && IS(rulesObj, Object) ||  (console.error(`StylingFactory instance called with invalid parameters`), false);

  const tryParse = cssDeclarationString => {
    cssDeclarationString = cssDeclarationString.trim();
    const exists = !!ruleExists(cssDeclarationString.slice(0, cssDeclarationString.indexOf(` `)));
    try {
      return (styleSheet.insertRule(`${cssDeclarationString}`, styleSheet.cssRules.length), exists);
    } catch(err) {
      return (console.error(`StylingFactory instance (tryParse) ${err.name} Error:\n${
        err.message}\nRule (truncated): ${
        cssDeclarationString.slice(0, 50).replace(/\n/g, `\\n`).replace(/\s{2,}/g, ` `)} ...\n${
        notification}`),
        exists);
    }
  };

  const stringifyMediaRule = mediaObj => Object.entries(mediaObj)
    .map( ([key, value]) => `${key}: ${value.trim()}`).join(`;\n`);

  const atMedia2String = (selector, rulesObj) => `${selector.trim()} ${
    Object.entries(rulesObj).map( ( [ selectr, rule] ) =>
      `${selectr}: { ${stringifyMediaRule(rule) }` ) }` ;

  const consider = (fn, rule, existing) => {
    try {
      return (fn(), existing);
    } catch(err) {
      return (console.error(`StylingFactory instance (tryAddOrModify) ${err.name} Error:\n${
        err.message}\nRule (truncated): ${
        (rule || `NO RULE`).trim().slice(0, 50).replace(/\n/g, `\\n`).replace(/\s{2,}/g, ` `)} ...\n${
        notification}`),
        existing);
    }
  }

  return {
    sheet: styleSheet,
    cssRuleFromText, checkAtRules, ruleExists, atMedia2String,
    toDashedNotation, checkParams, tryParse, consider};
}
