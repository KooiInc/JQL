import { popupStyling } from "./EmbedResources.js";
export default newPopupFactory;

function newPopupFactory($) {
  let isModal = false;
  let callbackOnClose = false;
  let modalWarning = ``;
  let timeout;
  const warnQ = `.popupContainer .content .warn`;
  const warnTemplate = $.virtual(`<div class="warn"></div>`);
  const editRule = $.createStyle(`JQLPopupCSS`);
  popupStyling.forEach( rule => editRule(rule) );
  const popupContainer = $(`<div class="popupContainer"></div>`)
    .append(`<span class="closeHandleIcon">`, `<div class="content">`);
  const [closer, txtBox] = [$(`.popupContainer .closeHandleIcon`), $(`.popupContainer .content`)];
  const positionCloser = () => {
    if (closer.hasClass(`popup-active`)) {
      const {x, y, width} = txtBox.dimensions;
      closer.style({top: `${y - 12}px`, left: `${x + width - 12}px`});
    } };
  const setPopupZIndex = maxDocumentZIndex => {
    popupContainer.style({zIndex: maxDocumentZIndex + 10});
    closer.style({zIndex: maxDocumentZIndex + 11}); };
  const isValidOrigin = origin => !origin.closest(`.content`) && origin.closest(`.popupContainer, .closeHandleIcon`);
  const warn = () => {
    modalWarning && $(warnQ).text(``).append($(`<div>${modalWarning}</div>`));
    txtBox.addClass(`warnActive`); };
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
  $.delegate(`click`, `.popupContainer .content`, (_, self) => isModal && self.removeClass(`warnActive`));
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
      modalWarning = warnMessage ?? ``;
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
    if (!isModal && isValidOrigin(origin)) {
      txtBox.clear();
      $(`.popup-active`).removeClass(`popup-active`);
      $.IS(callbackOnClose, Function) && callbackOnClose();
      modalWarning = ``;
      return callbackOnClose = false;
    }
    return isModal && warn();
  }
}