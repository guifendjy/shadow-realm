import uniqid from "../../utils/unniq";
import Realm from "../../shadow_realm";

const registry = new Map();

export default function sSwitchPlugin(R) {
  R.directive("s-switch", ({ el, expression, execute, context }) => {
    if (el.tagName !== "TEMPLATE") {
      return console.error("Error: s-switch can only be used in template");
    }

    if (!registry.has(el)) {
      const nodes = Array.from(el.content.children) || [];
      const realms = nodes.map(
        (node) => new Realm(node.cloneNode(true), context),
      );
      const marker = document.createComment(uniqid("s-switch", 5));

      registry.set(el, { realms, marker, lastRendered: null });
      el.replaceWith(marker);
    }

    const state = registry.get(el);
    const result = execute(expression);

    // 1. Try to find an exact case match
    let match = state.realms.find((realm) => {
      return realm.root.getAttribute("case") == result;
    });

    // 2. Fallback to default if no case matches
    if (!match) {
      match = state.realms.find((realm) => realm.root.hasAttribute("default"));
    }

    if (state.lastRendered === match) return;

    // Cleanup and Swap
    state.lastRendered?.root.remove();

    if (match) {
      const activeRealm = !match.ready ? match.initialize() : match;
      state.marker.after(activeRealm.root);
      state.lastRendered = activeRealm;
    } else {
      state.lastRendered = null;
    }
  });
}
