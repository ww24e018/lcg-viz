<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  matrix: number[][]
  n: number
  k: number
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const containerWidth = ref(520)

const COLOR_SCALES = ['YlGnBu', 'Viridis', 'Plasma', 'Inferno', 'Magma', 'Warm', 'Cool', 'RdYlGn']
const colorScale = ref('YlGnBu')

const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 }
const MIN_CELL = 4

const INTERPOLATORS: Record<string, (t: number) => string> = {
  YlGnBu:  d3.interpolateYlGnBu,
  Viridis: d3.interpolateViridis,
  Plasma:  d3.interpolatePlasma,
  Inferno: d3.interpolateInferno,
  Magma:   d3.interpolateMagma,
  Warm:    d3.interpolateWarm,
  Cool:    d3.interpolateCool,
  RdYlGn:  d3.interpolateRdYlGn,
}

const legendValues = computed(() => {
  const flat = props.matrix.flat()
  if (!flat.length) return null
  const sorted = [...flat].sort((a, b) => a - b)
  return {
    min:    sorted[0]!,
    avg:    props.k / props.n,
    median: d3.median(sorted) ?? 0,
    max:    sorted[sorted.length - 1]!,
  }
})

const legendItems = computed(() => {
  const v = legendValues.value
  if (!v) return []
  return [
    { label: 'min', value: v.min },
    { label: 'avg', value: v.avg },
    { label: 'med', value: v.median },
    { label: 'max', value: v.max },
  ]
})

const colorFn = computed(() => {
  const v = legendValues.value
  if (!v) return null
  const interp = INTERPOLATORS[colorScale.value] ?? d3.interpolateYlGnBu
  return d3.scaleSequential(interp).domain([v.min, v.max])
})

function formatLegendValue(item: { label: string; value: number }): string {
  return item.label === 'avg' ? item.value.toFixed(1) : String(Math.round(item.value))
}

function render() {
  const svg = d3.select(svgRef.value)
  if (!svgRef.value || props.matrix.length === 0 || !colorFn.value) return

  const n = props.n
  const color = colorFn.value
  const available = containerWidth.value - MARGIN.left - MARGIN.right
  const cellSize = Math.max(MIN_CELL, Math.floor(available / n))
  const size = cellSize * n
  const totalW = size + MARGIN.left + MARGIN.right
  const totalH = size + MARGIN.top + MARGIN.bottom

  svg.attr('width', totalW).attr('height', totalH)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const tooltip = d3.select(tooltipRef.value)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const count = props.matrix[i]?.[j] ?? 0
      g.append('rect')
        .attr('x', j * cellSize)
        .attr('y', i * cellSize)
        .attr('width', cellSize - 1)
        .attr('height', cellSize - 1)
        .attr('fill', color(count))
        .on('mousemove', (event: MouseEvent) => {
          tooltip
            .text(`item ${i} → slot ${j}: ${count}×`)
            .classed('visible', true)
            .style('left', `${event.clientX + 14}px`)
            .style('top', `${event.clientY - 28}px`)
        })
        .on('mouseleave', () => {
          tooltip.classed('visible', false)
        })
    }
  }
}

let ro: ResizeObserver | null = null

onMounted(() => {
  render()
  if (containerRef.value) {
    ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w !== undefined && Math.abs(w - containerWidth.value) > 1) {
        containerWidth.value = w
      }
    })
    ro.observe(containerRef.value)
  }
})

onUnmounted(() => ro?.disconnect())

watch(
  () => [props.matrix, props.n, props.k, colorScale.value, containerWidth.value],
  render,
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="heatmap-container">
    <div class="heatmap-controls">
      <select v-model="colorScale" class="heatmap-scale-select">
        <option v-for="s in COLOR_SCALES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
    <svg ref="svgRef" />
    <div ref="tooltipRef" class="tooltip" />
    <div class="heatmap-legend" v-if="legendValues && colorFn">
      <div class="legend-item" v-for="item in legendItems" :key="item.label">
        <span class="legend-swatch" :style="{ background: colorFn(item.value) }"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ formatLegendValue(item) }}</span>
      </div>
    </div>
  </div>
</template>
