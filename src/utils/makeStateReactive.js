import Signal from "./Signal.js";

export default function makeReative(raw_state) {
  const primitives = {}; // static values will be used to create proxy.
  const signals = {};
  const functions = {};

  for (const [key, value] of Object.entries(raw_state)) {
    if (typeof value === "function") {
      functions[key] = value;
    } else {
      signals[key] = new Signal(value);
      primitives[key] = value; // this will help with creating the proxy(EVALUATOR SCOPE)
    }
  }

  return { primitives, signals, functions };
}
