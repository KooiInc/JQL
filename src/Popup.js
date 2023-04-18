import { popupStyling } from "./EmbedResources.js";
export default newPopupFactory;

function newPopupFactory($) {
  const editRule = $.createStyle(`JQLPopupCSS`);
  popupStyling.forEach( rule => editRule(rule) );
  let isModal, callbackOnClose, modalWarning, timeout;
  const warnTemplate = $.virtual(`<div class="popup-warn"></div>`);
  const popupContainer = $(`<div class="popupContainer">`)
    .append( $(`<span class="closeHandleIcon">`), $(`<div class="content">`) );
  const [closer, txtBox] = [$(`.popupContainer .closeHandleIcon`), $( `.popupContainer .content` )];
  const positionCloser = () => { if (closer.hasClass(`popup-active`) ) {
      const {x, y, width} = txtBox.dimensions;
      closer.style({top: `${y - 12}px`, left: `${x + width - 12}px`});
    } };
  const setPopupZIndex = (currentZIndexValues, min = false) => {
    const zi = min ? currentZIndexValues.min - 100 : currentZIndexValues.max + 10;
    popupContainer.style({zIndex: zi});
    closer.style({zIndex: zi + 1}); };
  const warn = () => {
    modalWarning && $(`.popup-warn`).clear().append($(`<div>${modalWarning}</div>`));
    txtBox.addClass(`popup-warn-active`); };
  const modalRemover = () => { isModal = false; remove(closer[0]); };
  const getCurrentZIndexBoundaries = () => {
    const zIndxs = [0, ...$.nodes(`*:not(.popupContainer, .closeHandleIcon)`, document.body)
        .map( node => +getComputedStyle(node).zIndex ).filter( zi => $.IS(zi, Number) )];
    return { max: Math.max(...zIndxs) ?? 0, min: Math.min(...zIndxs) ?? 0 };
  };
  const timed = (seconds, callback) => timeout = setTimeout( () => {
    remove(closer[0]); $.IS(callback, Function) && callback(); callback = false; }, +seconds * 1000 );
  setPopupZIndex(getCurrentZIndexBoundaries(), true);
  $.delegate(`click`, `.popupContainer, .closeHandleIcon`, evt => remove(evt.target));
  $.delegate(`click`, `.popupContainer .content`, (_, self) => isModal && self.removeClass(`popup-warn-active`));
  $.delegate(`resize`, positionCloser);
  return {
    show: createAndShowPupup,
    create: (message, isModalOrCallback, modalCallback, modalWarning) => { /*legacy*/
      const isModal = $.IS(isModalOrCallback, Boolean) ? isModalOrCallback : false;
      createAndShowPupup({
        content: message, modal: isModal,
        callback: isModal ? modalCallback : isModalOrCallback, warnMessage: modalWarning, }); },
    createTimed: (message, closeAfter, callback) => /*legacy*/
      createAndShowPupup({content: message, closeAfter, callback}),
    removeModal: modalRemover, };

  function createAndShowPupup( { content, modal, closeAfter, callback, warnMessage } ) {
    if (content) {
      clearTimeout(timeout);
      setPopupZIndex(getCurrentZIndexBoundaries());
      isModal = modal ?? false;
      modalWarning = $.IS(warnMessage, String) && `${warnMessage?.trim()}`.length || warnMessage?.isJQL
        ? warnMessage : undefined;
      txtBox.clear().append(content.isJQL ? content : $(`<div>${content}</div>`));
      isModal && txtBox.append(warnTemplate.duplicate());
      popupContainer.addClass(`popup-active`);
      callbackOnClose = callback;

      if (!isModal) {
        closer.addClass(`popup-active`);
        positionCloser();
        $.IS(+closeAfter, Number) && timed(closeAfter);
      }

      return;
    }
    return console.error(`Popup creation needs at least some text to show`);
  }

  function remove(origin) {
    if (!isModal && !origin.closest(`.content`)) {
      clearTimeout(timeout);
      txtBox.clear();
      $(`.popup-active`).removeClass(`popup-active`);
      setPopupZIndex(getCurrentZIndexBoundaries(), true);
      $.IS(callbackOnClose, Function) && callbackOnClose();
      modalWarning = ``;
      return callbackOnClose = false;
    }
    return isModal && warn();
  }
}