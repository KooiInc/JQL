import $ from "../index.js";
window.jql = $;
const started = performance.now();
if (location.host.startsWith(`dev`)) {
  $(`head link[rel="icon"]`).remove();
  $(`head`).append($.LINK.attr({href: `/favNICon.ico`, rel: `icon`}));
  document.title = `##DEV## ${document.title}`;
}
const {virtual: $$, log, debugLog} = $;
const repeat = (str, n) => n > 0 ? Array(n).fill(str).join('') : str;
$.fn( `addTitle`, (self, ttl) => { self.prop(`title`, ttl); return self; } );

// activate logging all JQL events (hidden)
debugLog.on().toConsole.off().reversed.on().hide();
const apiLinkPrefix = `//github.com/KooiInc/JQL`;

// Some methods used in handler delegates
const logActivation = (logBttn, active = true) => {
  if (!logBttn.is.empty) {
    logBttn.data.add({on: +active});
    debugLog[active ? `show` : `hide`]();
  }
};

const createExternalLink = (href, txt) =>
  $$(`<a class="InternalLink" href="${href}">${txt}</a>`).addTitle("opens in current tab/window");

// initialize styling for logging and a few elements (to create later)
$.editCssRules(...getStyleRules())

// create container for all generated html
const container = $.div( {
  content: $(`#logBox`).style({margin: `1rem auto`})
    .andThen($.p({props: {id: `JQLRoot`}})
    .andThen($.comment(`p#JQLRoot contains all generated html`), true)),
  props: {id: `container`},
  cssClass: `MAIN`,
  toDOM: true } );

const JQLRoot = $(`#JQLRoot`);

// create the header
//`<b class="attention">Everything</b>`
let headerContent = $.h2(`Demo & test JQueryLike (JQL) library`)
  .andThen( $.div( [
    $.i( $.b( { content: `Everything`, cssClass: `attention` } ) ),
    ` on this page was dynamically created using JQL.` ] )
  ).andThen(`
   <div><b class="arrRight">&#8594;</b> 
    Check the HTML source &mdash; 
     right click anywhere, and select 'View page source'.</div>`);

$.div({content: headerContent, props: {id: `StyledPara`}, cssClass: `thickBorder`})
  .appendTo( JQLRoot );

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
$([`<script id="noscripts">alert('hi');</script>`, `<div data-cando="1" id="delegates">Hi 1</div>`], JQLRoot)
  .data.add({hello: "Added post creation"})
  .html(` [you may <b><i>click</i> me</b>] `, true)
  .style({cursor: `pointer`})

// <notallowed> is ... well ... not allowed, so will be removed
// styles inline
$([`<notallowed id="removal_imminent"></notallowed>`,
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
const cssBttns = {
  defaultCSS: $$(`<button data-sheet-id="JQLPopupCSS" data-switch-bttn="popupCSS">show popup css</button>`),
  popupCSS: $$(`<button data-sheet-id="JQLStylesheet" data-switch-bttn="defaultCSS">show default css</button>`),
};
$.delegate(`click`, `[data-switch-bttn]`,
  evt => showStyling(evt.target.dataset?.sheetId, cssBttns[evt.target.dataset?.switchBttn]));

const bttnBlock = $(`<p id="bttnblock"></p>`).append(...[
  $$(`<button id="logBttn" data-on="0" title="show/hide the logged activities"/>`),
  $$(`<button id="clearLog">Clear Log box</button>`).on(`click`, debugLog.clear),
  $$(`<button id="showComments">Show document comments</button>`)
    .prop(`title`, `Show content of comment elements in a popup`),
  $$(`<button id="showCSS">Show custom CSS</button>`)
    .prop(`title`, `Show the dynamically created styling in a popup`)
    .on(`click`, evt => showStyling(`JQLStylesheet`, cssBttns.defaultCSS)),
  $$(`<button>Modal popup demo</button>`).on(`click`, modalDemo),
  $$(`<button>Github</button>`)
    .on(`click`, () => {
        $.Popup.show({
         content: $$(`
          <p>
            The repository can be found  @${
          createExternalLink(`${apiLinkPrefix}`,
            `github.com/KooiInc/JQL`).outerHtml}<br>
            The documentation resides @${
          createExternalLink(`//kooiinc.github.io/JQL/Docs`, `kooiinc.github.io/JQL/Docs`).outerHtml}
          </p>`) }
        );
      }
    )])
  .appendTo(JQLRoot);

$(`button`)
  .style({marginRight: `4px`})
  .each( (btn, i) => btn.dataset.index = `bttn-${i}` ); // each demo

// styled via named class .exampleText
$$(`<div>styling`)
  .css({
    className: `exampleText`,
    borderTop: `2px dotted #999`,
    borderLeft: `5px solid red`,
    paddingLeft: `5px`,
    display: `block`,
    maxWidth: `800px`,
    'margin-top': `1rem`,
    'padding-top': `0.2rem`, })
  .prepend($$(`<span>Some </span>`))
  .html(` examples`, true)
  .appendTo(JQLRoot);

// styled with intermediate class
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
$$($.comment(`Hi, I am a multiline HTML-comment.
     So, you can add plain comments using JQL
     A comment may be injected into a child 
     element (using the [root] parameter
     combined with a position`)).appendTo(JQLRoot),


// a comment can also be appended using append/appendTo/prepend/prependTo
$$(`<!--I was appended to div#JQLRoot using .appendTo-->`).appendTo(JQLRoot);
$$(`<!--I was PREpended to div#JQLRoot using .prependTo-->`).prependTo(JQLRoot);

// comment insertion test (note: this works with before-/afterMe/andThen too now)
$($.text(`Comment @ #JQLRoot beforebegin (verify it in DOM tree)`, true), JQLRoot, $.at.BeforeBegin);
$(`<!--Comment @ #bttnblock afterend (verify it in DOM tree) -->`, $(`#bttnblock`), $.at.AfterEnd);
$(`<!--Comment @ #bttnblock afterbegin (so, prepend) verify it in DOM tree) -->`, $(`#bttnblock`), $.at.AfterBegin);

// display code of this file
// -------------------------
$$(`<div>code used in this example (index.js)</div>`)
  .data.add( {updown: `\u25BC View `, forid: `code`, hidden: 1} )
  .addClass(`exampleText`, `codeVwr`)
  .appendTo(JQLRoot);

// append actual code to document
injectCode().then(_ => Prism.highlightAll());
$(`#logBox`).style({maxWidth: `${$(`#JQLRoot`).dimensions.width}px`});
const donePerf = (performance.now() - started)/1000;
const perfDiv = $.div(`Page creation took ${donePerf.toFixed(3)} seconds`)
  .andThen(`<div>All done, enjoy 😎!</div>`);
$.Popup.show({content: perfDiv, closeAfter: 5 });


function modalDemo() {
  const callbackAfterClose = () => $.Popup.show({content: `Modal closed, you're ok, bye.`, closeAfter: 2});
  const closeBttn = $$(`<button id="modalCloseTest">Close me</button>`)
    .css({marginTop: `0.5rem`}).on(`click`, () => $.Popup.removeModal());
  $.Popup.show({
      content: `
        <p>
          Hi. This box is <i>really</i> modal.
          <br>There is no close icon and clicking outside this box does nothing.
          <br>In other words: you can only close this using the button below.
          <br>Also, while this popup is open, you can't open another (second button
            or click outside the popup).
          <br>${closeBttn.outerHtml}
        </p>`,
      modal: true,
      callback: callbackAfterClose,
      warnMessage: `There's only <b><i>one</i></b> escape`,
  });
}

// create a few delegated handler methods
function getDelegates4Document() {
  return Object.entries({
    click: [{
      target: `#delegates`,
      handlers: [
        (_, self) => {
          clearTimeout(+self.data.get('timer') || 0);
          self.find$(`span.funny`)?.remove();
          self.toggleClass(`green`);
          $(`[data-funny]`).remove();
          const colr = self.hasClass(`green`) ? `green` : `black`;
          self.append( $.span({ content: `Funny! Now I'm  ${colr}`, cssClass: `funny` }));
          self.data.add({timer: setTimeout(() => self.find$(`span.funny`)?.remove(), 2500)});
          log(`That's funny ... ${self.find$(`.black,.green`).html()}`);
        },
      ]
    },
      {
        target: `#logBttn`,
        handlers: [(_, self) => logActivation(self, !+(self.data.get(`on`, 1))),],
      }, {
        target: `#showComments`,
        handlers: [
          _ => {
            const content = $.virtual(`<div>`)
              .append($(`<h3>*All Comments in this document:</h3>`)
                .Style.inline({marginTop: 0, marginBottom: `0.5rem`}))
              .HTML.append(allComments([...document.childNodes]).join(``));
            $.Popup.show({content});
          },
        ]
      }, {
        target: `.codeVwr`,
        handlers: [
          (_, self) => {
            const codeElem = $(`#${self.data.get(`forid`)}`);

            if (!+self.data.get(`hidden`)) {
              codeElem.removeClass(`down`);
              return self.data.add({updown: '\u25bc View ', hidden: 1})
            }

            $(`.down`).each(el => el.classList.remove(`down`));
            $(`[data-forid]`).data.add({updown: '\u25bc View ', hidden: 1});
            codeElem.addClass(`down`);
            self.data.add({updown: '\u25b2 Hide ', hidden: 0});
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
  if (theStyle.is.empty) { return; }
  const getMediaRuleSelector = rule => rule.cssText.split(/\{/).shift().trim();
  const rules = theStyle[0].sheet.cssRules;
  const mapRule = (rule, selector) => `${selector} {\n  ${
    rule.cssText
      .replace(/(data:image)(.+[^;])+;/, `$1 [...]");`)
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
  };
  const mappedCSS = [...rules].map(mapping).join(`\n\n`);
  return $.Popup.show({
    content: $$(`<div class="cssView"><h3>style#${styleId} current content</h3>${mappedCSS}</div>`)
      .prepend($$(`<p></p>`).append(bttn.HTML.get(1))) });
}

function getStyleRules() {
  return [
    `body {
      font: normal 13px/16px verdana, arial;
      margin: 2rem;
    }`,
    `#JQLRoot { 
      position: relative; 
      margin: 2rem auto; 
      maxWidth: 50vw; 
      display: table }`,
    `.MAIN { 
      position: absolute; 
      inset: 0; 
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
    `a.InternalLink {
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
       white-space: pre;
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
      color: red;
      fontSize: 1.2em; 
     }`
  ];
}
