/**
 * Shadow Realm Plugin: Markdown Rendering
 * Automatically loads the 'marked' library and registers the s-markdown directive.
 */
const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

let loadMarked; // Lazy-loaded promise

export default function markdownRendering(R) {
  // 2. Register the directive
  R.directive("s-markdown", async ({ el, expression, execute }) => {
    try {
      // Load marked only when directive is first used
      if (!loadMarked) {
        loadMarked = new Promise((resolve, reject) => {
          if (window.marked) return resolve();

          const script = document.createElement("script");
          script.src = SCRIPT_URL;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load marked.js"));
          document.head.appendChild(script);
        });
      }

      await loadMarked;

      const markdownInput = execute(expression);

      if (markdownInput) {
        el.innerHTML = window.marked.parse(markdownInput);
      }
    } catch (err) {
      console.error("s-markdown error:", err);
      el.textContent = "Error loading markdown engine.";
    }
  });
}
