const evaluator = (expression, scope) => {
  try {
    // 1. Create the base evaluator
    const runner = new Function(
      "scope",
      `with (scope) { return (${expression}); }`,
    );

    // 2. Get the result
    const result = runner(scope);

    // 3. SMART EXECUTION: If the result is a function reference (like 'clearInput'),
    // run it immediately. If it was a statement (like 'count++'), it's already done.
    if (typeof result === "function") {
      return result.call(scope);
    }

    return result;
  } catch (e) {
    console.error(
      `Shadow Realm Execution Error: "${expression}"`,
      e,
      "__SCOPE:",
      scope,
    );
    return null;
  }
};

export default evaluator;
