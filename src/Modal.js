import $ from "./JQueryLike.js";
export default initModal;

function initModal() {
  initStyling($);
  let timer = undefined;
  let intermediateCallback;
  const isTouchDevice = "ontouchstart" in document.documentElement;
  let popupBox, between, closer;
  const clickOrTouch =  isTouchDevice ? "touchend" : "click";
  const positionCloserHandle = () => {
    const [modalDim, iconDim]  = [popupBox.dimensions(),  closer.dimensions()];
    closer.styleInline({
      position: `fixed`,
      top: `${modalDim.top - (iconDim.height/2)}px`,
      left: `${modalDim.right - (iconDim.width/2)}px`,
    });
  };
  const createBoxIfNotExists = () => {
    if ($(`.popupBox`).isEmpty()) {
      popupBox = $(`<div class="popupBox">
           <div data-modalcontent></div>
         </div>` );
      closer = $(`<span id="closer" class="closeHandleIcon"></span>`)
        .prop(`title`, `Click here or anywhere outside the box to close`);
      between = $(`<div class="between"></div>`)
      new ResizeObserver(positionCloserHandle).observe(popupBox.first());
    }
  };
  const hideModal = () => {
    $(`#closer, .between, .popupBox`).removeClass(`active`);
    $(`body`).removeClass(`popupActive`);
  };
  const positionAndShow = (theBox, closerHandle) => {
    $(`.between, .popupBox`).addClass(`active`);
    popupBox.styleInline({height: `auto`, width: `auto`});
    const body = $(`body`);
    body.addClass(`popupActive`);
    const [betweenH, bodyDim] = [between.dimensions().height, body.dimensions()];

    if (betweenH < bodyDim) {
      between.styleInline({height: `${bodyDim.bottom}px`});
    }

    if (betweenH >= bodyDim) {
      between.styleInline({bottom: 0});
    }
    if (closerHandle) {
      closerHandle.addClass(`active`);
      positionCloserHandle(popupBox);
    }
  };
  const endTimer = () => timer && clearTimeout(timer);
  const timed = (message, closeAfter = 2, callback = null, omitOkBttn = false ) => {
    hideModal();
    create(message, omitOkBttn);
    const remover = callback ? () => remove(callback) : remove;
    timer = setTimeout(remover, closeAfter * 1000);
  };
  const create = (message, omitOkBttn, callback) => {
    intermediateCallback = callback;
    if (!message.isJQL && message.constructor !== String) {
      return timed($(`<b style="color:red">Modal not created: invalid input</b>`), 2);
    }

    createBoxIfNotExists();
    endTimer();
    hideModal();
    popupBox.find$(`[data-modalcontent]`)
      .empty()
      .append( message.isJQL ? message : $(`<div>${message}</div>`) );
    positionAndShow(popupBox, omitOkBttn ? undefined : closer)
  };
  const remove = evtOrCallback => {
    endTimer();
    const callback = evtOrCallback instanceof Function ? evtOrCallback : intermediateCallback;
    if (callback && callback instanceof Function) { intermediateCallback = undefined; return callback(); }
    hideModal();
  };

  $().delegate( clickOrTouch, `#closer, .between`,  remove );

  return {
    create: create,
    createTimed: timed,
    remove: remove
  };
}

function initStyling($) {
  const styling = {
    'body.popupActive': {
      overflow: `hidden`,
      transition: 'all linear 0.6s 0s',
    },
    '.between': {
      position: 'absolute',
      zIndex: '-1',
      left: '0',
      right: '0',
      top: '0',
      bottom: '0',
      margin: '0',
      overflow: 'hidden',
      backgroundColor: 'white',
      opacity: 0,
      transition: 'all linear 0.6s 0s',
    },
    '.between.active': {
      zIndex: 2,
      opacity: 0.5,
    },
    '.popupBox': {
      maxWidth: '30vw',
      maxHeight: '40vh',
      backgroundColor: 'white',
      boxShadow: '3px 2px 12px #777',
      borderRadius: '6px',
      zIndex: '3',
      opacity: '0',
      padding: `8px 16px`,
      overflow: `auto`,
      transition: 'opacity linear 0.6s 0s',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      font: 'normal 13px/17px Verdana, Arial, sans-serif',
      resize: `none`,
    },
    '.popupBox.active': {
      opacity: '1',
      resize: `both`,
    },
    '.popupBox div[data-modalcontent]': {
      minHeight: `1rem`,
      maxHeight: 'inherit',
      clear: 'both',
      padding: '4px 6px'
    },
    '.popupBox p, .popupBox h3': { marginTop: '0.4em', marginBottom: '0' },
    '.popupBox h3': { marginBottom: '0.5em', fontSize: '1.1em' },
    '.closeHandleIcon': {
      position: `fixed`,
      cursor: 'pointer',
      zIndex: -1,
      opacity: 0,
      width: '32px',
      height: '32px',
      transition: 'opacity linear 0.4s 0s',
      background: "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat"
    },
    '.closeHandleIcon.active': {
      zIndex: 4,
      opacity: 1,
    }
  };
  Object.entries(styling).forEach( ([selector, rules]) => $.setStyle(selector, rules, `modalCss`));
}