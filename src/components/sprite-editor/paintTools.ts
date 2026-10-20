// The sprite editor's area tools, kept free of React so they can be probed
// from a script. A grid is rows of equal-length strings; a paint is one cell
// character ("." erases, "o" outlines, A–H are colour roles).

export type Cell = { x: number; y: number };

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** Flood fill from (x0, y0): every cell holding the clicked cell's value that
    the fill can reach moving up, down, left or right takes `paint` — an empty
    area inside an outline, or a whole region of one colour to recolour or
    erase.

    One-pixel forgiveness, for an outline with a hole in it: when the plain
    fill would run out to the edge of the canvas, the fill tries again
    treating every one-pixel gap as closed — a cell walled in on two opposite
    sides (left and right, up and down, or either diagonal pair; the canvas
    edge counts as a wall) is painted, but the fill goes no further through
    it. If that keeps the fill off the canvas edge, the hole was a gap and the
    area inside it is what gets filled; if not, the area really is open (the
    background, or a hole two pixels wide) and the plain fill stands. A fill
    that never reaches the edge is always plain, so a shape's narrow corners
    are never cut off. */
export function floodFill(grid: string[], x0: number, y0: number, paint: string): string[] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return grid;
  const target = grid[y0][x0];
  if (target === paint) return grid;

  const same = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && grid[y][x] === target;
  const wall = (x: number, y: number) => !same(x, y);
  const pinched = (x: number, y: number) =>
    (wall(x - 1, y) && wall(x + 1, y)) ||
    (wall(x, y - 1) && wall(x, y + 1)) ||
    (wall(x - 1, y - 1) && wall(x + 1, y + 1)) ||
    (wall(x + 1, y - 1) && wall(x - 1, y + 1));
  const onEdge = (x: number, y: number) => x === 0 || y === 0 || x === w - 1 || y === h - 1;

  /** The cells a fill from the seed reaches; with `closeGaps`, a pinched
      cell (other than the seed) is reached but passes the fill no further.
      `escapes`: a cell that passes the fill on lies on the canvas edge. */
  const reach = (closeGaps: boolean) => {
    const cells: [number, number][] = [];
    const seen = new Set<number>([y0 * w + x0]);
    const stack: [number, number][] = [[x0, y0]];
    let escapes = false;
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      cells.push([x, y]);
      if (closeGaps && !(x === x0 && y === y0) && pinched(x, y)) continue;
      if (onEdge(x, y)) escapes = true;
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!same(nx, ny) || seen.has(ny * w + nx)) continue;
        seen.add(ny * w + nx);
        stack.push([nx, ny]);
      }
    }
    return { cells, escapes };
  };

  let fill = reach(false);
  if (fill.escapes && !pinched(x0, y0)) {
    const closed = reach(true);
    if (!closed.escapes) fill = closed;
  }

  const rows = grid.map((row) => row.split(""));
  for (const [x, y] of fill.cells) rows[y][x] = paint;
  return rows.map((row) => row.join(""));
}

/** Is (x, y) inside the rectangle with corners a and b (inclusive)? */
export function inRect(a: Cell, b: Cell, x: number, y: number): boolean {
  return x >= Math.min(a.x, b.x) && x <= Math.max(a.x, b.x) && y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y);
}

/** Fill the rectangle with corners a and b (inclusive, either order) with `paint`. */
export function fillRect(grid: string[], a: Cell, b: Cell, paint: string): string[] {
  return grid.map((row, y) =>
    row.split("").map((ch, x) => (inRect(a, b, x, y) ? paint : ch)).join("")
  );
}
