'use strict';
/**
 * @mixin backed
 * @param {string} type Name of the event
 * @param {HTMLElement} target Name of the event
 * @param {string|boolean|number|object|array} detail
 */
export default (type=String, detail=null, target=document) => {
  target.dispatchEvent(new CustomEvent(type, {detail: detail}));
};
