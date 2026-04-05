import js from "@eslint/js";

export default [
  {
    ignores: ["public/**", "node_modules/**", "scripts/**", ".astro/**"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
