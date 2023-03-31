import { popupStyling } from "./EmbedResources.js";
export default newPopupFactory;

function newPopupFactory($) {
  const editRule = $.createStyle(`JQLPopupCSS`);
  popupStyling.forEach( rule => editRule(rule) );
  let isModal = false;
  let callbackOnClose = false;
  let modalWarning = ``;
  let timeout;
  const warnTemplate = $.virtual(`<div class="popup-warn"></div>`);
  const [closer, txtBox] = [$.virtual(`<span class="closeHandleIcon">`), $.virtual(`<div class="content">`)];
  const popupContainer = $(`<div class="popupContainer"></div>`).append(closer, txtBox);
  const positionCloser = () => {
    if (closer.hasClass(`popup-active`)) {
      const {x, y, width} = txtBox.dimensions;
      closer.style({top: `${y - 12}px`, left: `${x + width - 12}px`});
    } };
  const setPopupZIndex = maxDocumentZIndex => {
    popupContainer.style({zIndex: maxDocumentZIndex + 10});
    closer.style({zIndex: maxDocumentZIndex + 11}); };
  const warn = () => {
    modalWarning && $(`.popup-warn`).clear().append($(`<div>${modalWarning}</div>`));
    txtBox.addClass(`popup-warn-active`); };
  const modalRemover = () => {
    isModal = false;
    remove(closer[0]); };
  const getCurrentMaxZIndex = () => Math.max(
    ...$.nodes(`*:not(.popupContainer, .closeHandleIcon)`, document.body)
      .map( node => +getComputedStyle(node).zIndex )
      .filter( zi => $.IS(zi, Number) ) );
  const timed = (seconds, callback) =>
    timeout = setTimeout( () => {
      remove(closer[0]);
      $.IS(callback, Function) && callback();
      callback = false; }, +seconds * 1000 );
  $.delegate(`click`, `.popupContainer, .closeHandleIcon`, evt => remove(evt.target));
  $.delegate(`click`, `.popupContainer .content`, (_, self) => isModal && self.removeClass(`popup-warn-active`));
  $.delegate(`resize`, positionCloser);
  return {
    show: createAndShowPupup,
    create: (message, isModalOrCallback, modalCallback, modalWarning) => { /*legacy*/
      createAndShowPupup({
        content: message, modal: $.IS(isModalOrCallback, Boolean) ? isModalOrCallback : false,
        callback: $.IS(modalCallback, Function) ? modalCallback : undefined, warnMessage: modalWarning, }); },
    createTimed: (message, closeAfter, callback) =>
      createAndShowPupup({content: message, closeAfter, callback}), /*legacy*/
    removeModal: modalRemover, };

  function createAndShowPupup( { content, modal, closeAfter, callback, warnMessage } ) {
    if (content) {
      clearTimeout(timeout);
      txtBox.clear();
      setPopupZIndex(getCurrentMaxZIndex());
      isModal = modal ?? false;
      modalWarning = `${warnMessage}`.trim().length ? warnMessage : ``;
      txtBox.append(content.isJQL ? content : $(`<div>${content}</div>`));
      isModal && txtBox.append(warnTemplate.duplicate());
      popupContainer.addClass(`popup-active`);

      if (!isModal) {
        closer.addClass(`popup-active`);
        positionCloser();
        $.IS(+closeAfter, Number) && timed(closeAfter, callback);
      }
      return callbackOnClose = callback;
    }
    return console.error(`Popup creation needs at least some text to show`);
  }

  function remove(origin) {
    if (!isModal && !origin.closest(`.content`)) {
      txtBox.clear();
      $(`.popup-active`).removeClass(`popup-active`);
      $.IS(callbackOnClose, Function) && callbackOnClose();
      modalWarning = ``;
      return callbackOnClose = false;
    }
    return isModal && warn();
  }
}