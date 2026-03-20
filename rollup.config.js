import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/shadow_realm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/shadow_realm.min.js",
      format: "esm",
      plugins: [terser()],
    },
  ],
  plugins: [nodeResolve()],
  watch: {
    include: "src/**",
    exclude: "node_modules/**",
    clearScreen: false,
    buildDelay: 100,
  },
};
