export const reactTemplate = `
# Existing Codebase Context — Pre-initialized Vite + React App

The project has already been initialized using 'npm create vite@latest' with the React + TypeScript template. The following files and folders already exist in the codebase and are provided to you below in JSON format under 'existingFiles'.

## Rules for handling this existing codebase

1. **Do not recreate any file listed in 'existingFiles'.** These already exist on disk with the exact content shown. Treat their paths as reserved — you may only touch them via a '"modify"' action in 'modifiedFiles', and only if the new structure genuinely requires changing them (e.g. wiring a new provider into 'main.tsx', adding a route into 'App.tsx').
2. **Treat 'existingFiles' as ground truth for conventions.** Before proposing new folders/files, inspect:
 - Whether 'tsconfig.json' / 'tsconfig.app.json' defines path aliases (e.g. '@/*' → 'src/*'). If present, all new files must use that alias instead of deep relative paths ('../../../').
 - Whether 'vite.config.ts' has a 'resolve.alias' matching the tsconfig paths — if there's a mismatch between the two, note it in '"notes"' rather than silently trusting one.
 - The module system, target, and JSX settings in 'tsconfig.json' (e.g. '"jsx": "react-jsx"' means no need to import React in every file that uses JSX).
 - 'package.json' for the exact dependencies and devDependencies already installed — never import a package that isn't listed there. If the task needs one that's missing, add it to '"missingDependencies"' in your output instead of importing it.
 - The existing content and export shape of 'src/App.tsx', 'src/main.tsx', and 'src/index.css' / 'src/App.css', since almost every new feature will need to wire into 'App.tsx' and/or 'main.tsx'.
3. **Do not duplicate boilerplate.** The default Vite template already includes things like 'src/assets/react.svg', 'src/App.css', 'src/index.css', 'public/vite.svg'. Do not regenerate these or propose near-duplicates (e.g. don't create a second global stylesheet unless asked) — reuse or extend what exists.
4. **'main.tsx' is the true entry point, not 'App.tsx'.** If your new structure requires a top-level provider (Router, Redux Provider, QueryClientProvider, ThemeProvider, etc.), it must wrap '<App />' inside 'main.tsx', not inside 'App.tsx', unless the existing 'main.tsx' already nests providers inside 'App.tsx' by convention — check before deciding.
5. **'index.html' matters.** It already exists at the project root (not inside 'src/') and contains the '<div id="root">' mount point and the '<script type="module" src="/src/main.tsx">' tag. Do not propose changes to it unless the task explicitly requires modifying the HTML shell (e.g. adding a font link, meta tags, or a different mount strategy).
6. **File extensions must match Vite's TS template conventions**: '.tsx' for anything rendering JSX, '.ts' for pure logic. Match whatever 'existingFiles' demonstrates (strict mode, verbatimModuleSyntax settings in tsconfig affect whether you need 'import type { X }' vs 'import { X }' — check 'tsconfig.json' '"compilerOptions"' for this before writing type-only imports).
7. Apply all rules from your system prompt (structure/export/import correctness, strict JSON-only output, self-check before returning) using this existing codebase as the baseline you are building on top of — not replacing.
8. **'react-router-dom' is already installed** (see 'package.json' in 'existingFiles'). Use it for all routing needs — define routes using 'createBrowserRouter'/'<RouterProvider>' or '<BrowserRouter>'/'<Routes>'/'<Route>' matching whatever pattern (if any) already exists in 'main.tsx' or 'App.tsx', and never add it to 'missingDependencies'.

The existing files are provided below as 'existingFiles'. Parse them fully before producing your 'structure' / 'modifiedFiles' output.
{
"existingFiles": [
{
"path": "package.json",
"content": "{\n"name": "my-app",\n"private": true,\n"version": "0.0.0",\n"type": "module",\n"scripts": {\n"dev": "vite",\n"build": "tsc -b && vite build",\n"lint": "eslint .",\n"preview": "vite preview"\n},\n"dependencies": {\n"react": "^19.2.8",\n"react-dom": "^19.2.8",\n"react-router-dom": "^7.18.2"\n},\n"devDependencies": {\n"@eslint/js": "^10.0.1",\n"@types/node": "^24.13.3",\n"@types/react": "^19.2.17",\n"@types/react-dom": "^19.2.3",\n"@vitejs/plugin-react": "^6.0.4",\n"eslint": "^10.8.0",\n"eslint-plugin-react-hooks": "^7.1.1",\n"eslint-plugin-react-refresh": "^0.5.3",\n"globals": "^17.7.0",\n"typescript": "~6.0.2",\n"typescript-eslint": "^8.65.0",\n"vite": "^8.2.0"\n}\n}"
},
{
"path": "tsconfig.json",
"content": "{\n"files": [],\n"references": [\n{ "path": "./tsconfig.app.json" },\n{ "path": "./tsconfig.node.json" }\n]\n}"
},
{
"path": "tsconfig.app.json",
"content": "{\n"compilerOptions": {\n"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",\n"target": "es2023",\n"lib": ["ES2023", "DOM"],\n"module": "esnext",\n"types": ["vite/client"],\n"allowArbitraryExtensions": true,\n"skipLibCheck": true,\n"moduleResolution": "bundler",\n"allowImportingTsExtensions": true,\n"verbatimModuleSyntax": true,\n"moduleDetection": "force",\n"noEmit": true,\n"jsx": "react-jsx",\n"noUnusedLocals": true,\n"noUnusedParameters": true,\n"erasableSyntaxOnly": true,\n"noFallthroughCasesInSwitch": true\n},\n"include": ["src"]\n}"
},
{
"path": "tsconfig.node.json",
"content": "{\n"compilerOptions": {\n"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",\n"target": "es2023",\n"lib": ["ES2023"],\n"types": ["node"],\n"skipLibCheck": true,\n"module": "nodenext",\n"allowImportingTsExtensions": true,\n"verbatimModuleSyntax": true,\n"moduleDetection": "force",\n"noEmit": true,\n"noUnusedLocals": true,\n"noUnusedParameters": true,\n"erasableSyntaxOnly": true,\n"noFallthroughCasesInSwitch": true\n},\n"include": ["vite.config.ts"]\n}"
},
{
"path": "vite.config.ts",
"content": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n// [https://vite.dev/config/](https://vite.dev/config/)\nexport default defineConfig({\nplugins: [react()],\n})"
},
{
"path": "index.html",
"content": "<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>trial</title>\n</head>\n<body>\n<div id="root"></div>\n<script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n"
},
{
"path": "eslint.config.js",
"content": "import js from '@eslint/js'\nimport globals from 'globals'\nimport reactHooks from 'eslint-plugin-react-hooks'\nimport reactRefresh from 'eslint-plugin-react-refresh'\nimport tseslint from 'typescript-eslint'\nimport { defineConfig, globalIgnores } from 'eslint/config'\n\n\nexport default defineConfig([\nglobalIgnores(['dist']),\n{\nfiles: ['**/*.{ts,tsx}'],\nextends: [\njs.configs.recommended,\ntseslint.configs.recommended,\nreactHooks.configs.flat.recommended,\nreactRefresh.configs.vite,\n],\nlanguageOptions: {\nglobals: globals.browser,\n},\n},\n])\n"
},
{
"path": ".gitignore",
"content": "# Logs\n\nlogs\n*.log*\n*npm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\nlerna-debug.log*\n\nnode_modules\ndist\ndist-ssr\n*.local\n\n# Editor directories and files\n\n.vscode/*\n!.vscode/extensions.json\n.idea\n.DS_Store\n*.suo\n*.ntvs*\n*.njsproj\n*.sln\n*.sw?\n"
},
{
"path": "src/main.tsx",
"content": "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './index.css'\nimport App from './App.tsx'\n\n\ncreateRoot(document.getElementById('root')!).render(\n<StrictMode>\n<App />\n</StrictMode>,\n)\n"
},
{
"path": "src/App.tsx",
"content": "import { useState } from 'react'\nimport reactLogo from './assets/react.svg'\nimport viteLogo from './assets/vite.svg'\nimport heroImg from './assets/hero.png'\nimport './App.css'\n\n\nfunction App() {\nconst [count, setCount] = useState(0)\n\n\nreturn (\n<>\n<section id="center">\n<div className="hero">\n<img src={heroImg} className="base" width="170" height="179" alt="" />\n<img src={reactLogo} className="framework" alt="React logo" />\n<img src={viteLogo} className="vite" alt="Vite logo" />\n</div>\n<div>\n<h1>Get started</h1>\n<p>\nEdit <code>src/App.tsx</code> and save to test <code>HMR</code>\n</p>\n</div>\n<button\ntype="button"\nclassName="counter"\nonClick={() => setCount((count) => count + 1)}\n>\nCount is {count}\n</button>\n</section>\n\n\n<div className="ticks"></div></>\n)\n}\n\n\nexport default App\n"
},
{
"path": "src/App.css",
"content": ".counter {\nfont-size: 16px;\npadding: 5px 10px;\nborder-radius: 5px;\ncolor: var(--accent);\nbackground: var(--accent-bg);\nborder: 2px solid transparent;\ntransition: border-color 0.3s;\nmargin-bottom: 24px;\n\n&:hover {\nborder-color: var(--accent-border);\n}\n&:focus-visible {\noutline: 2px solid var(--accent);\noutline-offset: 2px;\n}\n}\n\n\n.hero {\nposition: relative;\n\n.base,\n.framework,\n.vite {\ninset-inline: 0;\nmargin: 0 auto;\n}\n\n.base {\nwidth: 170px;\nposition: relative;\nz-index: 0;\n}\n\n.framework,\n.vite {\nposition: absolute;\n}\n\n.framework {\nz-index: 1;\ntop: 34px;\nheight: 28px;\ntransform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)\nscale(1.4);\n}\n\n.vite {\nz-index: 0;\ntop: 107px;\nheight: 26px;\nwidth: auto;\ntransform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)\nscale(0.8);\n}\n}\n\n\n#center {\ndisplay: flex;\nflex-direction: column;\ngap: 25px;\nplace-content: center;\nplace-items: center;\nflex-grow: 1;\n\n@media (max-width: 1024px) {\npadding: 32px 20px 24px;\ngap: 18px;\n}\n}\n\n\n.ticks {\nposition: relative;\nwidth: 100%;\n\n&::before,\n&::after {\ncontent: '';\nposition: absolute;\ntop: -4.5px;\nborder: 5px solid transparent;\n}\n\n&::before {\nleft: 0;\nborder-left-color: var(--border);\n}\n&::after {\nright: 0;\nborder-right-color: var(--border);\n}\n}\n"
},
{
"path": "src/index.css",
"content": ":root {\n--text: #6b6375;\n--text-h: #08060d;\n--bg: #fff;\n--border: #e5e4e7;\n--code-bg: #f4f3ec;\n--accent: #aa3bff;\n--accent-bg: rgba(170, 59, 255, 0.1);\n--accent-border: rgba(170, 59, 255, 0.5);\n--social-bg: rgba(244, 243, 236, 0.5);\n--shadow:\nrgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;\n\n--sans: system-ui, 'Segoe UI', Roboto, sans-serif;\n--heading: system-ui, 'Segoe UI', Roboto, sans-serif;\n--mono: ui-monospace, Consolas, monospace;\n\nfont: 18px/145% var(--sans);\nletter-spacing: 0.18px;\ncolor-scheme: light dark;\ncolor: var(--text);\nbackground: var(--bg);\nfont-synthesis: none;\ntext-rendering: optimizeLegibility;\n-webkit-font-smoothing: antialiased;\n-moz-osx-font-smoothing: grayscale;\n\n@media (max-width: 1024px) {\nfont-size: 16px;\n}\n}\n\n@media (prefers-color-scheme: dark) {\n:root {\n--text: #9ca3af;\n--text-h: #f3f4f6;\n--bg: #16171d;\n--border: #2e303a;\n--code-bg: #1f2028;\n--accent: #c084fc;\n--accent-bg: rgba(192, 132, 252, 0.15);\n--accent-border: rgba(192, 132, 252, 0.5);\n--social-bg: rgba(47, 48, 58, 0.5);\n--shadow:\nrgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;\n}\n\n#social .button-icon {\nfilter: invert(1) brightness(2);\n}\n}\n\n#root {\nwidth: 1126px;\nmax-width: 100%;\nmargin: 0 auto;\ntext-align: center;\nborder-inline: 1px solid var(--border);\nmin-height: 100svh;\ndisplay: flex;\nflex-direction: column;\nbox-sizing: border-box;\n}\n\nbody {\nmargin: 0;\n}\n\nh1,\nh2 {\nfont-family: var(--heading);\nfont-weight: 500;\ncolor: var(--text-h);\n}\n\nh1 {\nfont-size: 56px;\nletter-spacing: -1.68px;\nmargin: 32px 0;\n@media (max-width: 1024px) {\nfont-size: 36px;\nmargin: 20px 0;\n}\n}\nh2 {\nfont-size: 24px;\nline-height: 118%;\nletter-spacing: -0.24px;\nmargin: 0 0 8px;\n@media (max-width: 1024px) {\nfont-size: 20px;\n}\n}\np {\nmargin: 0;\n}\n\ncode,\n.counter {\nfont-family: var(--mono);\ndisplay: inline-flex;\nborder-radius: 4px;\ncolor: var(--text-h);\n}\n\ncode {\nfont-size: 15px;\nline-height: 135%;\npadding: 4px 8px;\nbackground: var(--code-bg);\n}\n"
}
]
}
`