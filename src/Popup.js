import $ from "./JQueryLike.js";
export default popupFactory;

function popupFactory() {
  initStyling();
  let savedTimer, savedCallback, savedModalState;
  const wrappedBody = $(document.body);
  const positionCloserHandle = () => {
    if (!closer.hasClass(`active`)) { return; }
    const [modalDim, iconDim]  = [popupBox.dimensions(),  closer.dimensions()];
    closer.styleInline({
      position: `fixed`,
      top: `${modalDim.top - (iconDim.height/2)}px`,
      left: `${modalDim.right - (iconDim.width/2)}px`,
    });
  };
  const createElements = _ => {
    const popupBox =
      $(`<div class="popupBox">
         <div data-modalcontent></div>
       </div>`);
    const closer = $(`<span id="closer" class="closeHandleIcon"></span>`)
      .prop(`title`, `Click here or anywhere outside the box to close`);
    const between = $(`<div class="between"></div>`);
    const resizeObserver = new ResizeObserver(positionCloserHandle);
    resizeObserver.observe(popupBox.first());
    resizeObserver.observe(wrappedBody.first());
    return [popupBox, between, closer,];
  };
  const [popupBox, between, closer] = createElements();
  const clickOrTouch =  "ontouchstart" in document.documentElement ? "touchend" : "click";
  const stillOpen = () => {
    alert(`A modal window is still open, make sure it is closed first!`);
    return true;
  }
  const checkActiveModal = () => !savedModalState && popupBox.hasClass(`active`) && stillOpen();
  const hideModal = () => {
    $(`#closer, .between, .popupBox`).removeClass(`active`);
  };
  const activate = (theBox, closeHndl) => {
    $(`.between, .popupBox`).addClass(`active`);
    popupBox.styleInline({height: `auto`, width: `auto`});
    const [betweenH, bodyDim] = [between.dimensions().height, wrappedBody.addClass(`popupActive`).dimensions()];
    between.styleInline( {bottom: betweenH <= bodyDim.height ? `-${bodyDim.bottom}px` : 0 } );

    if (closeHndl) {
      closeHndl.addClass(`active`);
      positionCloserHandle();
    }
  };
  const endTimer = () => savedTimer && clearTimeout(savedTimer);
  const createTimed = (message, closeAfter = 2, callback = null ) => {
    if (checkActiveModal()) { return; }
    savedModalState = true;
    hideModal();
    create(message);
    const remover = callback ? () => remove(callback) : remove;
    savedTimer = setTimeout(remover, closeAfter * 1000);
  };
  const doCreate = (message, reallyModal, callback) => {
    savedModalState = !reallyModal;
    savedCallback = callback;

    if (!message.isJQL && message.constructor !== String) {
      return createTimed($(`<b style="color:red">Modal not created: invalid input</b>`), 2);    }

    endTimer();
    popupBox.find$(`[data-modalcontent]`)
      .empty()
      .append( message.isJQL ? message : $(`<div>${message}</div>`) );
    activate(popupBox, !savedModalState ? undefined : closer);
  }
  const create = (message, reallyModal = false, callback) =>
    !checkActiveModal() && doCreate(message, reallyModal, callback);


  const remove = evtOrCallback => {
    endTimer();

    if (!savedModalState) { return; }

    const callback = evtOrCallback instanceof Function ? evtOrCallback : savedCallback;

    if (callback && callback instanceof Function) {
      savedCallback = undefined;
      return callback();
    }

    hideModal();
    const time2Wait = parseFloat(popupBox.computedStyle(`transitionDuration`)) * 1000;
    savedTimer = setTimeout(() => wrappedBody.removeClass(`popupActive`), time2Wait);
  };

  $().delegate( clickOrTouch, `#closer, .between`,  remove );

  return {
    create,
    createTimed,
    remove,
    removeFromModal: callback => { savedModalState = true; remove(callback); }
  };
}

function initStyling() {
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
      transition: 'all linear 0.3s',
    },
    '.between.active': {
      zIndex: 2,
      opacity: 0.5,
    },
    '.popupBox': {
      position: 'fixed',
      maxWidth: '30vw',
      maxHeight: '40vh',
      backgroundColor: 'white',
      boxShadow: '3px 2px 12px #777',
      borderRadius: '6px',
      zIndex: -1,
      opacity: '0',
      overflow: `auto`,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity linear 0.6s',
      font: 'normal 13px/17px Verdana, Arial, sans-serif',
    },
    '.popupBox.active': {
      zIndex: 3,
      opacity: '1',
      resize: `both`,
    },
    "@media screen and (min-width: 320px) and (max-width: 1200px)": {
      mediaSelectors: {
        ".popupBox": {
          maxWidth: `75vw`,
          maxHeight: `30vh`,
        },

      }
    },
    '.popupBox div[data-modalcontent]': {
      minHeight: `1rem`,
      maxHeight: 'inherit',
      clear: 'both',
      // padding: '8px'
    },
    '.popupBox p, .popupBox div': { margin: '0.4rem 0', padding: `0 6px` },
    '.popupBox p:nth-child(1), .popupBox div:nth-child(1)': { margin: '1rem 0' },
    '.popupBox h3': { marginBottom: '0.5em', fontSize: '1.1em' },
    '.closeHandleIcon': {
      position: `fixed`,
      cursor: 'pointer',
      zIndex: -1,
      opacity: 0,
      width: '32px',
      height: '32px',
      background: "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat"
    },
    '.closeHandleIcon.active': {
      zIndex: 4,
      opacity: 1,
    }
  };
  Object.entries(styling).forEach( ([selector, rules]) => $.setStyle(selector, rules, `modalCss`));
}