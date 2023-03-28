import {IS} from "./JQLExtensionHelpers.js";
import {popupStyling} from "./EmbedResources.js";
export default PopupFactory;

function PopupFactory($) {
  let savedPosition = 0;
  const wrappedBody = $(document.body);
  const setStyle = $.createStyle(`JQLPopupCSS`);
  initStyling(setStyle);
  let savedTimer, savedCallback;
  const clickOrTouch =  "ontouchstart" in document.documentElement ? "touchend" : "click";
  const remove = (/*NODOC*/evtOrCallback) => {
    if (currentModalState.isActive) { return; }
    endTimer();
    const callback = IS(evtOrCallback, Function) ? evtOrCallback : savedCallback;
    deActivate();
    const time2Wait = parseFloat(popupBox.computedStyle(`transitionDuration`)) * 1000;
    savedTimer = setTimeout(() => wrappedBody.removeClass(`popupActive`), time2Wait);

    if (IS(callback, Function)) {
      savedCallback = undefined;
      return callback();
    }
  };
  $.delegate( clickOrTouch, `#closer, .between`,  remove );
  const stillOpen = () => {
    endTimer();

    if (modalWarner.getData(`warn`) === "1") {
      modalWarner.hasClass(`active`) && modalWarner.removeClass(`active`);
      modalWarner.addClass(`active`);
    }

    savedTimer = setTimeout(() => modalWarner.removeClass(`active`), 2500);
    return true;
  }
  const currentModalState = (() =>{
    let currentPopupIsModal = false;
    return {
      set isModal({state = false}) { currentPopupIsModal = state; },
      get isModal() { return currentPopupIsModal; },
      get isActive() { return currentPopupIsModal && popupBox.hasClass(`active`) && stillOpen() },
    };
  })();
  const createElements = _ => {
    const popupBox = $(`<div class="popupContainer">`)
      .append( $(`<span id="closer" class="closeHandleIcon"></span>`)
        .prop(`title`, `Click here or anywhere outside the box to close`))
      .append(`<div class="popupBox"><div id="modalWarning" data-warn="0"></div><div data-modalcontent></div></div>`);
    const closer = $(`#closer`);
    const between = $(`<div class="between"></div>`);
    return [popupBox, between, closer, $(`#modalWarning`)];
  };
  const [popupBox, between, closer, modalWarner] = createElements();
  const deActivate = () => {
    $(`.between`).removeClass(`active`).style({top: 0});
    $(`#closer, .popupContainer, #modalWarning`).removeClass(`active`);
    $(`[data-modalcontent]`).clear();
    modalWarner.setData({warn: 0});
  };
  const activate = (theBox, closeHndl) => {
    scrollTo(savedPosition.x, savedPosition.y);
    const scrTop = savedPosition.y;
    $(`.between, .popupContainer`).addClass(`active`);
    between.style( { top: `${scrTop}px` } );
    const boxTop = scrTop + (0.5 * between[0].offsetHeight);
    popupBox.style( { height: `auto`, width: `auto`, top: `${ boxTop }px` } );
    wrappedBody.addClass(`popupActive`);

    if (closeHndl) { closeHndl.addClass(`active`); }
  };
  const endTimer = () => savedTimer && clearTimeout(savedTimer);
  const doCreate = ({message, isModal, callback, modalWarning}) => {
    savedPosition = { x: scrollX, y: scrollY };
    currentModalState.isModal = {state: isModal ?? false};
    savedCallback = callback;

    if (isModal && IS(modalWarning, String)) {
      setStyle(`#modalWarning.active:after{content:"${modalWarning}";}`);
      modalWarner.setData({warn: 1});
    }

    if (!message.isJQL && !IS(message, String)) {
      return createTimed($(`<b style="color:red">Popup not created: invalid input</b>`), 2);
    }

    endTimer();

    $(`[data-modalcontent]`).clear().append( message.isJQL ? message : $(`<div>${message}</div>`) );
    return activate(popupBox, currentModalState.isModal ? undefined : closer);
  };
  const create = (message, isModalOrCallback, modalCallback, modalWarning) => {
    if (currentModalState.isActive) { return; }

    if (IS(isModalOrCallback, Function)) {
      return doCreate( { message, isModal: false, callback: isModalOrCallback } );
    }

    return doCreate( { message, isModal: !!isModalOrCallback, callback: modalCallback, modalWarning } );
  };
  const createTimed = (message, closeAfter = 2, callback = null ) => {
    if (currentModalState.isActive) { return; }
    deActivate();
    create(message, false, callback);
    const remover = () => remove(callback);
    savedTimer = setTimeout(remover, closeAfter * 1000);
  };
  const removeModal = callback => {
    modalWarner.setData({warn: 0});
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
  popupStyling.forEach(declaration => setStyle(declaration));
}