# image-keyword-app-frontend

The photographer-facing app for Pixel Keywords: upload images, get
AI-generated titles / descriptions / keywords / Getty keywords, edit them in a
grid, embed the metadata into the JPEGs, organise folders, track sales, buy
credits.

## Stack

- React 19 + Vite 5
- Redux (plain `redux`, single root reducer) for auth/UI state
- `react-data-grid` for the keyword editor, `piexifjs` for EXIF/XMP embedding,
  `localforage` for the picked-directory handle and de-dupe cache
- Stripe Elements + a PayPal button for purchases
- Vitest + React Testing Library

## Running

```bash
cp .env .env.local   # or edit .env — needs VITE_API_URL + VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev          # http://localhost:5173
```

`VITE_API_URL` points at the backend (e.g. `http://localhost:3001`). When it's
blank the Vite dev proxy forwards `/api`, `/analyze`, `/tsv` instead.

## Tests / lint / build

```bash
npm test          # vitest
npm run lint      # eslint (0 errors; ~45 warnings are known debt)
npm run build
```

CI runs all three on every PR.

## Layout

```
src/
  main.jsx              routing shell (manual switch on location.pathname) + auth guards
  pages/                FoldersPage, ImportPage (the grid), StatisticPage,
                        PaymentPage, Landing/Login/Terms/Privacy/Welcome
  components/           AuthPanel, modals, Toast, FastTooltip, IstockGettyExportModal
  services/             authService, analyzeService, tsvService — fetch wrappers
  store/                redux store + actions + useStore facade
  hooks/                useApi (big fetch hook), useAuthRedux, useFoldersRedux
  utils/                metadataEmbedding (EXIF/XMP), hash, postLoginRedirect
```

## Known debt (surfaced as lint warnings, not fixed)

- `ImportPage.jsx` is ~3.6k lines. Its three `react-data-grid` editable cells
  call hooks inside `renderCell` (works because the grid renders them as
  components) — flagged with a scoped `eslint-disable` and a TODO to extract
  them into named components once the page has test coverage.
- Several dead local variables in the large page components.
- `react-hooks/exhaustive-deps` warnings left as-is (changing deps risks
  behaviour changes without tests to catch regressions).
