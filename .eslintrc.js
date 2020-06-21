module.exports = {
  "env": {
    "browser": false,
    "es6": true,
    "node": true
  },
  "parserOptions": {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    "project": "tsconfig.json",
    "sourceType": "module",
    createDefaultProgram: true, // temp fix https://stackoverflow.com/a/59886133/1148030
  },
  "plugins": [
    "@typescript-eslint",
    "jest"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  "rules": {
    "@typescript-eslint/explicit-module-boundary-types": 0,
  }
}