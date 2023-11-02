//@ts-check

import metaUrlPlugin from "@chialab/esbuild-plugin-meta-url";
import { isDev } from "./utils.mjs";

/**
 * @type {import('esbuild').BuildOptions}
 */
export const buildOptions = {
  bundle: true,
  sourcemap: isDev,
  minify: !isDev,
  format: "esm",
  target: "chrome100",
  plugins: [metaUrlPlugin()],
};

/**
 * @type {import('esbuild').BuildOptions}
 */
// export const appBuildOptions = {
//   ...buildOptions,
//   entryPoints: ["./src/app/index.ts"],
//   outdir: "./dist/app/",
// };

/**
 * @type {import('esbuild').BuildOptions}
 */
export const extBuildOptions = {
  ...buildOptions,
  entryPoints: ["./src/ext/main.ts"],
  outdir: "./dist",
};
