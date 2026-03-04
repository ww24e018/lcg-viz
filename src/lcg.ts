export function minuteSeed(): number {
  const now = new Date()
  return (
    now.getFullYear() * 1000000 +
    (now.getMonth() + 1) * 10000 +
    now.getDate() * 100 +
    now.getHours() * 100 +
    now.getMinutes()
  )
}

function lcg(s: number): number {
  return (s * 1664525 + 1013904223) & 0xffffffff
}

export function* lcgIterator(seed: number): Generator<number, never, unknown> {
  let s: number = lcg(seed)
  while (true) {
    yield s
    s = lcg(s)
  }
}

export function seededShuffle<T>(arr: T[], seed: number, shift = 0): T[] {
  const a = [...arr]
  const lcgSeries = lcgIterator(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const s = lcgSeries.next().value
    const j = (s >>> shift) % (i + 1)
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}
