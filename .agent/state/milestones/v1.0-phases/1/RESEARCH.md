# Phase 1 Research: CRA to Vite Migration & Client Routing

> **Phase**: 1 - Modern Foundation, Vite Migration & Client Routing
> **Date**: 2026-10-14
> **Discovery Level**: Level 1 (Quick Verification)

## 1. Objectives & Context

Phase 1 establishes a fast, modern foundation for the entire platform expansion:
- Replace deprecated `react-scripts` (Create React App 5.0.1) with **Vite** (~120s build down to < 5s).
- Ensure smooth Three.js / React Three Fiber / `@react-spring/three` bundling under Vite.
- Introduce client-side routing (`react-router-dom`) to support Home, Auth, Dashboard, and dedicated variant pages.
- Encapsulate the ~3,000 LOC 3D Wormhole Chess game inside `/wormhole` with zero visual or interactive regressions.

## 2. Vite Migration Findings

### Dependency Changes
- **Remove:** `react-scripts`
- **Add (devDependencies):** `vite`, `@vitejs/plugin-react`
- **Add (dependencies):** `react-router-dom`

### HTML Entry Point
In Create React App, `public/index.html` was the template using `%PUBLIC_URL%`.
In Vite:
- `index.html` sits at the **root** of the repository.
- Remove all `%PUBLIC_URL%` tokens (e.g., replace `%PUBLIC_URL%/favicon.ico` with `/favicon.ico`).
- Add script entry:
  ```html
  <script type="module" src="/src/index.tsx"></script>
  ```

### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Maintain 'build' directory so existing Cloudflare Pages config continues without disruption
  },
  server: {
    port: 3000,
    open: true,
  },
});
```
*Note on `outDir: 'build'`*: Cloudflare Pages currently deploys from `./build/`. Keeping `outDir: 'build'` ensures total backward compatibility with the existing Cloudflare Pages configuration!

### Three.js & GLTF Asset Loading
- Static 3D assets in `public/chessboard/` (`wormhole-chessboard.glb`, `pieces.glb`) will continue to be served at `/chessboard/...` automatically by Vite's public directory handling.

### TypeScript Configuration (`tsconfig.json`)
CRA's tsconfig uses `"target": "es5"`. For Vite, update to:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## 3. Client Routing Architecture (`react-router-dom`)

### Route Hierarchy
```
/              -> HomePage (Hero, Variant Selection, Quick Play, Login prompt)
/wormhole      -> WormholePage (Encapsulates ChessboardScene with back-to-home navigation)
/deck-builder  -> DeckBuilderPage (Placeholder shell for Phase 4)
/dashboard     -> DashboardPage (Placeholder shell for Phase 2)
/login         -> LoginPage (Placeholder shell for Phase 2)
/register      -> RegisterPage (Placeholder shell for Phase 2)
```

## 4. Verification Strategy
1. Run `npm run build` using Vite.
   - Criteria: Must compile in under 10 seconds (vs 120+ seconds on CRA).
   - Artifacts: Outputs to `build/` directory with `index.html` and bundled assets.
2. Run `npm test` or verify unit tests.
3. Verify `/` loads HomePage with nav links.
4. Verify `/wormhole` loads the 3D Three.js canvas and board without errors.
