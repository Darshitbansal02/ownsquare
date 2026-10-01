export default [
  { ignores: ["**/node_modules/**", "**/coverage/**"] },
  {
    files: ["server/**/*.js", "shared/**/*.js"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-dupe-keys": "error",
      "no-undef": "error",
      "eqeqeq": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error"
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Buffer: "readonly", console: "readonly", process: "readonly",
        setTimeout: "readonly", URL: "readonly"
      }
    }
  }
];
