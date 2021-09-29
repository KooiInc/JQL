import { throwIf } from "./Helpers.js";
export { fetchGet, fetchPost };

// region localstuff
const checkUrl = url => throwIf(!url.trim().length, `You can not fetch without an url!`, ReferenceError);
const notOk = (onErrorFn, response, url) => {
  const notOk = {error: true, message: `Fetch ${url} failed ${JSON.stringify(response || {})}`};
  return onErrorFn ? onErrorFn(notOk) : Promise.reject(notOk);
}
// endregion localstuff

// region fetchPost
async function fetchPost(url = '', data = {}, fetchOptions = {}) {
  checkUrl(url);
  const data2Send = Object.fromEntries(
    Object.entries(data)
      .reduce( (acc, [key, value]) =>
        !(value instanceof Function) && [ ...acc, [key, value] ] || acc, [] )
  );
  data.httpMethod = data.httpMethod || "POST"; // maybe put

  let response = null;
  const options = {
    ... {
      method: data.httpMethod,
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    ...fetchOptions
  };

  try {
    response = await fetch(url, { ...options, body: JSON.stringify(data2Send) });
  } catch(err) {
    const error = {error: true, message: err.message, stack: err.stack || `no stack`};
    return data.onerror ? data.onerror(error) : Promise.reject(error);
  }

  if (!response.ok) {
    return notOk(data.onerror, response, url);
  }

  return data.onsuccess ? response.json().then(data.onsuccess) : response.json();
}
// endregion fetchPost

// region fetchGet
async function fetchGet(url = '', data = {}, fetchOptions = {}) {
  checkUrl(url);
  let response = null;
  const options = {
    ... {
      method: `GET`,
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
    },
    ...fetchOptions
  };
  url += `?${
    Object.entries(data).reduce( (acc, [key, value]) =>
      !(value instanceof Function) && [...acc, `${key}=${value}`] || acc, [] )
      .join("&") }`;

  try {
    response = await fetch(url, options);
  } catch(err) {
    const error = {error: true, message: err.message, stack: err.stack || `no stack`};
    return data.onerror ? data.onerror(error) : Promise.reject(error);
  }

  if (!response.ok) {
    return notOk(data.onerror, response, url);
  }

  return data.onsuccess ? response.json().then(data.onsuccess) : response.json();
}
// endregion fetchGet