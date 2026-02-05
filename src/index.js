import Realm from "./shadow_realm/index.js";
import R from "./directives/directiveRegitry.js";

R.store("theme", () => ({
  dark: true,
  toggle() {
    this.dark = !this.dark;
  },
}));

/**
 * NOTE: I should probably find a better way of gathering states 
 * and bindings and have a better arhitecture for proxies. 
 * if they are even necessary.
 */
const app = new Realm();
app.initialize();

export default Realm;
