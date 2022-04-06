export default popupFactory;
function popupFactory($) {
  const wrappedBody = $(document.body);
  initStyling($.setStyle);
  let savedTimer, savedCallback;
  const clickOrTouch =  "ontouchstart" in document.documentElement ? "touchend" : "click";
  $().delegate( clickOrTouch, `#closer, .between`,  remove );
  const stillOpen = () => {
    endTimer();
    modalWarner.hasClass(`active`) && modalWarner.removeClass(`active`);
    modalWarner.addClass(`active`);
    savedTimer = setTimeout(() => modalWarner.removeClass(`active`), 2500);
    return true;
  }
  const currentModalState = {
    currentPopupIsModal: false,
    set isModal(tf) { this.currentPopupIsModal = tf; },
    get isModal() { return this.currentPopupIsModal; },
    isModalActive() { return this.currentPopupIsModal && popupBox.hasClass(`active`) && stillOpen() },
  }
  const createElements = _ => {
    const popupBox = $(`<div class="popupContainer">`)
      .append( $(`<span id="closer" class="closeHandleIcon"></span>`)
        .prop(`title`, `Click here or anywhere outside the box to close`))
      .append(`
      	<div class="popupBox">
        	<div id="modalWarning"></div>
          <div data-modalcontent></div>
        </div>`);
    const closer = $(`#closer`);
    const between = $(`<div class="between"></div>`);
    return [popupBox, between, closer, $(`#modalWarning`)];
  };
  const [popupBox, between, closer, modalWarner] = createElements();
  const deActivate = () => {
    $(`.between`).removeClass(`active`).style({top: 0});
    $(`#closer, .popupContainer, #modalWarning`).removeClass(`active`);
    $(`[data-modalcontent]`).empty();
  };
  const activate = (theBox, closeHndl) => {
    $(`.between, .popupContainer`).addClass(`active`);
    popupBox.style( { height: `auto`, width: `auto` } );
    between.style( { top: `${scrollY}px` } );
    wrappedBody.addClass(`popupActive`);

    if (closeHndl) {
      closeHndl.addClass(`active`);
    }
  };
  const endTimer = () => savedTimer && clearTimeout(savedTimer);
  const doCreate = (message, reallyModal, callback) => {
    currentModalState.isModal = reallyModal;
    savedCallback = callback;

    if (!message.isJQL && message.constructor !== String) {
      return createTimed($(`<b style="color:red">Popup not created: invalid input</b>`), 2);    }

    endTimer();
    $(`.popupBox > [data-modalcontent]`).empty().append( message.isJQL ? message : $(`<div>${message}</div>`) );
    activate(popupBox, currentModalState.isModal ? undefined : closer);
  }
  const create = (message, reallyModal = false, callback = undefined) =>
    !currentModalState.isModalActive() && doCreate(message, reallyModal, callback);
  const createTimed = (message, closeAfter = 2, callback = null ) => {
    if (currentModalState.isModalActive()) { return; }
    deActivate();
    create(message, false, callback);
    const remover = callback ? () => remove(callback) : remove;
    savedTimer = setTimeout(remover, closeAfter * 1000);
  };
  function remove(evtOrCallback) {
    endTimer();

    if (currentModalState.isModalActive()) { return; }

    const callback = evtOrCallback instanceof Function ? evtOrCallback : savedCallback;

    if (callback && callback instanceof Function) {
      savedCallback = undefined;
      return callback();
    }

    deActivate();
    const time2Wait = parseFloat(popupBox.computedStyle(`transitionDuration`)) * 1000;
    savedTimer = setTimeout(() => wrappedBody.removeClass(`popupActive`), time2Wait);
  }
  const removeModal = callback => {
    currentModalState.isModal = false;
    remove(callback);
  };

  return {
    create,
    createTimed,
    remove,
    removeModal,
  };
}

function initStyling(setStyle) {
  const styling = {
    '.popupContainer': {
      top: `50%`,
      left: `50%`,
      transform: `translate(-50%, -50%)`,
      position: `absolute`,
      maxWidth: `40vw`,
      maxHeight: `40vh`,
      opacity: `0`,
      border: `1px solid transparent`,
      transition: 'opacity ease 0.4s',
      display: `flex`,
      flexDirection: `row-reverse`,
    },
    '.popupContainer.active': {
      zIndex: 10,
      opacity: '1',
      resize: `vertical`,
    },
    'body.popupActive': {
      overflow: `hidden`,
      transition: 'all linear 0.6s 0s',
    },
    '.between': {
      position: 'absolute',
      zIndex: '-1',
      overflow: 'hidden',
      backgroundColor: 'white',
      width: 0,
      height: 0,
      opacity: 0,
    },
    '.between.active': {
      height: `100vh`,
      width: `100vw`,
      zIndex: 2,
      opacity: 0.7,
    },
    '.popupBox': {
      minWidth: '150px',
      maxWidth: 'inherit',
      maxHeight: 'inherit',
      backgroundColor: 'white',
      boxShadow: '3px 2px 12px #777',
      borderRadius: '6px',
      overflow: `auto`,
      font: 'normal 12px/15px Verdana, Arial, sans-serif',
      minHeight: `1.5rem`,
      zIndex: `10`,
      padding: `0.4rem`,
    },
    '[data-modalcontent]': {
      padding: '0.4rem',
      minHeight: '1.5rem',
    },
    "@media screen and (min-width: 320px) and (max-width: 1200px)": {
      mediaSelectors: {
        ".popupContainer": {
          maxWidth: `75vw`,
          maxHeight: `30vh`,
        },
      }
    },
    '#modalWarning': {
      color:`red`,
      backgroundColor: `#FFFFF0`,
      fontWeight: `bold`,
      border: `3px solid red`,
      padding: `1rem`,
      margin: `0 auto 0.5em auto`,
      textAlign: `center`,
      opacity: 0,
      maxHeight: 0,
      position: `absolute`,
      boxShadow: `2px 2px 8px #999`,
      transition: `all ease 0.5s`,
      top: `50%`,
      left: `50%`,
      transform: `translate(-50%, -50%)`,
    },
    '#modalWarning.active:after': {
      content: `'Please close this box first!'`,
    },
    '#modalWarning.active': {
      opacity: 1,
      maxHeight: `100%`,
      maxWidth: `100%`,
      height: `auto`,
      zIndex: 12,
    },
    '.closeHandleIcon': {
      opacity: '0',
      zIndex: -1,
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      background: "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat"
    },
    '.closeHandleIcon.active': {
      zIndex: 12,
      opacity: 1,
      position: 'absolute',
      marginRight: '-16px',
      marginTop: '-16px',

    }
  };
  Object.entries(styling).forEach( ([selector, rules]) => setStyle(selector, rules, `popupCSS`));
}