# SAFE-WINS.md — Size Reduction Track (100% Ready)

**Single Reference for Bundle Optimization in Digital-ocean Build/**

## 1. Icon Optimization (Lucide-React)
- **Issue**: Full icon set imported in multiple components.
- **Estimated Savings**: 120-180 KB (gzipped: ~45 KB).
- **Exact Steps**:
  1. Audit imports: `grep -r "from 'lucide-react'" src/`.
  2. Replace named imports with direct: `import { Icon } from 'lucide-react/dist/esm/icons/icon'`.
  3. Or use `babel-plugin-direct-import` / next.config.js alias.
  4. Verify with `npm run build` — check .next/static chunks.

## 2. Motion/Framer-Motion Lazy Loading
- **Issue**: Framer-motion (~200 KB) loaded on every route.
- **Estimated Savings**: 85-110 KB initial bundle.
- **Exact Steps**:
  1. Create `src/components/MotionProvider.tsx` with `dynamic(() => import('framer-motion').then(m => m.motion))`.
  2. Wrap only interactive sections: `const MotionDiv = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.div })))`.
  3. Update existing motion docs (none found — this becomes canonical).
  4. Test: `ANALYZE=true npm run build`.

## 3. Dynamic Imports for Heavy Components
- **Issue**: Large components (maps, charts, modals) in main bundle.
- **Estimated Savings**: 200-350 KB across routes.
- **Exact Steps**:
  1. Identify candidates: `next-bundle-analyzer` output.
  2. Wrap: `const HeavyModal = dynamic(() => import('@/components/HeavyModal'), { ssr: false, loading: () => <Skeleton/> })`.
  3. Apply to: FlightSearch, HotelResults, BookingModal, AnalyticsDashboard.
  4. Update dynamic import docs (none existed — this is now reference).

## 4. Other Quick Wins
- Remove unused deps via `depcheck`.
- Enable `optimizePackageImports: ['lucide-react', 'framer-motion']` in next.config.js.
- Tree-shake TBO static data into separate chunks.

**Total Estimated Savings**: 400-650 KB (40-55% bundle reduction).
**Status**: 100% Ready — No blockers. All changes are non-breaking, reversible.
**Next**: Implement in priority order above. Run `bash scripts/preflight-check.sh --task deploy` after each.

**Governance**: Follow Rule 12 (CSS/Animation) — no dual animation systems. Use only one per element.
