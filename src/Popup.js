import { popupStyling } from "./EmbedResources.js";
export default newPopupFactory;

function newPopupFactory($) {
  const editRule = $.createStyle(`JQLPopupCSS`);
  popupStyling.forEach( rule => editRule(rule) );
  let [isModal, callbackOnClose, modalWarning, timeout] = [false, false, ``,];
  const warnTemplate = $.virtual(`<div class="popup-warn"></div>`);
  const [closer, txtBox] = [$.virtual(`<span class="closeHandleIcon">`), $.virtual(`<div class="content">`)];
  const popupContainer = $(`<div class="popupContainer"></div>`).append(closer, txtBox);
  const positionCloser = () => { if (closer.hasClass(`popup-active`)) {
      const {x, y, width} = txtBox.dimensions;
      closer.style({top: `${y - 12}px`, left: `${x + width - 12}px`});
    } };
  const setPopupZIndex = (currentZIndexValues, min = false) => {
    console.log(currentZIndexValues);
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
      createAndShowPupup({
        content: message, modal: $.IS(isModalOrCallback, Boolean) ? isModalOrCallback : false,
        callback: $.IS(modalCallback, Function) ? modalCallback : undefined, warnMessage: modalWarning, }); },
    createTimed: (message, closeAfter, callback) => /*legacy*/
      createAndShowPupup({content: message, closeAfter, callback}),
    removeModal: modalRemover, };

  function createAndShowPupup( { content, modal, closeAfter, callback, warnMessage } ) {
    if (content) {
      clearTimeout(timeout);
      txtBox.clear();
      setPopupZIndex(getCurrentZIndexBoundaries());
      isModal = modal ?? false;
      modalWarning = $.IS(warnMessage, String) && `${warnMessage}`.trim().length || warnMessage?.isJQL
        ? warnMessage : undefined;
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
      setPopupZIndex(getCurrentZIndexBoundaries(), true);
      return callbackOnClose = false;
    }
    return isModal && warn();
  }
}