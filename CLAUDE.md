# lcg-viz — Claude Context

Standalone mini-app to visually validate the LCG-based seeded shuffle function from the portfolio project.

## Commands

```bash
npm run dev      # dev server (localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Stack

| Concern | Library |
|---|---|
| Framework | Vue 3 (`<script setup>` Composition API) |
| Build | Vite (base: `/lcg-viz/` for GitHub Pages) |
| Types | TypeScript (strict) |
| Visualization | D3 v7 |

## Project structure

```
src/
  lcg.ts              ← minuteSeed, lcg (step fn), lcgIterator (generator), seededShuffle
  App.vue             ← layout shell + controls (N slider, K slider)
  components/
    Heatmap.vue       ← D3 position-frequency heatmap
    Scatter.vue       ← D3 dot-cloud scatter plot
  assets/main.css     ← all styles (plain CSS, no framework)
  main.ts             ← app bootstrap
```

## Design & visualization spec

See `DESIGN.md` for:
- Full algorithm listing with LCG constants
- Visualization specifications for heatmap and scatter
- What to look for (good vs bad output patterns)
- D3-in-Vue rendering pattern to follow

## Deployment

GitHub Pages via GitHub Actions. Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main`
- Builds and deploys `dist/` to `gh-pages` branch
- Live URL: https://ww24e018.github.io/lcg-viz/
- Enable in repo Settings → Pages → source: `gh-pages` branch

## Styling conventions

- All CSS in `src/assets/main.css` — no scoped styles in SFCs
- Design tokens as CSS custom properties on `:root`
- Plain, minimal — this is a utility/visualization tool, not a polished product page
- No CSS framework or preprocessor

## Branch conventions

- Feature work: `feature/YYYY-MM-DD-description`
- Bug fixes: `bugfix/YYYY-MM-DD-description`
- After branch work, push and open PR rather than merging locally
