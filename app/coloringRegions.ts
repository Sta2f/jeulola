// Label enclosed areas once from the original line art. Paint never changes boundaries.
export function buildRegions(data: Uint8ClampedArray, width: number, height: number) {
  const labels = new Uint32Array(width * height);
  const queue = new Uint32Array(width * height);
  let region = 0;
  const isPaper = (p: number) => (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2]) / 3 > 155;
  for (let p = 0; p < labels.length; p++) {
    if (labels[p] || !isPaper(p)) continue;
    region++;
    let head = 0, tail = 1;
    queue[0] = p; labels[p] = region;
    const add = (n: number) => {
      if (n < 0 || n >= labels.length || labels[n] || !isPaper(n)) return;
      labels[n] = region; queue[tail++] = n;
    };
    while (head < tail) {
      const n = queue[head++], x = n % width;
      if (x > 0) add(n - 1);
      if (x < width - 1) add(n + 1);
      add(n - width); add(n + width);
    }
  }
  return labels;
}
