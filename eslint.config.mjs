import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/**",
    "tests/**",
    "scripts/**",
    "test_single.ts",
    "test_archive.ts",
    "inspect_edward.ts",
    "check_ledgers.ts",
    "fix_edward.ts",
  ]),
]);

export default eslintConfig;
