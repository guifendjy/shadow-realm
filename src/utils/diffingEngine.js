import uniqid from "./unniq.js";

export default class LCSDiffEngine {
  constructor() {
    this.wrappedOld = [];
    this.keyMap = new Map(); // Stable registry for object identities
    this.idCounter = 0;
  }

  /**
   * Generates a stable base key.
   * Prioritizes IDs, then references, then content hashes.
   */
  #generateBaseKey(item) {
    // 1. Explicit ID (Survived the immutable clone)
    if (item && typeof item === "object") {
      const explicitId = item.id ?? item.key;
      if (explicitId !== undefined) return `id:${explicitId}`;
    }

    // 2. Object Reference (If it didn't change)
    if (typeof item === "object" && item !== null) {
      if (!this.keyMap.has(item)) {
        this.keyMap.set(item, `obj:${this.idCounter++}`);
      }
      return this.keyMap.get(item);
    }

    // 3. Primitive hash
    const t = typeof item;
    return item === null ? "null" : `${t}:${item}`;
  }

  /**
   * Creates the final wrapped array with @count suffixes for duplicates.
   */
  #persistKeys(oldWrapped, newArr) {
    const wrappedNew = [];
    const seenInThisPass = new Map();

    // Optional: Create a pool of old keys to try and re-use them
    // if identity matches but position changed.
    const oldPool = new Map();
    for (const w of oldWrapped) {
      if (!oldPool.has(w.item)) oldPool.set(w.item, []);
      oldPool.get(w.item).push(w.key);
    }

    for (let i = 0; i < newArr.length; i++) {
      const item = newArr[i];
      const baseKey = this.#generateBaseKey(item);
      const count = (seenInThisPass.get(baseKey) || 0) + 1;
      seenInThisPass.set(baseKey, count);

      const finalKey = `${baseKey}@${count}`;

      wrappedNew.push({ key: finalKey, item });
    }
    return wrappedNew;
  }

  #LCSKeys(oldArr, newArr) {
    const n = oldArr.length,
      m = newArr.length;
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (oldArr[i - 1].key === newArr[j - 1].key) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

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

  runDiff(oldArr, newArr) {
    // 1. Initial Wrap
    if (this.wrappedOld.length === 0 && oldArr.length > 0) {
      this.wrappedOld = this.#persistKeys([], oldArr);
    }

    const wrappedNew = this.#persistKeys(this.wrappedOld, newArr);
    this.wrappedNew = wrappedNew;

    // 2. Prefix/Suffix Trimming (Bail out early)
    let start = 0;
    let oldEnd = this.wrappedOld.length - 1;
    let newEnd = wrappedNew.length - 1;

    while (
      start <= oldEnd &&
      start <= newEnd &&
      this.wrappedOld[start].key === wrappedNew[start].key
    ) {
      start++;
    }
    while (
      oldEnd >= start &&
      newEnd >= start &&
      this.wrappedOld[oldEnd].key === wrappedNew[newEnd].key
    ) {
      oldEnd--;
      newEnd--;
    }

    const dirtyOld = this.wrappedOld.slice(start, oldEnd + 1);
    const dirtyNew = wrappedNew.slice(start, newEnd + 1);

    const middleLcsKeys =
      dirtyOld.length > 0 && dirtyNew.length > 0
        ? this.#LCSKeys(dirtyOld, dirtyNew)
        : [];

    const lcsKeys = [
      ...this.wrappedOld.slice(0, start).map((w) => w.key),
      ...middleLcsKeys,
      ...this.wrappedOld.slice(oldEnd + 1).map((w) => w.key),
    ];

    // 3. Map Instructions
    const instructionMap = new Map();
    const oldKeyMap = new Map(
      this.wrappedOld.map((w, i) => [w.key, { item: w.item, index: i }]),
    );
    const newKeys = new Set(wrappedNew.map((w) => w.key));

    // Removals
    for (const w of this.wrappedOld) {
      if (!newKeys.has(w.key)) instructionMap.set(w.key, { type: "remove" });
    }

    // Add / Keep / Move
    let lcsPtr = 0;
    for (const nw of wrappedNew) {
      const key = nw.key;
      const oldEntry = oldKeyMap.get(key);

      if (!oldEntry) {
        instructionMap.set(key, { type: "add", value: nw });
      } else {
        const isLCS = key === lcsKeys[lcsPtr];
        const isPatched = oldEntry.item !== nw.item; // Immutable check

        if (isLCS) {
          instructionMap.set(key, { type: "keep", patch: isPatched });
          lcsPtr++;
        } else {
          instructionMap.set(key, { type: "move", patch: isPatched });
        }
      }
    }

    this.wrappedOld = wrappedNew;
    return instructionMap;
  }
}
