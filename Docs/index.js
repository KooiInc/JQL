Prism.manual = true;
const isDev = location.host.startsWith(`dev`);
const importLink =  isDev ?
  `../index.js` :
  `../../Bundle/jql.min.js`;
const $ = (await import(importLink)).default;
const codeReplacements = new Map( [
  [`<`, `&lt;`],
  [`>`, `&gt;`],
  [`&`, a => `&amp;${a[1]}`],
  [`linebreak`, `\n<br>`],
  [`reducebreaks`, `\n\n`] ] );
$(`#loader`).remove();
const setAllCodeStyling = el => {
  const pre = el.closest(`pre`);
  return !pre ? $(el).addClass(`inline`) : $(pre).addClass(`language-javascript`, `line-numbers`);
}
const perform = performance.now();
document.title = isDev ? `##DEV## ${document.title}` : document.title;
if (isDev) {
  $(`link[rel="icon"]`).replaceWith($.LINK.prop({href: `./devIco.png`, rel: `icon`}));
  window.jql = $;
  window.IS = $.IS;
  window.popup = $.Popup;
}
$.log(`Start documenter...`);
const randomNumber = (max, min = 0) => {
  [max, min] = [Math.floor(max), Math.ceil(min)];
  return Math.floor( (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 )
    * (max - min + 1) + min ); };
let documentationData = await fetch(`./documentation.json?v=${randomNumber(10000, 1000)}`).then(r => r.json());
$.log(`Fetched documenter json...`);
import styling from "./styling.js";
import clientHandling from "./HandlingFactory.js";
styling($);
$.log(`Applied styling...`);
const groupOrder = ['jql_About', 'static_About', 'instance_About', 'popup_About', 'debuglog_About'];
const groups = groupOrder.reduce((acc, group) =>
  [...acc, {name: group, displayName: group.slice(0, group.indexOf(`About`)).toUpperCase()}], []);
const sliceName = name => name.slice(name.indexOf(`_`) + 1);
const createNavigationItems = ({group, displayName}) => {
  const ul = $(`<ul class="navGroup closed" data-group="${displayName.toLowerCase()}"/>`, $.node(`#navigation`));
  ul.append($(`<li class="grouped">${displayName}<ul class="navGroupItems"></ul></li>`));
  Object.keys(documentationData).filter(v => v.startsWith(group.displayName.toLowerCase()))
    .sort( (a, b) => a.localeCompare(b) )
    .forEach(item => {
      const itemClean = item.replace(/([a-z])\$/gi, `$1_D`);
      $(`.navGroupItems`, ul[0])
        .append($(`<li data-key="${itemClean}"><div data-navitem="#${itemClean}">${
          sliceName(item)}</div></li>`));
    });
  return displayName;
};
const docsContainer = $.node(`.docs`);
const handler = clientHandling($);
$.delegate(`click`, handler);
$.delegate(`scroll`, `.docs`, handler);
const codeMapper = (code, i) => {
  const cleanedCode = code.trim()
    .replace(/[<>]/g, a => codeReplacements.get(a))
    .replace(/\n{3,}/g, codeReplacements.get(`reducebreaks`))
    .replace(/\n/g, codeReplacements.get(`linebreak`))
    .replace(/&[^(l|g)t;|amp;]/g, codeReplacements.get(`&`));

  return `<div class="exContainer"><h3 class="example">Example${
    i > 0 ? ` ${i + 1}` : ``}</h3><pre><code>${cleanedCode}</code></pre></div>`;
};
const convertExamples = descriptionValue => {
  const re = /(?<=<example>)(.|\n)*?(?=<\/example>)/gm;
  const exampleCode = (descriptionValue.match(re) || []).map( (code, i) => codeMapper(code, i) );

  return descriptionValue.replace(/<example>(.|\n)*?<\/example>/g, () => exampleCode.shift());
};

const groupWithExamples = description => /<example>/.test(description) ? convertExamples(description) : description;
const escHtml = str => str
  .replace(/</g, `&lt;`)
  .replace(/&lt;code/g, `<code`)
  .replace(/&lt;\/code/g, `</code`);
const paramStr2Div = value => Object.entries(value).map( ([key, val]) => {
  const prm = /_isobject/i.test(key) ? `[Object&lt;string, any>]` : key;
  return `<div class="param"><code>${escHtml(prm)}</code>: ${escHtml(val)}</div>`;
});

groups.forEach( group => {
  const displayName = createNavigationItems({group: group, displayName: group.displayName.slice(0, -1)});

  // create corresponding documentation items in docs
  Object.entries(documentationData)
    .filter( ([itemKey, value]) => itemKey.startsWith(`${group.displayName.toLowerCase()}`))
    .sort( ([key1,], [key2,]) => key1.localeCompare(key2))
    .forEach( ([itemName, itemValue]) => {
      itemValue.description = itemValue.description.trim();
      const itemNameClean = sliceName(itemName);
      let params = `<span/>`;
      let exampleCode = [];
      const itemGroupLookup = {
        instance: `[JQL instance].`,
        popup: `[JQL.Popup].`,
        debuglog: `[debugLog].`,
        static: `[JQL].`
      }

      if (itemValue.params?.length) {
        const paramDivs = itemValue.params.reduce((acc, value) => [...acc, paramStr2Div(value)], []);
        params = `<div><b>Parameters</b>${paramDivs.join('')}</div>`;
      }

      // insert formatted example code if applicable
      if (/<example>/.test(itemValue.description)) {
        itemValue.description = convertExamples(itemValue.description);
      }

      if (itemNameClean === `About`) {
        return $(`<div data-groupContainer="${displayName}" class="description">
          <h3 class="groupHeader" id="${group.name}">${displayName}</h3>${
          itemValue.description.replace(/\n{3,}/g, `\n`)}</div>`, docsContainer);
      }

      $(`
        <div class="paragraph">
          <h3 class="methodName" id="${itemName.replace(/([a-z])\$/gi, `$1_D`)}"><span class="group">${
            itemGroupLookup[itemName.slice(0, itemName.indexOf(`_`))]}</span>${itemNameClean}</h3>
          ${params}
          <div class="returnValue"><b>Returns</b>: ${itemValue.returnValue}</div>
          <div class="description">${itemValue.description.replace(/\n{2,}/g, `\n`)}</div>
        </div>`, docsContainer);
    });
});
$(`code`).each(setAllCodeStyling);
$.log(`Documenter json parsed to DOM.`);
// free some memory
documentationData = null;
// remove loading message
$(`.docs`).removeClass(`loading`);
//format the code blocks
Prism.highlightAll();
$.log(`Code formatting done.`);
// navigate to top
$(`#jql_About`).html(` (<span class="jqlTitle"><b>JQ</b>uery<b>L</b>ike</span>)`, true);
// display the first item
$(`[data-group="jql"]`).trigger(`click`);
$.log(`Navigation triggered.`);
$.log(`Documenter implementation took ${((performance.now() - perform)/1000).toFixed(3)} seconds`);
