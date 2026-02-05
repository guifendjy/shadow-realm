function stripBrackets(str) {
  return str.replace(/\[|\]/g, "");
}

function stripPrefix(str, prefix) {
  return str.replace(prefix, "");
}

function stripSuffix(str, suffix) {
  return str.replace(suffix, "");
}

export { stripBrackets, stripPrefix, stripSuffix };
