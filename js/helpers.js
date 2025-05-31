export function plotLine(x0, y0, x1, y1, drawMethod, bounds) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    if (x0 >= 0 && x0 < bounds.width && y0 >= 0 && y0 < bounds.height) {
      drawMethod(x0, y0);
    }

    const e2 = 2 * error;
    if (e2 >= dy) {
      if (x0 === x1) break;
      error += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      if (y0 === y1) break;
      error += dx;
      y0 += sy;
    }
  }
}

export function deepCopy2DArray(arr) {
  return arr.map(row => [...row]);
}

export function saveState(grid, history, index) {
  history = history.slice(0, index + 1);
  history.push(deepCopy2DArray(grid));
  return [history, index + 1];
}
