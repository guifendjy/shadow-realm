import Realm from "../../index.js"; 
import uniqid from "../../utils/unniq.js";
import BudgetQueue from "../../utils/taskBudget.js";

const registry = new WeakMap();
const realmQueue = new BudgetQueue();

export default function conditionalRenderPlugin(R) {
  R.directive("s-if", ({ el, expression, execute, context }) => {
    if (el.tagName !== "TEMPLATE") {
      console.log(el);
      throw new Error(
        `Error: directive <s-if> can only be used on template elements. ${expression}`,
      );
    }

    // 1. SETUP: Initialize the registry entry once
    if (!registry.has(el)) {
      const marker = document.createComment(uniqid("s-if", 5));

      el.replaceWith(marker);
      registry.set(el, {
        marker,
        realm: null,
        lastResult: null, // Track the toggle context
      });
    }

    const render = () => {
      const data = registry.get(el);
      const result = Boolean(execute(expression));

      // 2. GUARD: Only proceed if the condition actually changed
      if (result === data.lastResult) return;
      data.lastResult = result;

      if (result) {
        // 3. MOUNT: Expression became true
        const nodeTemplate = el.content.cloneNode(true); // Clone the fragment
        const container = nodeTemplate.firstElementChild;

        // Initialize the Realm on the cloned content
        const realm = data.realm ?? new Realm(container, context);
        data.marker.after(realm.root);
        if (!realm.ready) realm.initialize();

        data.realm = realm;
      } else {
        // 4. UNMOUNT: Expression became false
        if (data.realm) {
          data.realm.root.remove();
        }
      }
    };

    realmQueue.add(render);
  });
}
