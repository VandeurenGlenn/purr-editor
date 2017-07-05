'use strict';
const loadScript = src => {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.src = src;
    script.onload = result => {
      resolve(result);
    }
    script.onerror = error => {
      reject(error);
    }
    document.body.appendChild(script);
  });
}
export default loadScript;
