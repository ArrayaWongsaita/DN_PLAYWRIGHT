import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

// บทที่ตั้งใจสอนสิ่งที่ปกติถือว่าไม่ดี (บอกใน README ของบทแล้ว) จึงลดกฎเหลือ warn
const relaxedLessons = [
  "lessons/03-*/**",
  "lessons/13-*/**",
  "lessons/14-*/**",
  "lessons/15-*/**",
  "lessons/18-*/**",
  "lessons/54-*/**",
];

export default tseslint.config(
  {
    ignores: [".next/**", "playwright-report/**", "test-results/**", "blob-report/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [tseslint.configs.base],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    files: ["lessons/**/*.ts", "internal/**/*.ts"],
    ...playwright.configs["flat/recommended"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-skipped-test": "off",
      "playwright/expect-expect": "off",
    },
  },
  {
    files: relaxedLessons.map((d) => `${d}/*.ts`).concat(relaxedLessons.map((d) => `${d}/**/*.ts`)),
    rules: {
      "playwright/no-wait-for-timeout": "warn",
      "playwright/no-element-handle": "warn",
      "playwright/no-eval": "warn",
      "playwright/no-force-option": "warn",
      "playwright/no-conditional-in-test": "warn",
      "playwright/no-conditional-expect": "warn",
      "playwright/no-networkidle": "warn",
      "playwright/no-page-pause": "warn",
      "playwright/no-useless-not": "warn",
      "playwright/prefer-web-first-assertions": "warn",
      "playwright/missing-playwright-await": "warn",
      "playwright/valid-expect": "warn",
      "playwright/no-wait-for-selector": "warn",
      "playwright/no-wait-for-navigation": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
    },
  },
);
