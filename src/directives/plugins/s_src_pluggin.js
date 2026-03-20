export default function (Realm) {
  Realm.directive("s-src", ({ el, expression, execute }) => {
    const updateSrc = (value) => {
      // 1. Safety Check: Prevent undefined/null from breaking the UI
      if (!value) {
        el.src = "";
        return;
      }

      // 2. Security Check: Basic Sanitization
      // Prevent javascript: protocol injection via expressions
      if (
        typeof value === "string" &&
        value.toLowerCase().startsWith("javascript:")
      ) {
        console.warn(`[Realm] Blocked potential XSS on s-src: ${value}`);
        el.src = "";
        return;
      }

      // 3. Apply the value and ensure visibility
      el.src = value;
    };

    // Execute the expression
    const result = execute(expression);

    // 4. Async Support: Handle Promises (useful if fetching blobs on the fly)
    if (result instanceof Promise) {
      result.then(updateSrc).catch((err) => {
        console.error(`[Realm] s-src error in expression: ${expression}`, err);
        updateSrc(null);
      });
    } else {
      updateSrc(result);
    }
  });
}
