const evaluator = (expression, scope) => {
  try {
    const runner = new Function(
      "scope",
      `with (scope) { return (${expression}); }`,
    );

    let result = runner(scope);

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
