import { STORE_MARKER } from "../globals.js";
// this returns any pottential property used in an expression
export default function getTokensFromExpression(expression) {
  const tokens = expression
    .replace(/(['"])(?:(?!\1|\\).|\\.)*\1/g, "") // Remove quoted substrings
    .trim()
    .split(/[^a-zA-Z_$\.]+/)
    .filter(Boolean);

  // removes duplicate and only returns the first part of the token
  // e.g. "a.b.c" will return "a"
  // e.g. "a[0].b" will return "a"
  // e.g. "a[0]" will return "a"
  // e.g. "a.b" will return "a"
  const filteredTokens = [...new Set(tokens)]
    .map((token) => {
      if (token.startsWith(STORE_MARKER)) {
        return token; // token at index 1 is the store name. keep it as is.
      }
      if (token.includes(".")) {
        return token.split(".")[0];
      }
      if (token.includes("[")) {
        return token.split("[")[0];
      }
      return token;
    })
    .filter((token, index, self) => self.indexOf(token) === index)
    .filter(Boolean);

  return filteredTokens || [];
}
