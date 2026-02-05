export default function scrollTextPlugin(S) {
  S.directive("s-scroll-text", ({ el, expression, execute }) => {
    // 1. INITIALIZATION (Runs once)
    if (!el._isInitialized) {
      el.style.overflow = "hidden";
      el.style.height = "1em";

      // Create a persistent wrapper
      const wrapper = document.createElement("span");
      wrapper.style.transition = "transform 0.3s ease";
      wrapper.style.display = "block";

      // Create two permanent slots
      const slotA = document.createElement("span");
      const slotB = document.createElement("span");

      // Ensure they both take up exactly 1 line height
      [slotA, slotB].forEach((s) => {
        s.style.height = "1em";
        s.style.display = "block";
      });

      wrapper.append(slotA, slotB);
      el.innerHTML = ""; // Clear initial text
      el.append(wrapper);

      // Store references on the element to avoid DOM lookups later
      el._storage = { wrapper, slotA, slotB, current: "" };
      el._isInitialized = true;
    }

    // 2. EXECUTION (Runs every state change)
    const nextText = execute(expression);
    const { wrapper, slotA, slotB, current } = el._storage;

    if (nextText === current) return;

    // Set the "Next" text in the bottom slot
    slotB.textContent = nextText;

    // Trigger the slide
    wrapper.style.transition = "transform 0.3s ease";
    wrapper.style.transform = "translateY(-100%)";

    // 3. THE CLEANUP (No permanent listener)
    // We use a timer or a 'once' listener to reset the stage
    setTimeout(() => {
      // Instant swap: move nextText to top slot
      slotA.textContent = nextText;
      el._storage.current = nextText;

      // Disable transition and snap back to top
      wrapper.style.transition = "none";
      wrapper.style.transform = "translateY(0)";
    }, 300); // Matches the 0.3s transition
  });
}
