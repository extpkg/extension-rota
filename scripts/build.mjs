// @ts-check

import { execSync } from "node:child_process";
import * as esbuild from "esbuild";
import {
  clean,
  copyAssets,
  typeCheck,
  updateManifestWithPackageVersions,
} from "./utils.mjs";
import { extBuildOptions } from "./esbuild.config.mjs";

export const build = async () => {
  clean();
  const isTypeCheckOk = typeCheck();
  if (!isTypeCheckOk) process.exit(1);

  // await esbuild.build(appBuildOptions);
  await esbuild.build(extBuildOptions);

  copyAssets();
  updateManifestWithPackageVersions();
};

await build();

if (process.env.NODE_ENV === "production") {
  try {
    execSync("(rm -f dist.zip && cd dist && zip -r ../dist.zip .)", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Error running npm run build:", error);
    process.exit(1);
  }
}
