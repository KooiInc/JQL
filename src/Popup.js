// noinspection JSUnresolvedVariable,JSValidateJSDoc

/**
 * a small library to create/use (modal) popups
 * @module Popup
 */
export default popupFactory;

/**
 * The JQLLike library.<br>
 * See [module JQL]{@link module:JQL~ExtendedNodeList}
 * @private
 * @typedef {function(...[*]): ExtendedNodeList} ExtendedNodeList
 */

/**
 * This factory delivers 4 methods to create or remove a (modal) popup window in the browser.<ul>
 *   <li>[create]{@link module:Popup~popupFactory_create}
 *   <li>[createTimed]{@link module:Popup~popupFactory_createTimed}
 *   <li>[remove]{@link module:Popup~popupFactory_remove}
 *   <li>[removeModal]{@link module:Popup~popupFactory_removeModal}</ul>
 *  All popups are modal (the background page is inactivated until the popup is closed).
 *  A normal popup can be closed by clicking a small icon or outside the box.
 *  A 'really modal' popup can only be closed using a handler you define yourself.
 * @export popupFactory
 * @param $ {ExtendedNodeList} JQLike instance
 * @returns {Object}
 */
function popupFactory($) {
  const wrappedBody = $(document.body);
  initStyling($.setStyle);
  let savedTimer, savedCallback;
  const clickOrTouch =  "ontouchstart" in document.documentElement ? "touchend" : "click";
  $().delegate( clickOrTouch, `#closer, .between`,  remove );
  const stillOpen = () => {
    alert(`A modal window is still open, make sure it is closed first!`);
    return true;
  }
  const currentModalState = {
    currentPopupIsModal: false,
    set isModal(tf) { this.currentPopupIsModal = tf; },
    get isModal() { return this.currentPopupIsModal; },
    isModalActive() { return this.currentPopupIsModal && popupBox.hasClass(`active`) && stillOpen() },
  }
  const positionCloserHandle = _ => {
    if (!closer || !closer.hasClass(`active`)) { return; }
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

  /**
   * Create a popup from a string or JQLike instance. If [reallyModal] is true
   * the popup can only be closed using a method you create (e.g. a button click
   * within the popup). A callback can be used to execute after closing the popup.
   * <br>Exposed as <code>[popup].create</code>
   * <br><b>Note</b> if a 'really modal' popup is open, you can't create a new popup
   * @example
   * // assuming 'popup' as name for the (imported and) initialized popupFactory
   * // and JQLike is imported as '$'
   * // ----
   * // plain or html string
   * popup.create(`Hello world`);
   * popup.create(`<p>Hello world</p>`);
   * // an ExtendedNodelist instance
   * popup.create($(`<p>Hello world</p>`));
   * // a really modal popup
   * const button4Modal = $(`<button>Click me to close!</button>`)
   *    .on(`click`, popup.removeModal(() => popup.createTimed(`<p>Goodbye!</p>`, 2));
   * popup.create(button4Modal, true);
   * // a popup with a callback
   * popup.create(`<p>Hello world</p>`, false, () => popup.create(`<p>Goodbye!</p>`);
   * @name popupFactory_create
   * @function
   * @param message {string | ExtendedNodeList} a (html) string or a JQLike instance
   * @param reallyModal {boolean} allow default closing behavior or not
   * @param callback {function} a callback lambda to execute after closing the popup
   */
  const doCreate = (message, reallyModal, callback) => {
    currentModalState.isModal = reallyModal;
    savedCallback = callback;

    if (!message.isJQL && message.constructor !== String) {
      return createTimed($(`<b style="color:red">Modal not created: invalid input</b>`), 2);    }

    endTimer();
    $(`.popupBox > [data-modalcontent]`).empty().append( message.isJQL ? message : $(`<div>${message}</div>`) );
    activate(popupBox, currentModalState.isModal ? undefined : closer);
  }

  const create = (message, reallyModal = false, callback) =>
    !currentModalState.isModalActive() && doCreate(message, reallyModal, callback);

  /**
   * Create a popup that closes automatically after [closeAfter] seconds
   * <br>Exposed as <code>[popup].createTimed</code>
   * <br><b>Note</b> if a 'really modal' popup is open, you can't create a new popup
   * @name popupFactory_createTimed
   * @function
   * @param message {string | ExtendedNodeList} a (html) string or a JQLike instance
   * @param closeAfter {number} the time (seconds, default 2) after which the popup should close
   * @param callback {function} a callback lambda to execute after the popup is closed
   */
  const createTimed = (message, closeAfter = 2, callback = null ) => {
    if (currentModalState.isModalActive()) { return; }
    hideModal();
    create(message);
    const remover = callback ? () => remove(callback) : remove;
    savedTimer = setTimeout(remover, closeAfter * 1000);
  };

  /**
   * Remove a popup
   * <br>Exposed as <code>[popup].remove</code>
   * <br><b>Note</b> if the popup is 'really modal', you can't remove it with this,
   * use <code>popup.removeModal</code> for that.
   * @name popupFactory_remove
   * @function
   * @param evtOrCallback {function|event|undefined} an event (if closed by a click delegate),
   * or a callback lambda to execute after the popup is closed (e.g. passed by
   * <code>popup.createTimed</code>. May be empty.
   */
  function remove(evtOrCallback) {
    endTimer();

    if (currentModalState.isModalActive()) { return; }

    const callback = evtOrCallback instanceof Function ? evtOrCallback : savedCallback;

    if (callback && callback instanceof Function) {
      savedCallback = undefined;
      return callback();
    }

    hideModal();
    const time2Wait = parseFloat(popupBox.computedStyle(`transitionDuration`)) * 1000;
    savedTimer = setTimeout(() => wrappedBody.removeClass(`popupActive`), time2Wait);
  }

  /**
   * Remove a really modal popup
   * <br>Exposed as <code>[popup].removeModal</code>
   * @name popupFactory_removeModal
   * @function
   * @param callback {function|undefined} a callback lambda to execute after the popup is closed, may
   * be empty
   */
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
      transition: 'all ease 0.3s',
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
      transition: 'opacity ease 0.6s',
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
      transition: 'opacity ease 0.5s',
      background: "url('data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E') no-repeat"
    },
    '.closeHandleIcon.active': {
      zIndex: 4,
      opacity: 1,
    }
  };
  Object.entries(styling).forEach( ([selector, rules]) => setStyle(selector, rules, `popupCSS`));
}