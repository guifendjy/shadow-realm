import uniqid from "./utils/unniq.js";
import debounce from "./utils/debounce.js";
import throttle from "./utils/throttle.js";

// this can hold special helpers(is used when scoping any state)
const helpers = {
  $uniid: uniqid,
  $debounce: debounce,
  $throttle: throttle,
};

// constants
const WHITELIST = ["console", "Math", "Date", "JSON", "parseInt"];
const STATE_DATA_ATTR = "[s-state]"; // strip brackets when accessing the attribute's value.
const BINDING_PREFIX = "s-";
const EVENT_LISTENER_PREFIX = "on:";
const S_EFFECT_PREFIX = "s-effect";
const STORE_MARKER = "$store";
const REF_MARKER = "$refs";

export {
  helpers,
  STATE_DATA_ATTR,
  BINDING_PREFIX,
  EVENT_LISTENER_PREFIX,
  WHITELIST,
  S_EFFECT_PREFIX,
  STORE_MARKER,
  REF_MARKER,
};
