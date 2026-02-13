import uniqid from "./unniq.js";

/**@internal */

/**
 * // @ts-ignore
 * NOTE: change should be structure this way--->
 * 
 * order of updating:  remove | move | keep | add 
 * @example
 * {
 *  "change": {
 *        "type": "String", 
 *        "value": {
 *              "item": "String",
 *              "key" : "String"
 *          },
 *        "index": "Number",
 *        "from": "Number",
 *        "to": "Number"
 *
 *
 *    }
 * }
 *
 * */

export default class LCSDiffEngine {
  constructor() {
    this.wrappedOld = []; // [{ key, item }, ...]
    this.wrappedNew = []; // last wrapped new
    this.keyMap = new Map(); // object identity -> key
  }

  /**
   * Persist or assign keys to new array items.
   */
  #persistKeys(oldWrapped, newArr) {
    // 1) detect duplicates
    const valueCount = new Map();
    for (const item of newArr) {
      const key = this.#hashItem(item); // works for primitives + objects
      valueCount.set(key, (valueCount.get(key) || 0) + 1);
    }

    const hasDuplicates = [...valueCount.values()].some((c) => c > 1);

    const wrappedNew = [];

    if (!hasDuplicates) {
      // ========== NORMAL MODE (fast + identity based) ==========
      const existingKeys = new Map(oldWrapped.map((w) => [w.item, w.key]));

      for (const item of newArr) {
        let key;

        if (existingKeys.has(item)) {
          key = existingKeys.get(item);
        } else if (this.keyMap.has(item)) {
          key = this.keyMap.get(item);
        } else {
          key = uniqid("m:k", 4);
          this.keyMap.set(item, key);
        }

        wrappedNew.push({ key, item });
      }

      return wrappedNew;
    }

    // ========== DUPLICATE MODE ==========
    // assign keys based on *stable array position*, not identity
    for (let index = 0; index < newArr.length; index++) {
      const item = newArr[index];

      let key;
      const lookupKey = this.#hashItem(item);

      // keep old stable key if possible
      const previous = oldWrapped[index];
      if (previous && this.#hashItem(previous.item) === lookupKey) {
        key = previous.key;
      } else {
        key = uniqid("m:d", 4); // duplicate-safe key series
      }

      wrappedNew.push({ key, item });
    }

    return wrappedNew;
  }

  #hashItem(item) {
    if (item === null) return "null";
    const t = typeof item;
    if (t === "string" || t === "number" || t === "boolean")
      return `${t}:${item}`;
    return `obj:${JSON.stringify(item)}`;
  }

  /**
   * Compute LCS (returns array of keys)
   */
  #LCSKeys(oldArr, newArr) {
    const n = oldArr.length;
    const m = newArr.length;
    // dp as numbers only (space O(n*m) — OK for moderate lists)
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (oldArr[i - 1].key === newArr[j - 1].key) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = dp[i - 1][j] >= dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
        }
      }
    }

    // backtrack keys
    const seq = [];
    let i = n,
      j = m;
    while (i > 0 && j > 0) {
      if (oldArr[i - 1].key === newArr[j - 1].key) {
        seq.unshift(oldArr[i - 1].key);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return seq;
  }

  /**
   * Main diff function — computes minimal changes using LCS + move detection.
   *
   * Returns an array of change objects:
   *  - { type: 'remove', value: {key, item}, from: oldIndex }
   *  - { type: 'add',    value: {key, item}, index: newIndex }
   *  - { type: 'keep',   value: {key, item}, index: newIndex, from: oldIndex }
   *  - { type: 'move',   value: {key, item}, from: oldIndex, to: newIndex }
   */

  runDiff(oldArr, newArr) {
    // initialize wrappedOld on first call if needed
    if (this.wrappedOld.length === 0 && oldArr.length > 0) {
      this.wrappedOld = oldArr.map((item) => {
        let key = this.keyMap.get(item);
        if (!key) {
          key = uniqid("m:k", 4);
          this.keyMap.set(item, key);
        }
        return { key, item };
      });
    }

    const wrappedOld = this.wrappedOld;
    const wrappedNew = this.#persistKeys(wrappedOld, newArr);
    this.wrappedNew = wrappedNew;

    // quick maps for indices
    const oldKeyToIndex = new Map(wrappedOld.map((w, i) => [w.key, i]));
    const newKeyToIndex = new Map(wrappedNew.map((w, i) => [w.key, i]));

    // compute LCS by keys
    const lcsKeys = this.#LCSKeys(wrappedOld, wrappedNew);
    const lcsSet = new Set(lcsKeys);

    const changes = [];

    // 1) Removals: keys in old but not in new => remove
    for (let i = 0; i < wrappedOld.length; i++) {
      const w = wrappedOld[i];
      if (!newKeyToIndex.has(w.key)) {
        changes.push({ type: "remove", value: w, from: i });
      }
    }

    // 2) Walk new array order and emit add / keep / move.
    // We keep a pointer into LCS so "keep" is recognized in order.
    let lcsPtr = 0;
    for (let newIdx = 0; newIdx < wrappedNew.length; newIdx++) {
      const newW = wrappedNew[newIdx];
      const key = newW.key;
      const oldIdx = oldKeyToIndex.has(key) ? oldKeyToIndex.get(key) : -1;

      const currentLCSKey = lcsPtr < lcsKeys.length ? lcsKeys[lcsPtr] : null;

      if (oldIdx === -1) {
        // brand new
        changes.push({ type: "add", value: newW, index: newIdx });
      } else {
        // item exists in old
        if (key === currentLCSKey) {
          // this item is part of LCS sequence -> keep in-place
          changes.push({
            type: "keep",
            value: newW,
            index: newIdx,
            from: oldIdx,
          });
          lcsPtr++;
        } else {
          // present in both but not the next LCS item -> move
          changes.push({ type: "move", value: newW, from: oldIdx, to: newIdx });
        }
      }
    }

    // Update wrappedOld for next call
    this.wrappedOld = wrappedNew;

    return changes;
  }
}
