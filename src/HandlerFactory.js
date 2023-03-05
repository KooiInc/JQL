let handlers = {};
export default $ => {
  const metaHandler = evt => handlers[evt.type].forEach(handler => handler(evt));

  const createHandlerForHID = (HID, callback) => {
    return evt => {
      const target = evt.target.closest(HID);
      return target && callback(evt, $(target));
    };
  };

  const addListenerIfNotExisting = type =>
    !Object.keys(handlers).find(registeredType => registeredType === type) &&
      document.addEventListener(type, metaHandler);

  return (/*NODOC*/self, type, HIDselector, callback) => {
    addListenerIfNotExisting(type);
    const fn = !HIDselector ? callback : createHandlerForHID(HIDselector, callback);
    handlers = handlers[type]
      ? {...handlers, [type]: handlers[type].concat(fn)}
      : {...handlers, [type]: [fn]};
  };
}