import Realm from "../../index.js";
import uniqid from "../../utils/unniq.js";
import LCSDiffEngine from "../../utils/diffingEngine.js";
import BudgetQueue from "../../utils/taskBudget.js";
import Signal from "../../utils/Signal.js";

const registry = new WeakMap();
const realmQueue = new BudgetQueue();

export default function dynamicRenderingPlugin(P) {
  P.directive("s-for", ({ el, expression, execute, context }) => {
    if (el.tagName !== "TEMPLATE") {
      throw new Error(`s-for requires a <template> element.`);
    }

    if (!registry.has(el)) {
      const marker = document.createComment(uniqid("s-for", 5));
      el.replaceWith(marker);
      registry.set(el, {
        marker,
        renderedItems: new Map(),
        diffEngine: new LCSDiffEngine(),
        lastResult: [],
      });
    }

    const data = registry.get(el);
    const [itemName, listName] = expression.split(" in ").map((v) => v.trim());
    const items = execute(listName) || [];

    // The engine now returns a Map of { key: { type } }
    const instructionMap = data.diffEngine.runDiff(data.lastResult, items);

    // PHASE 1: REMOVALS
    for (const [key, instr] of instructionMap) {
      if (instr.type === "remove") {
        const entry = data.renderedItems.get(key);
        if (entry) {
          entry.realm.destroy();
          entry.realm.root.remove();
          data.renderedItems.delete(key);
        }
      }
    }

    // PHASE 2: RECONCILE
    let currentCursor = data.marker;

    // We iterate the engine's wrappedNew to get stable keys + items
    data.diffEngine.wrappedNew.forEach((wrapped, index) => {
      const { key, item } = wrapped;
      const instr = instructionMap.get(key);
      let entry = data.renderedItems.get(key);

      if (instr.type === "add") {
        const nodeState = context.extendContext({
          [itemName]: item,
          $index: index,
        });

        const rowRealm = new Realm(
          el.content.cloneNode(true).firstElementChild,
          nodeState,
        );

        entry = { realm: rowRealm };
        currentCursor.after(rowRealm.root);

        // schedule initialization
        realmQueue.add(() => {
          entry.realm.initialize();
        });

        // save it
        data.renderedItems.set(key, entry);
      } else {
        // MOVE or KEEP: Update index/data and fix DOM position
        if (entry.realm.ready) {
          if (instr.patch) {
            // queue initialization
            realmQueue.add(() => {
              entry.realm.context.signals.$index.value = index;
              entry.realm.context.signals[itemName].value = item;
            });
          }
        }

        if (currentCursor.nextSibling !== entry.realm.root) {
          currentCursor.after(entry.realm.root);
        }
      }

      currentCursor = entry.realm.root;
    });

    // Update reference for the next runDiff
    data.lastResult = items;
  });
}
