import tseslint from "typescript-eslint";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    linterOptions: { noInlineConfig: true },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: ["node:child_process", "child_process", "node:vm", "vm"],
        },
      ],
    },
  },
  {
    files: ["src/pedidos.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.object.name="banco"][callee.property.name=/^(exec|prepare)$/] > :matches(Identifier, BinaryExpression, CallExpression).arguments',
          message:
            "Use SQL literal e vincule valores por parâmetros (?); evite SQL dinâmico.",
        },
        {
          selector:
            'CallExpression[callee.object.name="banco"][callee.property.name=/^(exec|prepare)$/] > TemplateLiteral.arguments[expressions.length>0]',
          message: "SQL interpolado pode permitir injeção. Use parâmetros (?).",
        },
      ],
    },
  },
];
