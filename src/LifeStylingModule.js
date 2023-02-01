const LifeStyleFactory = location.host === `dev.kooi` ?
  (await import("//dev.kooi/LifeCSS/index.js")).default :
  (await import("//cdn.jsdelivr.net/npm/lifecss@latest/index.js")).default;
export default LifeStyleFactory;
