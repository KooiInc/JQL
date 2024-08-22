import { popupStyling } from "./EmbedResources.js";
import { randomString } from "./Utilities.js";

export default newPopupFactory;

function newPopupFactory($) {
  const editRule = $.createStyle(`JQLPopupCSS`);
  const maxZIndexValue = 2147483647;
  popupStyling.forEach( rule => editRule(rule) );
  let callbackOnClose = {};
  let isModal, modalWarning, timeout;
  const warnTemplate = $.virtual(`<div class="popup-warn">`);
  const popupContainer = $(`<div class="popupContainer">`)
    .append( $(`<span class="closeHandleIcon">`) )
    .append( $(`<div class="content">`) );
  const [closer, txtBox] = [$(`.popupContainer > .closeHandleIcon`), $( `.popupContainer > .content` )];
  const positionCloser = () => {
    if ( closer.hasClass(`popup-active`) ) {
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
        .map( node => {
          const zIndexValue = parseInt(getComputedStyle(node).getPropertyValue(`z-index`));
          return !node.shadowRoot && zIndexValue !== maxZIndexValue ? zIndexValue : 0; } )
        .filter( zi => $.IS(zi, Number) )];
    const max = Math.max(...zIndxs) ?? 0;
    const min = Math.min(...zIndxs) ?? 0;
    return {max, min};
  };
  const timed = (seconds, callback) => timeout = setTimeout( () => remove(closer[0]), +seconds * 1000 );
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
      isModal && warnMessage && txtBox.append(warnTemplate.duplicate());
      popupContainer.addClass(`popup-active`);
      
      if ($.IS(callback, Function)) {
        const tmpId = randomString();
        popupContainer.data.set( {callbackId:  tmpId} );
        callbackOnClose[tmpId] = callback;
      }

      if (!isModal) {
        if ($.IS(+closeAfter, Number)) {
          const callbackId = popupContainer.data.get(`callbackId`);
          const callback = callbackId && callbackOnClose[callbackId];
          timed(closeAfter, callback);
        }
        closer.addClass(`popup-active`);
        positionCloser();
      }

      return true;
    }
    return console.error(`Popup creation needs at least some text to show`);
  }

  function remove(origin) {
    if (!isModal && !origin.closest(`.content`)) {
      clearTimeout(timeout);
      txtBox.clear();
      const callbackId = popupContainer.data.get(`callbackId`);
      popupContainer.data.remove(`callbackId`);
      $(`.popup-active`).removeClass(`popup-active`);
      setPopupZIndex(getCurrentZIndexBoundaries(), true);
      const cb = callbackId && callbackOnClose[callbackId];
      if ($.IS(cb, Function)) { cb(); }
      if (callbackId) { delete callbackOnClose[callbackId]; }
      modalWarning = ``;
      return;
    }
    return isModal && warn();
  }
}