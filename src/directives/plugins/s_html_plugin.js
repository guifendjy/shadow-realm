// You'll want a tiny library like DOMPurify for the heavy lifting
// import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/+esm';

export default function dynamicHtmlRendering(R) {
  R.directive("s-html", ({ el, expression, execute }) => {
    const rawHtml = execute(expression);

    if (!rawHtml) {
      el.innerHTML = "";
      return;
    }

    // 1. Sanitization (Crucial)
    // If you have DOMPurify, use it. If not, we use a basic fallback.
    const cleanHtml =
      typeof DOMPurify !== "undefined"
        ? DOMPurify.sanitize(rawHtml)
        : basicSanitize(rawHtml);

    // 2. Fragment Rendering
    // Using a template fragment prevents the browser from
    // "pre-executing" resources before they are ready.
    const template = document.createElement("template");
    template.innerHTML = cleanHtml;

    // 3. Secure Update
    el.innerHTML = "";
    el.appendChild(template.content);
  });
}

// Minimalist fallback if DOMPurify isn't present
function basicSanitize(html) {
  // Remove script tags and inline event handlers (onmouseover, onclick, etc)
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/on\w+="[^"]*"/gim, "");
}
