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

    if (el.content.childElementCount > 1) {
      console.warn(
        `Warning: <s-if> directive expects exactly one root element in the template. Found ${el.content.childElementCount}. Only the first element will be rendered.`,
        el,
      );
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

    // data
    const data = registry.get(el);

    // Regex looks for optional parentheses and splits at the comma if present
    const match = expression.match(
      /^(?:\(([^,]+),\s*([^)]+)\)|([^() ]+))\s+in\s+(.+)$/,
    );

    if (!match) console.error("Invalid expression format");
    // If the parenthesized (item, index) pattern matched:
    // match[1] = itemName, match[2] = indexName, match[4] = listName
    // If the simple item pattern matched:
    // match[3] = itemName, match[4] = listName
    const itemName = (match[1] || match[3]).trim();
    const indexName = match[2] ? match[2].trim() : "$index"; // default fallback if omitted
    const listName = match[4].trim();

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
          [indexName]: index,
        });

        const nodeToRender = el.content.cloneNode(true).firstElementChild;
        if (!nodeToRender)
          return console.error(
            "Error: Template content is empty or invalid at s-for:",
            el,
          );
        const rowRealm = new Realm(nodeToRender, nodeState);

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
              entry.realm.context.signals[indexName].value = index;
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
