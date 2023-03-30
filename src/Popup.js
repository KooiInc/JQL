import { popupStyling } from "./EmbedResources.js";
export default newPopupFactory;

function newPopupFactory($) {
  let isModal = false;
  let callbackOnClose = false;
  let modalWarning = ``;
  const warnQ = `.popupContainer .content .warn`;
  const warnTemplate = $.virtual(`<div class="warn"></div>`);
  setStyling();
  const popupContainer = $(`
    <div class="popupContainer">
      <span class="closeHandleIcon"></span>
      <div class="content"></div>
    </div>`);
  const txtBox = $(`.popupContainer .content`).append(warnTemplate.duplicate());
  const closer = $(`.popupContainer .closeHandleIcon`);
  const positionCloser = () => {
    if (!closer.hasClass(`active`)) { return; }
    const {x, y, width} = txtBox.dimensions;
    closer.style({top: `${y - 16}px`, left: `${x + width - 16}px`});
  };
  const setPopupZIndex = maxDocumentZIndex => {
    popupContainer.style({zIndex: maxDocumentZIndex + 10});
    closer.style({zIndex: maxDocumentZIndex + 11});
  };
  const isValidOrigin = origin => !origin.closest(`.content`) &&
    origin.closest(`.popupContainer, .closeHandleIcon`);
  const warn = () => {
    modalWarning && $(warnQ).text(``).append($(`<div>${modalWarning}</div>`));
    txtBox.addClass(`warnActive`);
  };
  const modalRemover = () => {
    isModal = false;
    remove(closer[0]);
  };

  // handling
  $.delegate(`click`, `.popupContainer, .closeHandleIcon`, evt => remove(evt.target));
  $.delegate(`click`, `.popupContainer .content`, (_, self) => isModal && self.removeClass(`warnActive`));
  $.delegate(`resize`, positionCloser);

  return {
    show: create,
    create: (message, isModalOrCallback, modalCallback, modalWarning) => { /*legacy*/
      create({
        content: message,
        modal: $.IS(isModalOrCallback, Boolean) ? isModalOrCallback : false,
        callback: $.IS(modalCallback, Function) ? modalCallback : undefined,
        warnMessage: modalWarning,
      });
    },
    createTimed: (message, closeAfter, callback) => create({content: message, closeAfter, callback}), /*legacy*/
    removeModal: modalRemover
  };

  function create( { content, modal, closeAfter, callback, warnMessage } ) {
    if (content) {
      txtBox.clear();
      setPopupZIndex(getCurrentMaxZIndex());

      if (modal === true) {
        isModal = modal;
        txtBox.append(warnTemplate.duplicate());
      }

      modalWarning = warnMessage ?? ``;
      txtBox.prepend(content.isJQL ? content : $(`<div>${content}</div>`));
      popupContainer.addClass(`active`);

      if (!modal) {
        closer.addClass(`active`);
        positionCloser();

        if ($.IS(+closeAfter, Number)) {
          return setTimeout( () => {
            remove(closer[0]);
            $.IS(callback, Function) && callback();
            callback = false;
          }, +closeAfter * 1000 );
        }
      }

      return callbackOnClose = callback;
    }

    return console.error(`Popup creation needs at least some text to show`);
  }

  function remove(origin) {
    if (!isModal && isValidOrigin(origin)) {
      txtBox.clear().append(warnTemplate.duplicate());
      [popupContainer, closer].forEach(jqlEl => jqlEl.removeClass(`active`));

      if ($.IS(callbackOnClose, Function)) {
        callbackOnClose();
      }

      return callbackOnClose = false;
    }

    return isModal && warn();
  }

  function getCurrentMaxZIndex() {
    return Math.max(
      ...$.nodes(`*:not(.popupContainer, .closeHandleIcon)`, document.body)
        .map( node => +getComputedStyle(node).zIndex )
        .filter( zi => $.IS(zi, Number) ) );
  }

  function setStyling() {
    const editRule = $.createStyle(`JQLPopupCSS`);
    const editCssRules = (...rules) => rules.forEach( rule => editRule(rule) );
    editCssRules(...popupStyling);
  }
}