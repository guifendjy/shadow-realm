import { EVENT_LISTENER_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import createWalkerFromNodeV2 from "../utils/createTreeWalkerFromRoot.js";

export default function getEventListeners($reactives, $registry) {
  $reactives.forEach(({ EL_STATE }, root) => {
    const eventListeners = createWalkerFromNodeV2(root, {
      prefix: EVENT_LISTENER_PREFIX,
    });

    eventListeners.forEach((ev) => {
      $registry.add({ ...ev, REMOVE_LISTENER: [], EL_STATE });
      cleanupAttribute(ev.ELEMENT, ev.RAW_ATTRIBUTE);
    });
  });
}
