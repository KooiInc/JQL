export default lifeStyleFactory;

function lifeStyleFactory({styleSheet, createWithId}) {
  styleSheet = createWithId ?
    document.head.insertAdjacentElement(`beforeend`,
      Object.assign( document.createElement(`style`), { id: createWithId, type: `text/css` } )
    ).sheet :
    styleSheet;

  const IS = (obj, isObject) => {
    const self = obj?.constructor;
    return isObject ?
      isObject === self :
      ( self?.name
        || (String(self).match(/^function\s*([^\s(]+)/im)
          || [0,'ANONYMOUS_CONSTRUCTOR'])[1] ); };

  const toDashedNotation = str2Convert =>
    str2Convert.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`).replace(/^-|-$/, ``);
  const compareSelectors = (s1, s2) => s1?.replace(`::`, `:`) === s2?.replace(`::`, `:`);
  const checkParams = (cssBlockOrSelector, rulesObj) =>
    cssBlockOrSelector
    && IS(cssBlockOrSelector, String)
    && cssBlockOrSelector.trim().length
    && IS(rulesObj, Object) ||
    (console.error(`StylingFactory instance sais: invalid parameters!`), false);
  const setRule4Selector = (rule, properties) => Object.entries(properties)
    .forEach( ([prop, value]) => rule.style.setProperty(toDashedNotation(prop), value));

  const setRules = (selector, styleRules, sheetOrMediaRules = styleSheet) => {
    const exists = [...sheetOrMediaRules.cssRules].find( r =>
      compareSelectors((r.selectorText || ``), selector) );
    const rule4Selector = exists
      || sheetOrMediaRules.cssRules[sheetOrMediaRules.insertRule(`${selector} {}`,
        sheetOrMediaRules.cssRules.length || 0)];
    setRule4Selector(rule4Selector, styleRules);
    return exists ? true : false; };

  const setMediaRule = (selector, styleValues) => {
    const mediaCssRule = [...styleSheet.cssRules].find( r => r.cssText.startsWith(selector)) ||
      styleSheet.cssRules[styleSheet.insertRule(`${selector} {}`, styleSheet.cssRules.length || 0)];
    const mediaStyleRules = styleValues;
    Object.entries(mediaStyleRules).forEach( ([selector, cssRule]) =>
      setRules(selector, cssRule, mediaCssRule) ); };

  const cssRuleFromText = rule => {
    let rules = rule[0].trim().replace(/}|{/, ``).split(`\n`).map(r => r.trim())
      .filter(v => v);
    return rules.reduce( (acc, v) => {
      const [key, value] = [
        v.slice(0, v.indexOf(`:`)).trim(),
        v.slice(v.indexOf(`:`) + 1).trim().replace(/;$|;.+(?=\/*).+\/$/, ``)];
      return key && value ? {...acc, [key]: value} : acc; }, {} );
  };

  const mediaRuleFromText = selector => {
    const rules = selector.slice( selector.indexOf(`{`) + 1, selector.lastIndexOf(`}`) );
    return rules.split(/}/).filter( r => r.trim().length ).map(r => r.trim())
      .reduce( (acc, v) => {
        const [key, rule] = v.split(`{`).map(v => v?.trim()?.replace(/}/, ``));
        return key && rule ? {...acc, [key]: cssRuleFromText([rule])} : acc; }, {} ); };

  const styleFromObject = (selector, rulesObj) =>
    selector.trim().startsWith(`@media`)
      ? setMediaRule(selector, rulesObj)
      : setRules(selector, rulesObj);

  const styleFromString = cssDeclarationString => {
    const isMediaRule = /@media/.test(cssDeclarationString);
    const mediaRules = isMediaRule && mediaRuleFromText(cssDeclarationString) || undefined;
    const rule = cssDeclarationString.trim().split(/{/, 2);
    const selector = rule.shift().trim();
    const cssRules =  mediaRules ?? cssRuleFromText(rule);

    return isMediaRule
      ? setMediaRule(selector, cssRules)
      : setRules(selector, cssRules); };

  return (cssBlockOrSelector, rulesObj = {}) =>
    checkParams(cssBlockOrSelector, rulesObj) ?
      Object.keys(rulesObj).length ?
        styleFromObject(cssBlockOrSelector, rulesObj) :
        styleFromString(cssBlockOrSelector) :
      true;
}