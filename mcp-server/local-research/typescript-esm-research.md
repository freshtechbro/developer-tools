Querying Perplexity AI using sonar-pro for: TypeScript ES modules configuration best practices with Node.js, focusing on moduleResolution, file extensions, and package.json settings
To configure TypeScript ES modules with Node.js, follow these best practices:

1. Set `"type": "module"` in package.json to treat .js files as ES modules[1][6].

2. Use `.mts` extension for TypeScript ES module files and `.cts` for CommonJS files[3][8].

3. Configure tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node16",
    "outDir": "dist",
    "esModuleInterop": true
  }
}
```

4. Set `moduleResolution` to "node16" or "nodenext" for modern Node.js versions[2][7].

5. Use `--experimental-modules` flag when running Node.js[1].

6. For package exports, use the "exports" field in package.json:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

7. Compile TypeScript files using:

```
tsc -p tsconfig.json
```

8. Run the compiled JS files with:

```
node --experimental-modules dist/index.js
```

These practices ensure proper ES module support in TypeScript projects with Node.js[1][2][3][6][7][8].