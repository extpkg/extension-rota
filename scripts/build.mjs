// @ts-check

import * as esbuild from "esbuild";
import { cpSync, existsSync, readFileSync, rm, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import typescript from "typescript";
import metaUrlPlugin from "@chialab/esbuild-plugin-meta-url";

const mode = process.env["NODE_ENV"] ?? "development";
const isDev = mode === "development";
const __dirname = resolve();
const dirs = {
  source: resolve(__dirname, "src"),
  public: resolve(__dirname, "public"),
  dist: resolve(__dirname, "dist"),
};

/**
 * Reads typescript config
 * @param {string} configPath
 * @returns {{options: typescript.CompilerOptions, fileNames: string[]}}
 */
const readConfig = (configPath) => {
  const rawConfig = JSON.parse(readFileSync(configPath, "utf-8"));
  const basePath = dirname(configPath);
  const { options, fileNames, errors } = typescript.parseJsonConfigFileContent(
    rawConfig,
    typescript.sys,
    basePath,
  );

  if (errors && errors.length) {
    throw new Error(
      typescript.formatDiagnostics(errors, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: process.cwd,
        getNewLine: () => typescript.sys.newLine,
      }),
    );
  }

  return { options, fileNames };
};

/**
 * Does type checking on ts files
 * @returns {boolean}
 */
const typeCheck = () => {
  const { options, fileNames } = readConfig("./tsconfig.json");
  const program = typescript.createProgram(fileNames, options);
  const emitResult = program.emit();

  const allDiagnostics = typescript
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  let hasErrors = false;

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.category === typescript.DiagnosticCategory.Error) {
      hasErrors = true;
    }

    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start ?? 0,
      );
      const message = typescript.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${
          character + 1
        }): ${message}`,
      );
    } else {
      console.log(
        typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
    }
  });

  return !hasErrors;
};

const updateManifestWithPackageVersions = () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(__dirname, "package.json"), "utf-8"),
  );

  const extpkgVersions = {};

  for (const [key, value] of Object.entries(packageJson.devDependencies)) {
    if (key.startsWith("@extpkg/types")) {
      extpkgVersions[key.split("@extpkg/types-")[1]] = value.replace("^", "");
    }
  }

  const manifestJson = JSON.parse(
    readFileSync(resolve(dirs.dist, "manifest.json"), "utf-8"),
  );

  for (const [key, value] of Object.entries(extpkgVersions)) {
    if (manifestJson.modules[key]) {
      manifestJson.modules[key].module_version = value;
    }
  }

  writeFileSync(
    resolve(dirs.dist, "manifest.json"),
    JSON.stringify(manifestJson, null, 2),
  );
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const buildOptions = {
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
// const appBuildOptions = {
//   ...buildOptions,
//   entryPoints: ["./src/app/index.ts"],
//   outdir: "./dist/app/",
// };

/**
 * @type {import('esbuild').BuildOptions}
 */
const extBuildOptions = {
  ...buildOptions,
  entryPoints: ["./src/ext/main.ts"],
  outdir: "./dist",
};

const copyAssets = () => {
  if (existsSync(dirs.public)) {
    cpSync(dirs.public, dirs.dist, {
      recursive: true,
    });
  }
};

rm(dirs.dist, { recursive: true, force: true }, (err) => {
  if (err) console.error(err);
});

const isTypeCheckOk = typeCheck();
if (!isTypeCheckOk) process.exit(1);

// await esbuild.build(appBuildOptions);
await esbuild.build(extBuildOptions);

copyAssets();
updateManifestWithPackageVersions();
