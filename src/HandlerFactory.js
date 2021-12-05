import _$ from "./JQueryLike.js";
let handlers = {};

const metaHandler = evt => handlers[evt.type].forEach(handler => handler(evt));

const createHandlerForHID = (extCollection, HID, callback) => {
  return evt => {
    const target = evt.target.closest(HID);

    if (target) {
      return callback(_$.virtual(target), evt);
    }
  };
};

const addListenerIfNotExisting = type =>
  !Object.keys(handlers).find(registeredType => registeredType === type) &&
  document.addEventListener(type, metaHandler);

export default (extCollection, type, HIDselector, callback) => {
  addListenerIfNotExisting(type);
  const fn = createHandlerForHID(extCollection, HIDselector, callback);
  handlers = handlers[type]
    ? {...handlers, [type]: handlers[type].concat(fn)}
    : {...handlers, [type]: [fn]};
};