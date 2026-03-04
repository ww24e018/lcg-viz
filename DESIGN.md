# lcg-viz — Design Document

## Purpose

Visually validate the seeded Fisher-Yates shuffle used in the portfolio About page.
The function uses a Linear Congruential Generator (LCG) with Knuth's constants.
Goal: confirm visually that the shuffle looks unbiased across many seeds.

The original motivation: rather than auditing the math, do a quick visual check —
run the function over many seeds and look for unexpected patterns (stripes, bands, clustering).

---

## Algorithm (verbatim from portfolio `AboutView.vue`)

```ts
function minuteSeed(): number {
  const now = new Date()
  return (
    now.getFullYear() * 1000000 +
    (now.getMonth() + 1) * 10000 +
    now.getDate() * 100 +
    now.getHours() * 100 +
    now.getMinutes()
  )
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

**LCG constants:**
- Multiplier: `1664525`
- Increment: `1013904223`
- Modulus: `2^32` (via `& 0xffffffff`)
- Standard Knuth parameters — well-known for general non-crypto use

**Algorithm:** Fisher-Yates (Knuth) shuffle, using the LCG output as the random source.

---

## Visualizations

### 1. Position Heatmap

**What it shows:**
For each of K seeds, run shuffle on array `[0, 1, ..., N-1]`.
Record where each item lands. After K runs, build an N×N frequency matrix:
`matrix[i][j]` = how many times item `i` ended up in slot `j`.

**Rendering (D3):**
- N×N grid of colored rectangles
- Color scale: sequential (e.g., light yellow → dark blue), mapped to frequency count
- A perfectly uniform shuffle → all cells roughly the same color (count ≈ K/N)
- Watch for: diagonal stripes, dark/light rows or columns → indicate systematic bias

**Interaction:**
- Hover tooltip: `item i → slot j: count times`

**Default params:** N = 52, K = 10 000

---

### 2. Scatter / Dot Cloud

**What it shows:**
For each seed (x-axis = seed index 0..K), where does element `0` land after the shuffle (y-axis = output position 0..N-1)?

**Rendering (D3):**
- SVG scatter plot
- X: seed index, Y: landing position of item 0
- Each point = one shuffle run
- Good result → noise-like cloud filling the space
- Bad result → diagonal bands, horizontal stripes, periodic patterns

**Interaction:**
- Hover tooltip: `seed index: X, position: Y`

**Default params:** K = 2 000 (fewer points needed for visual clarity)

---

## What to look for

| Pattern | Meaning |
|---|---|
| Uniform heatmap colors | Shuffle is well-distributed across positions |
| Diagonal stripe in heatmap | LCG period causes item i to prefer slot i+k |
| Horizontal band in scatter | Item 0 is over-represented in certain slots |
| Noise cloud in scatter | Good — no obvious periodicity |

---

## App controls

- **N slider** (array size): range 8–52, default 52
- **K slider** (seed count): range 500–20 000, default 10 000 (heatmap) / 2 000 (scatter)
- Or share a single K control — both charts update reactively

---

## D3-in-Vue pattern

D3 and Vue's reactivity can conflict if both try to manage the DOM.
Use this pattern:

```ts
// In Heatmap.vue / Scatter.vue
const svgRef = ref<SVGSVGElement | null>(null)

onMounted(() => render())
watch(() => props.data, () => render(), { deep: true })

function render() {
  const svg = d3.select(svgRef.value)
  // D3 owns everything inside the SVG
  // Use enter/update/exit pattern
}
```

- Vue template: only `<svg ref="svgRef" />`
- D3 handles all child elements (rects, circles, axes, tooltips)
- Props pass computed data (matrix or points array) from App.vue

---

## Deployment

- GitHub Pages, repo: `ww24e018/lcg-viz`
- `vite.config.ts` `base: '/lcg-viz/'` — required for asset paths to resolve on Pages
- GitHub Actions workflow: `.github/workflows/deploy.yml`
  - Trigger: push to `main`
  - Steps: checkout → Node setup → `npm ci` → `npm run build` → deploy `dist/` to `gh-pages`
- Live URL: https://ww24e018.github.io/lcg-viz/
- After first deploy: enable in repo Settings → Pages → source: `gh-pages` branch
