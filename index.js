/*
  This is a classfree object oriented version of JQL (see https://github.com/KooiInc/JQL)
  Inspired by Douglas Crockford (see https://youtu.be/XFTOG895C7c?t=2562)
*/

import {
  isHtmlString,
  isArrayOfHtmlStrings,
  isArrayOfHtmlElements,
  inject2DOMTree,
  ElemArray2HtmlString,
  input2Collection,
  setCollectionFromCssSelector,
  truncateHtmlStr,
  proxify,
  addJQLStatics,
  createElementFromHtmlString,
  insertPositions,
  systemLog,
  IS,
} from "./src/JQLExtensionHelpers.js";

export default addJQLStatics(JQLFactory());

function JQLFactory() {
  const logLineLength = 70;

  return function(input, root = document.body, position = insertPositions.BeforeEnd) {
    const isRawHtml = isHtmlString(input);
    const isRawHtmlArray = isArrayOfHtmlStrings(input);
    const shouldCreateElements = !IS(root, HTMLBRElement) && isRawHtmlArray || isRawHtml;
    let instance = {
      collection: input2Collection(input) ?? [],
      isVirtual: IS(root, HTMLBRElement),
      isJQL: true,
      insertPositions, };

    const isRawElemCollection = isArrayOfHtmlElements(instance.collection);
    const logStr = `input =&gt; ${
      isRawHtmlArray
        ? `"${truncateHtmlStr(input.join(``), logLineLength)}"`
        : !shouldCreateElements && isRawElemCollection ? `element collection [${
            truncateHtmlStr( instance.collection.map(el => el.outerHTML || el.textContent).join(``), logLineLength)}]`
          : `"${truncateHtmlStr(input, logLineLength)}"`}`;

    if (instance.collection.length && isRawElemCollection) {
      systemLog(logStr);
      return proxify(instance);
    }

    if (shouldCreateElements) {
      [input].flat().forEach(htmlString =>
        instance.collection.push(createElementFromHtmlString(htmlString)));
    }

    if (shouldCreateElements && instance.collection.length > 0) {
      const errors = instance.collection.filter( el => el.dataset?.jqlcreationerror );
      instance.collection = instance.collection.filter(el => !el.dataset?.jqlcreationerror);

      systemLog(`${logStr}`);
      systemLog(`*Created ${instance.isVirtual ? `VIRTUAL ` : ``}[${
        truncateHtmlStr(ElemArray2HtmlString(instance.collection) || 
          "sanitized: no elements remaining", logLineLength)}]`);

      if (errors.length) {
        console.error(`JQL: illegal html, not rendered: "${
          errors.reduce( (acc, el) => acc.concat(`${el.textContent}\n`), ``).trim()}"` );
      }

      if (!instance.isVirtual) {
        inject2DOMTree(instance.collection, root, position);
      }

      return proxify(instance);
  }

    const forLog = setCollectionFromCssSelector(input, root, instance);
    systemLog(`input => ${forLog}`);
    return proxify(instance);
  }
}