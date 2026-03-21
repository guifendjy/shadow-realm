/**
 * Shadow Realm Plugin: Markdown Rendering
 * Automatically loads the 'marked' library and registers the s-markdown directive.
 */
export default function markdownRendering(R) {
  const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

  // 1. Inject the script into the DOM
  const loadMarked = new Promise((resolve, reject) => {
    if (window.marked) return resolve(); // Already loaded

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load marked.js"));
    document.head.appendChild(script);
  });

  // 2. Register the directive
  R.directive("s-markdown", async ({ el, expression, execute }) => {
    try {
      // Ensure the library is ready before parsing
      await loadMarked;

      const markdownInput = execute(expression);
      
      // Use marked.parse to convert string to HTML
      if (markdownInput) {
        el.innerHTML = window.marked.parse(markdownInput);
      }
    } catch (err) {
      console.error("s-markdown error:", err);
      el.textContent = "Error loading markdown engine.";
    }
  });
}