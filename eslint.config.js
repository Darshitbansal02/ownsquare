import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
export default [
  {ignores:['**/node_modules/**','**/dist/**','**/.cache/**','**/coverage/**']},
  js.configs.recommended,
  {files:['**/*.{js,mjs,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.node,...globals.browser}},rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^(React|[A-Z])'}]}},
  {files:['client/src/**/*.{js,jsx}'],plugins:{'react-hooks':hooks},rules:{'react-hooks/rules-of-hooks':'error'}}
];
