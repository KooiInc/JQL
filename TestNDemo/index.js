import $ from "../index.js";
if (location.host.startsWith(`dev`)) {
  document.title += ` DEV`;
}
const {virtual: $$, log, debugLog} = $;

// initialize popup
const popup = $.popup();
const repeat = (str, n) => n > 0 ? Array(n).fill(str).join('') : str;

// activate logging all JQL events (hidden)
debugLog.on().toConsole.off().hide();
const apiLinkPrefix = `https://kooiinc.github.io/JQLDoc/`;

// Some methods used in handler delegates
const logActivation = (logBttn, active = true) => {
  if (!logBttn.isEmpty()) {
    logBttn.setData({on: +active});
    debugLog[active ? `show` : `hide`]();
  }
};

const createExternalLink = (href, txt) =>
  $$(`<a title="opens in new tab/window" target="_blank" class="ExternalLink" href="${href}">${txt}</a>`);

// create container for all generated html
$(`<div id="container">`).css({className: `MAIN`, position: `absolute`, top: 0, left: 0, right: 0, bottom: 0})
  .append($$(`<div id="JQLRoot"/>`)
    .css({position: `relative`, margin: `2rem auto`, maxWidth: `50vw`, display: `table`,})
  );
const JQLRoot = $(`#JQLRoot`);
const lb = $(`#logBox`).style({margin: `1rem auto`});
$(`#container`).prepend(lb);

// initialize styling for logging and a few elements (to create later)
initStyling();

// create a header
$(`<div id="StyledPara"></div>`)
  .addClass(`thickBorder`)
  .append( $([`<h2>Demo & test JQueryLike (JQL) library</h2>`,
    `<div>
      <i><b class="attention">Everything</b></i> 
      on this page was dynamically created using JQL.
    </div>`,
    `<div>
      <b class="arrRight">&#8594;</b> 
      Check the HTML source &mdash; right click anywhere, and select 'View page source'.
    </div>`]) )
  .appendTo(JQLRoot)
  // and prepend a comment
  .prepend($(`<!--p#JQLRoot contains all generated html-->`));

// add all event handling delegates defined in function [getDelegates4Document]
getDelegates4Document()
  .forEach(([type, targetedHandlers]) =>
    targetedHandlers.forEach(handler =>
      $.delegate(type, handler.target, ...handler.handlers)));

// generic delegates (on document) from the static $.delegate
const someClicks = [
  evt => evt.target.closest(`.exampleText`) && log(`HI from div.exampleText (you clicked it)`) ];
$.delegate(`click`, ...someClicks);

// onclick is not allowed, so will be removed on element creation
const msg = `hi there, you won't see me`;
$(`<div id="nohandling" onclick="alert('${msg}')"></div>`)
  .html(`<h1>Hell! O world.</h1>`).appendTo(JQLRoot);

// script and data attribute will be removed, but you can add data-attributes later
// styles are inline here
$([`<script id="noscripts">alert('hi');</script>`, `<div data-cando="1" id="delegates">Hi 1</div>`])
  .setData({hello: "Added post creation"})
  .html(` [you may <b><i>click</i> me</b>] `, true)
  .style({cursor: `pointer`})
  .appendTo(JQLRoot);

// <notallowed> is ... well ... not allowed, so will be removed
// styles inline
$([`<notallowed id="removal_immanent"></notallowed>`,
  `<div>Hi 2</div>`])
  .text(` [Hey! I am clickable too!]`, true)
  .style({color: `red`, marginTop: `0.7rem`, cursor: `pointer`})
  // add a click handlers
  .on(`click`, (_, self) => {
    const currentColor = self.first().style.color;
    // o look, a state machine ;)
    self.style({
      color: currentColor === `red`
        ? `green` : currentColor === `orange`
          ? `red` : `orange`
    });
  })
  .appendTo(JQLRoot);

// create a few buttons. Some already contain an event handler (delegated)
const cssDefaultBttn = $$(`<button id="defaultCSS">show default css</button>`)
const cssPopupBttn = $$(`<button id="popupCSS">show popup css</button>`)
cssPopupBttn.on(`click`, () => showStyling(`JQLPopupCSS`, cssDefaultBttn));
cssDefaultBttn.on(`click`, () => showStyling(`JQLStylesheet`, cssPopupBttn));

const bttnBlock = $(`<p id="bttnblock"></p>`).append(...[
    $$(`<button id="logBttn" data-on="0" title="show/hide the logged activities"/>`),
    $$(`<button id="clearLog">Clear Log box</button>`).on(`click`, debugLog.clear),
    $$(`<button id="showComments">Show document comments</button>`)
      .prop(`title`, `Show content of comment elements in a popup`),
    $$(`<button id="showCSS">Show custom CSS</button>`)
      .prop(`title`, `Show the dynamically created styling in a popup`)
      .on(`click`, _ => showStyling(`JQLStylesheet`, cssPopupBttn)),
    $$(`<button>Modal popup demo</button`).on(`click`, modalDemo),
    $$(`<button>Github</button>`)
      .on(`click`, () => {
          popup.create( $(`
          <p>
            The repository can be found  @${
              createExternalLink(`https://github.com/KooiInc/JQLClassFree`,
                                 `github.com/KooiInc/JQLClassFree`).outerHtml()}<br>
            The documentation resides @${
              createExternalLink(apiLinkPrefix, `kooiinc.github.io/JQLDoc`).outerHtml()}
          </p>`));
        }
      )])
  .appendTo(JQLRoot);

$(`button`)
  .style({marginRight: `4px`})
  .each( (btn, i) => btn.dataset.index = `bttn-${i}` ); // each demo

// Documentation links
// -------------------
// styled via intermediate class
// create link to documentation root
const apiLink = createExternalLink(apiLinkPrefix, `JQL Api documentation`).appendTo(JQLRoot);
$$(`
  <div>
    cf the first example in the 
  </div>`)
  .css({
    className: `exampleText`,
    borderTop: `2px dotted #999`,
    borderLeft: `5px solid red`,
    paddingLeft: `5px`,
    display: `block`,
    maxWidth: `800px`,
    'margin-top': `1rem`,
    'padding-top': `0.2rem`, })
  .prepend($.virtual(`<span>Next element</span>`))
  .append(createExternalLink(`${apiLinkPrefix}/module-JQL.html`, `documentation`))
  .html(` for module <code>JQLExtensions</code><br>`, true)
  .appendTo(JQLRoot);

// example from ExtendedNodelistLambdas api doc
$$(`<div id="helloworld"/>`)
  .text(`Example: hello ... world`)
  .append($(`<span> OK</span>`))
  .css({
    marginTop: `0.5rem`,
    border: `3px solid green`,
    padding: `5px`,
    fontSize: `1.2em`,
    display: `inline-block`, } )
  .appendTo(JQLRoot)
  .find$(`span`)
  .css({className: `okRed`, color: `red`});

// append multiline comment to p#JQLRoot
$$(`<!--Hi, I am a multiline HTML-comment.
     So, you can add plain comments using JQL
     A comment may be injected into a child 
     element (using the [root] parameter
     combined with a position-->`).appendTo(JQLRoot),


// a comment can also be appended using append/appendTo/prepend/prependTo
$$(`<!--I was appended to div#JQLRoot using .appendTo-->`).appendTo(JQLRoot);
$$(`<!--I was PREpended to div#JQLRoot using .prependTo-->`).prependTo(JQLRoot);

// comment insertion test
$(`<!--Comment @ #JQLRoot beforebegin (verify it in DOM tree)-->`, JQLRoot, `beforebegin`);
$(`<!--Comment @ #bttnblock afterend (verify it in DOM tree) -->`, $(`#bttnblock`), `afterend`);
$(`<!--Comment @ #bttnblock afterbegin (verify it in DOM tree) -->`, $(`#bttnblock`), `afterbegin`);

// display code of this file
// -------------------------
$$(`<div>code used in this example (index.js)</div>`)
  .setData( {updown: `\u25BC View `, forid: `code`, hidden: 1} )
  .addClass(`exampleText`, `codeVwr`)
  .appendTo(JQLRoot);

// append actual code to document
injectCode().then(_ => Prism.highlightAll());

popup.createTimed(`Page done, enjoy 😎!`, 2);

function modalDemo() {
  const closeBttn = $$(`<button id="modalCloseTest">Close me</button>`)
    .css({marginTop: `0.5rem`})
    .delegate(`click`, `#modalCloseTest`,
      _ => popup.removeModal(() => popup.createTimed(`Modal closed, you're ok, bye.`, 2)));
  const tryOpenAnotherBttn =  $$(`<button id="secondModalTest">Try to open another popup</button>`)
    .css({marginTop: `0.5rem`})
    .delegate(`click`, `#secondModalTest`, _ => popup.create(`No. You can't`));
  popup.create(`
    <p>
      Hi. This box is <i>really</i> modal.
      <br>There is no close icon and clicking outside this box does nothing.
      <br>In other words: you can only close this using the button below.
      <br>Also, while this popup is open, you can't open another (second button
        or click outside the popup).
      <br>${closeBttn.outerHtml()} ${tryOpenAnotherBttn.outerHtml()}
    </p>`, true);
}

// create a few style rules in <style id="JQLCreatedCSS">
function initStyling() {
  const setStyleRule = $.setStyle;
  styleRules().forEach(rule => setStyleRule(rule));
}

// create a few delegated handler methods
function getDelegates4Document() {
  return Object.entries({
    click: [{
      target: `#delegates`,
      handlers: [
        (_, self) => {
          clearTimeout(+self.getData('timer') || 0);
          self.toggleClass(`green`);
          $(`[data-funny]`).remove();
          self.append( self.hasClass(`green`)
            ? `<span class="green" data-funny>now I'm  green</span>`
            : `<span data-funny>now I'm black</span>`
          );
          $(self).setData({timer: setTimeout(() => self.find$(`[data-funny]`)?.remove(), 2500)});
          log(`That's funny ... ${self.find$(`[data-funny]`).html()}`);
        },
      ]
    },
    {
      target: `#logBttn`,
      handlers: [(_, self) => logActivation(self, !+(self.getData(`on`, 1))),],
    }, {
      target: `#showComments`,
      handlers: [
        _ => popup.create(`<h3>*All Comments in this document:</h3>${
          allComments([...document.childNodes]).join(``)}`), ]
    }, {
      target: `.codeVwr`,
      handlers: [
        (_, self) => {
          const codeElem = $(`#${self.getData(`forid`)}`);

          if (!+self.getData(`hidden`)) {
            codeElem.removeClass(`down`);
            return $(self).setData({updown: '\u25bc View ', hidden: 1})
          }

          $(`.down`).each(el => el.classList.remove(`down`));
          $(`[data-forid]`).setData({updown: '\u25bc View ', hidden: 1});
          codeElem.addClass(`down`);
          $(self).setData({updown: '\u25b2 Hide ', hidden: 0});
        }
      ]
    }]
  });
}

function allComments(root, result = []) {
  for (const node of root) {

    if (node.childNodes && node.childNodes.length) {
      allComments([...node.childNodes], result);
    }

    if (node.nodeType === 8) {
      const parent = node.parentNode;
      let parentStr = `&#8226; in <b>??</b>`;

      if (parent) {
        const className = parent.classList.length && `.${[...parent.classList][0]}` || ``;
        parentStr = `&#8226; in <b>${
          parent.nodeName.toLowerCase()}${
          parent.id ? `#${parent.id}` : className ? className : ``}</b>`;
      }

      const spacing = repeat(`&nbsp;`, 7);
      result.push(`<div class="cmmt">${parentStr}<br>${repeat(`&nbsp;`, 2)}&lt;!--${
        node.textContent.replace(/</, `&lt;`).replace(/\n/g, `<br>${spacing}`)}--&gt;</div>`);
    }
  }

  return result;
}

async function injectCode() {
  const source = await fetch("./index.js").then(r => r.text());
  $(`#JQLRoot`)
  .append( $(`
    <div class="upDownFader" id="code">
      <pre class="language-javascript"><code class="language-javascript js line-numbers">${
        source.trim().replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)}</code></pre>
    </div>`));
}

function showStyling(styleId, bttn) {
  const theStyle = $(`style#${styleId}`);
  if (theStyle.isEmpty()) { return; }
  const getMediaRuleSelector = rule => rule.cssText.split(/\{/).shift().trim();
  const rules = theStyle[0].sheet.cssRules;
  const mapRule = (rule, selector) => `${selector} {\n  ${
    rule.cssText
      .split(/[{}]/)[1]
      .split(`;`)
      .join(`;\n  `)
      .replace(/\s+$/, ``)}\n}`;
  const mapping = rule => {
    const mediaRules = rule.media;
    const selectr = mediaRules ? getMediaRuleSelector(rule) : rule.selectorText;
    return mediaRules
      ? `${selectr} {\n    ${[...rule.cssRules].map(mapping)
        .join(``)
        .replace(/{\n/g, `{\n    `)
        .replace(/;\n/g, `;\n    `)
        .replace(/\n}/, `\n}`)}\n}`
      : `${mapRule(rule, selectr)}`;
  }
  const mappedCSS = [...rules].map(mapping).join(`\n\n`);
  return popup.create($$(`<div class="cssView"><h3>style#${styleId} current content</h3>${mappedCSS}</div>`)
    .prepend($$(`<p/>`).append(bttn)));
}

function styleRules() {
  return [
    `body {
      font: normal 12px/15px verdana, arial;
      margin: 2rem;
    }`,
    `pre[class*='language-'] {
      position: relative;
      display: block;
    }`,
    `code:not([class*=language-]) {
      color: green;
      font-family: 'Courier New', Courier, monospace;
      position: relative;
    }`,
    `.green {
      color: green;
    }`,
    `#StyledPara { padding: 6px; }`,
    `#StyledPara h2 { marginTop: 6px; }`,
    `.thickBorder {
      border: 5px solid green;
      border-width: 5px;
      padding: 0 0.5rem;
      display: inline-block;
    }`,
    `a.ExternalLink {
      textDecoration: none;
      color: blue;
      background-color: #EEE;
      padding: 3px;
      font-weight: bold; 
    }`,
    `.codeVwr {
      cursor: pointer;
      color: #777;
      background-color: #EEE;
      padding: 3px;
      font-weight: bold;
    }`,
    `.codeVwr:before { 
      content: ' 'attr(data-updown); 
    }`,
    `.upDownFader {
      max-height: 0;
      opacity: 0;
      width: 0;
      position: absolute;
      overflow: hidden;
      transition: all 0.7s;
    }`,
    `.upDownFader.down {
      max-height: calc(100% - 1px);
      position: relative;
      width: 811px;
      opacity: 1;
      overflow: auto;
    }`,
    `#logBttn[data-on='0']:before { content: 'Show logs'; }`,
    `#logBttn[data-on='1']:before { content: 'Hide logs'; }`,
    `b.arrRight {
      vertical-align: baseline;
      font-size: 1.2rem;
    }`,
    `.cmmt { color: #888; }`,
    `.cssView {
      white-space: pre-wrap;
      padding-bottom: 1rem;
      overflow: hidden;
    }`,
    `@media screen and (width < 1400px) {
      #bttnblock button { 
        margin-top: 0.4rem; 
      }
    }`,
    `.hidden { display: none; }`,
    `b.attention {
      color: red, 
      fontSize: 1.2em; 
     }`
  ];
}