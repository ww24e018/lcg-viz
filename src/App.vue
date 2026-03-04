<script setup lang="ts">
import { ref, computed } from 'vue'
import { seededShuffle } from './lcg'
import Heatmap from './components/Heatmap.vue'
import Scatter from './components/Scatter.vue'

const N = ref(52)
const K = ref(2000)
const colorScale = ref('YlGnBu')

const COLOR_SCALES = ['YlGnBu', 'Viridis', 'Plasma', 'Inferno', 'Magma', 'Warm', 'Cool', 'RdYlGn']

// N×N frequency matrix: matrix[i][j] = how many times item i landed in slot j
const heatmapMatrix = computed<number[][]>(() => {
  const n = N.value
  const k = K.value
  const arr = Array.from({ length: n }, (_, i) => i)
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let seed = 0; seed < k; seed++) {
    const shuffled = seededShuffle(arr, seed)
    for (let pos = 0; pos < n; pos++) {
      matrix[shuffled[pos]!]![pos]!++
    }
  }
  return matrix
})

// Scatter: for each seed index, where does item 0 land?
const scatterPoints = computed<Array<{ x: number; y: number }>>(() => {
  const n = N.value
  const k = K.value
  const arr = Array.from({ length: n }, (_, i) => i)
  const points: Array<{ x: number; y: number }> = []
  for (let seed = 0; seed < k; seed++) {
    const shuffled = seededShuffle(arr, seed)
    points.push({ x: seed, y: shuffled.indexOf(0) })
  }
  return points
})
</script>

<template>
  <header>
    <h1>LCG Shuffle Validator</h1>
    <p class="subtitle">Visual bias check for the seeded Fisher-Yates shuffle (Knuth LCG constants)</p>
  </header>

  <div class="controls">
    <div class="control-group">
      <label>N — array size</label>
      <input type="range" min="8" max="52" step="1" v-model.number="N" />
      <span class="control-value">{{ N }}</span>
    </div>
    <div class="control-group">
      <label>K — seed count</label>
      <input type="range" min="500" max="20000" step="500" v-model.number="K" />
      <span class="control-value">{{ K.toLocaleString() }}</span>
    </div>
    <div class="control-group">
      <label>Color scale</label>
      <select v-model="colorScale">
        <option v-for="s in COLOR_SCALES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <div class="chart-title">Position Heatmap — item i → slot j frequency</div>
      <Heatmap :matrix="heatmapMatrix" :n="N" :k="K" :colorScale="colorScale" />
    </div>
    <div class="chart-card">
      <div class="chart-title">Scatter — where does item 0 land per seed?</div>
      <Scatter :points="scatterPoints" :n="N" :k="K" />
    </div>
  </div>
</template>
