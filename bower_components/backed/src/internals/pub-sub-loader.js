'use strict';
import Pubsub from './pub-sub.js';
export default isWindow => {
  if (isWindow) {
    window.PubSub = window.PubSub || new Pubsub();
  } else {
    global.PubSub = global.PubSub || new Pubsub();
  }
}
