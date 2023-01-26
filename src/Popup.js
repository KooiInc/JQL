import lifeStyleFactory from "./LifeStylingModule.js";
export default popupFactory;
function popupFactory($) {
  const wrappedBody = $(document.body);
  const setStyle = lifeStyleFactory({createWithId: "JQLPopupCSS"});
  initStylingNew(setStyle);
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

function initStylingNew(setStyle) {
  const dataUrl = "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat";
  `
    .popupContainer {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      position: absolute;
      max-width: 40vw;
      max-height: 40vh;
      opacity: 0;
      border: 1px solid transparent;
      display: flex;
      flex-direction: row-reverse;
    }
~rule~
    .popupContainer.active {
      z-index: 10;
      opacity: 1;
      resize: vertical;
    }
~rule~    
    body.popupActive {
      overflow: hidden;
      transition: all 0.6s linear 0s;
    }
~rule~
    .between {
      position: absolute;
      z-index: -1;
      overflow: hidden;
      background-color: white;
      width: 0px;
      height: 0px;
      opacity: 0;
    }
~rule~
    .between.active {
      height: 100vh;
      width: 100vw;
      z-index: 9;
      opacity: 0.7;
      transition: opacity 0.4s ease-in 0s;
    }
~rule~
    .popupBox {
      min-width: 150px;
      max-width: inherit;
      max-height: inherit;
      background-color: white;
      box-shadow: rgb(119, 119, 119) 3px 2px 12px;
      border-radius: 6px;
      overflow: auto;
      font: 12px / 15px Verdana, Arial, sans-serif;
      min-height: 1.5rem;
      z-index: 10;
      padding: 0.4rem;
    }
~rule~
    [data-modalcontent] {
      padding: 0.5rem;
      min-height: 1rem;
      vertical-align: middle;
    }
~rule~
    @media screen and(min-width: 320px) and (max-width: 1200px) {
      .popupContainer {
        max-width: 75vw;
        max-height: 30vh;
      }
    }
~rule~
    #modalWarning {
      color: red;
      background-color: rgb(255, 255, 240);
      font-weight: bold;
      border: 3px solid red;
      padding: 1rem;
      margin: 0px auto 0.5em;
      text-align: center;
      opacity: 0;
      max-height: 0px;
      position: absolute;
      box-shadow: rgb(153, 153, 153) 2px 2px 8px;
      transition: all 0.5s ease 0s;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
~rule~
    #modalWarning.active:after {
      content: 'Please close this box first!';
    }
~rule~
    #modalWarning.active {
       opacity: 1;
       max-height: 100%;
       max-width: 100%;
       height: auto;
       z-index: 12;
    }
~rule~
    .closeHandleIcon {
       opacity: 0;
       z-index: -1;
       cursor: pointer;
       width: 32px;
       height: 32px;
    }
~rule~
    .closeHandleIcon.active {
       z-index: 12;
       opacity: 1;
       position: absolute;
       margin-right: -16px;
       margin-top: -16px;
    }`
  .split(`~rule~`)
  .forEach(declaration => setStyle(declaration));
  setStyle(`.closeHandleIcon`, {background: dataUrl});
}