// import {createElementFromHtmlString, element2DOM} from "./DOM.js";
// import { setStyle } from "./Styling.js";
export default initModal;

function initModal($) {
  initStyling($);
  let timer = null;
  const isTouchDevice = "ontouchstart" in document.documentElement;
  const clickOrTouch =  isTouchDevice ? "touchend" : "click";
  $().delegate( clickOrTouch, `#closer, .between`, () => {
    $(".between").remove();
    $(".popupBox").remove();
  } );
  const positionStuff = (theBox, closerHandle) => {
    theBox.addClass(`showAndCenter`);

    if (theBox.first().offsetHeight <= 50) {
      theBox.styleInline({padding: `8px`});
    }

    if(closerHandle) {
      closerHandle.styleInline({
        position: `fixed`,
        left: `${theBox.first().offsetWidth - (Math.floor(closerHandle.first().offsetWidth)/2)}px` });
    }
  };
  const endTimer = () => timer && clearTimeout(timer);
  const create = (message, omitOkBttn) => {
    endTimer();
    closeIfActive();
    let okIcon = null;
    window.scrollTo(0, 0);
    $(`<div class="between"></div>`)
    const modalBox = $(`
      <div class="popupBox">
        <div data-modalcontent></div>
      </div>` );
    modalBox.find$(`[data-modalcontent]`).append($(message));

    if (!omitOkBttn) {
      okIcon = $(`<span id="closer" class="closeHandleIcon"></span>`, modalBox.first(), $.insertPositions.AfterBegin);
    }

    timer = setTimeout(() => positionStuff(modalBox, okIcon), 10);
  };
  const remove = callback => {
    endTimer();
    timer = setTimeout(() => {
      closeIfActive();
      if (callback && callback instanceof Function) { callback(); }
    }, 300); // 300 is the fading time (ease-out)
    return timer;
  };
  const timed = (message, closeAfter = 2, callback = null, omitOkBttn = false ) => {
    closeIfActive();
    create(message, omitOkBttn);
    const remover = callback ? () => remove(callback) : remove;
    timer = setTimeout(remover, closeAfter * 1000);
  };

  return {
    create: create,
    createTimed: timed,
    remove: remove
  };
};

function initStyling($) {
  const styling = {
    '.between': {
      position: 'absolute',
      left: '0',
      right: '0',
      top: '0',
      bottom: '0',
      margin: '0',
      overflow: 'hidden',
      zIndex: '1000',
      backgroundColor: 'white',
      opacity: '0.4'
    },
    '.popupBox': {
      maxWidth: '30vw',
      maxHeight: '40vh',
      backgroundColor: 'white',
      boxShadow: '3px 2px 12px #777',
      borderRadius: '6px',
      zIndex: '1001',
      opacity: '0',
      transition: 'opacity ease-out 0.6s 0s',
      font: 'normal 13px/17px Verdana, Arial, sans-serif'
    },
    '.popupBox.showAndCenter': {
      margin: '0',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: '1',
      transition: 'opacity ease-in 0.4s 0s'
    },
    '.popupBox div[data-modalcontent]': {
      overflow: 'auto',
      minHeight: `1.8rem`,
      maxHeight: 'inherit',
      clear: 'both',
      padding: '0 6px'
    },
    '.popupBox p, .popupBox h3': { marginTop: '0.4em', marginBottom: '0' },
    '.popupBox h3': { marginTop: '0.3em', fontSize: '0.9em' },
    '.closeHandleIcon': {
      float: 'right',
      cursor: 'pointer',
      marginTop: '-16px',
      width: '32px',
      height: '32px',
      background: "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat"
    }
  };
  Object.entries(styling).forEach( ([selector, rules]) => $.setStyle(selector, rules, `modalCss`));
}