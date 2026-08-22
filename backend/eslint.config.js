import js from "@eslint/js";

export default [
  { ignores: ["node_modules"] },
  { files: ["src/**/*.js"], ...js.configs.recommended, rules: { "no-unused-vars": ["error", { args: "none" }] } }
];