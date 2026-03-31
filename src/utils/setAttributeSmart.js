const propMap = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

/**
 * Set attributes on an Element.
 * @internal
 * @param {Node} el
 * @param {String} name
 * @param {String | Object} value
 *@returns {void}
 *
 * @ts-ignore
 *  */

export default function setAttr(el, name, value) {
  applyValue(el, name, value);
}

function applyValue(el, name, value) {
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";

  if (value == null) {
    removeAttr(el, name);
    return;
  }

  if (isSvg) {
    // Handle xlink:href, xmlns, etc.
    if (name === "xlink:href") {
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", value);
    } else if (name === "className") {
      el.setAttribute("class", value);
    } else {
      el.setAttribute(name, value);
    }
    return;
  }

  if (name === "style") {
    if (typeof value === "object") {
      for (const [prop, val] of Object.entries(value)) {
        if (val) {
          // this is better than set property because it can handle css variables and other non camelCase properties
          el.style[prop] = val;
        } else {
          el.style[prop] = "";
        }
      }
    } else {
      el.style.cssText = value;
    }
    return;
  }

  if (name === "className" || name === "class") {
    if (typeof value === "object") {
      for (const [prop, val] of Object.entries(value)) {
        val && el.classList.add(prop);
        !val && el.classList.remove(prop);
      }
    } else {
      el.className = value;
    }
    return;
  }

  if (name.startsWith("data-") || name.startsWith("aria-")) {
    el.setAttribute(name, value);
    return;
  }

  // Boolean attributes
  if (typeof value === "boolean") {
    const prop = propMap[name] || name;
    if (prop in el) {
      el[prop] = value;
    } else {
      if (value) el.setAttribute(name, "");
      else el.removeAttribute(name);
    }
    return;
  }

  // Fallback: property or attribute
  const prop = propMap[name] || name;
  if (prop in el) {
    el[prop] = value;
  } else {
    el.setAttribute(name, value);
  }
}

function removeAttr(el, name) {
  const prop = propMap[name] || name;
  if (name in el) {
    try {
      el[prop] = typeof el[prop] === "boolean" ? false : "";
    } catch {}
  }
  el.removeAttribute(name);
}

function sanitizeString(input) {
  let Booleans = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "NaN",
    "Infinity",
    "-Infinity",
  ];

  let sanitizedString = input;
  Booleans.forEach((booleanValue) => {
    const regex = new RegExp(`\\b${booleanValue}\\b`, "g");
    sanitizedString = sanitizedString.replace(regex, "");
  });
  return sanitizedString.trim();
}
