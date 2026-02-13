import uniqid from "../../utils/unniq.js";
import Realm from "../../shadow_realm/index.js";
import LCSDiffEngine from "../../utils/diffingEngine.js";

/**
 * NOTE: when trying to update an
 * existing realm, the context containing properties, that was
 * added via extension of the current context given to you by the owner this s-for intance.
 */

const registry = new WeakMap();

export default function dynamicRenderingPlugin(P) {
  // s-for directive logic
  P.directive("s-for", ({ el, expression, execute, context }) => {
    if (el.tagName !== "TEMPLATE") {
      console.log(el);
      throw new Error(
        `Error: directive <s-for> can only be used on template elements. ${expression}`,
      );
    }
    // 1. SETUP: Initialize the registry entry once
    if (!registry.has(el)) {
      const marker = document.createComment(uniqid("s-for", 5));
      el.replaceWith(marker);
      registry.set(el, {
        marker,
        renderedItems: new Map(),
        lastResult: [], // Track the toggle context
        diffEngine: new LCSDiffEngine(),
      });
    }

    const data = registry.get(el);
    let [itemName, listName] = expression.split(" in ");
    const items = execute(listName);

    let changes = data.diffEngine.runDiff(data.lastResult, items);

    // order: remove, move, keep, add -> crucial
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (change.type === "remove") {
        const { key } = change.value;
        const realmToDestroy = data.renderedItems.get(key);
        if (realmToDestroy) {
          realmToDestroy.realm.destroy();
          realmToDestroy.realm.root.remove();
          data.renderedItems.delete(change.value.key);
          // remove this change from the changes array so it won't be processed again
          changes.splice(i, 1);
          i--; // adjust index after splice
        }
      }
      if (change.type === "move") {
        const toMove = data.renderedItems.get(change.value.key);
        const to = changes[change.to - 1];
        const positionMarker =
          (to && data.renderedItems.get(to.value.key)?.realm.root) ??
          data.marker;

        if (positionMarker) {
          positionMarker.after(toMove.realm.root);

          // update in place
          toMove.realm.context.signals.$index = change.to;
          toMove.realm.context.signals[itemName].value = change.value.item;
        }
      }

      if (change.type === "keep") {
        const kept = data.renderedItems.get(change.value.key);
        if (kept) {
          // update in place
          kept.realm.context.signals.$index = change.index;
          kept.realm.context.signals[itemName].value = change.value.item;
        }
      }
      if (change.type === "add") {
        const lastInserted = changes[change.index - 1];
        const prev = data.renderedItems.get(lastInserted?.value.key);

        const positionMarker =
          prev && prev.realm ? prev.realm.root : data.marker;

        const { key, item } = change.value;
        const clone = el.content.cloneNode(true);
        const root = clone.firstElementChild;

        // 1. CREATE FLAT SUB-SCOPE
        // This ensures 'task' is found before 'title' or 'showList'
        // I will not handle this here but I will provide a function
        // to extend the context instead of doing this here, this way
        // users can create their own custom template directive rendering..

        // this extends to context makes state from a where these items are located.
        const nodeState = context.extendContext({
          [itemName]: item,
          $index: change.index,
        });

        // 2. RECURSIVE INITIALIZATION (hydrating)

        // This will find the s-if inside the cloned row
        const rowRealm = new Realm(root, nodeState);
        rowRealm.initialize();

        // save renderedItem
        data.renderedItems.set(key, { realm: rowRealm });
        // paint the dom
        positionMarker.after(rowRealm.root);
      }
    }

    // 3. MOUNT
    data.lastResult = safeDeepClone(items);
  });
}

function safeDeepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value)) return seen.get(value);

  // Plain object
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const obj = {};
    seen.set(value, obj);
    for (const key in value) {
      obj[key] = safeDeepClone(value[key], seen);
    }
    return obj;
  }

  // Array
  if (Array.isArray(value)) {
    const arr = [];
    seen.set(value, arr);
    for (let i = 0; i < value.length; i++) {
      arr[i] = safeDeepClone(value[i], seen);
    }
    return arr;
  }

  // Anything else: preserve identity
  return value;
}
