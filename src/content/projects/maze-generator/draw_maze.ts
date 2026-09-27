const WALL = "#1e1b16";
const SOLUTION = "#e8590c";
const PATH = "#c9c0ae";

type Cell = [number, number];

/**
 * Draws a maze as an SVG string.
 *
 * Walls are merged into straight runs and drawn as a single <path>, which
 * keeps the SVG small and fast to render compared with one element per wall.
 * The outer wall has a gap at the top-left (entrance) and bottom-right (exit),
 * where the solution starts and ends.
 */
export function drawMaze(
  passages: { [key: string]: [number, number][] },
  width: number,
  height: number,
  letters: Cell[],
  extraPathPoints: Cell[],
  cell_size = 20,
  wall_thickness = 1
): string {
  const totalWidth = width * cell_size + wall_thickness;
  const totalHeight = height * cell_size + wall_thickness;

  // Passages as two flat grids: is cell (x, y) open to its right / below?
  const openRight = new Uint8Array(width * height);
  const openDown = new Uint8Array(width * height);
  for (const [from, tos] of Object.entries(passages)) {
    const [fx, fy] = from.split(",").map(Number);
    for (const [x, y] of tos) {
      if (y === fy && Math.abs(x - fx) === 1) openRight[fy * width + Math.min(x, fx)] = 1;
      if (x === fx && Math.abs(y - fy) === 1) openDown[Math.min(y, fy) * width + fx] = 1;
    }
  }
  const shouldDrawWall = ([ax, ay]: Cell, [bx, by]: Cell) => {
    if (ay === by && Math.abs(ax - bx) === 1) return !openRight[ay * width + Math.min(ax, bx)];
    if (ax === bx && Math.abs(ay - by) === 1) return !openDown[Math.min(ay, by) * width + ax];
    return true; // not neighbours
  };

  // Wall lines sit on the pixel grid; offset by half the thickness so a
  // 1-unit stroke covers the same pixels as the old 1-unit rects.
  const o = wall_thickness / 2;
  const walls: string[] = [];

  // Horizontal walls: the line above row j, for j = 0..height.
  for (let j = 0; j <= height; j++) {
    let runStart = -1;
    for (let i = 0; i <= width; i++) {
      const wall =
        i < width && (j === 0 || j === height || shouldDrawWall([i, j - 1], [i, j]));
      if (wall && runStart < 0) runStart = i;
      if (!wall && runStart >= 0) {
        walls.push(`M${runStart * cell_size} ${j * cell_size + o}H${i * cell_size + wall_thickness}`);
        runStart = -1;
      }
    }
  }

  // Vertical walls: the line left of column i, for i = 0..width.
  for (let i = 0; i <= width; i++) {
    let runStart = -1;
    for (let j = 0; j <= height; j++) {
      const entrance = i === 0 && j === 0;
      const exit = i === width && j === height - 1;
      const wall =
        j < height &&
        !entrance &&
        !exit &&
        (i === 0 || i === width || shouldDrawWall([i - 1, j], [i, j]));
      if (wall && runStart < 0) runStart = j;
      if (!wall && runStart >= 0) {
        walls.push(`M${i * cell_size + o} ${runStart * cell_size}V${j * cell_size + wall_thickness}`);
        runStart = -1;
      }
    }
  }

  const centre = ([x, y]: Cell) => [x * cell_size + cell_size / 2, y * cell_size + cell_size / 2];
  const cellOf = ([px, py]: number[]): Cell => [
    (px - cell_size / 2) / cell_size,
    (py - cell_size / 2) / cell_size,
  ];

  // A polyline through the points, lifting the pen wherever consecutive
  // points aren't neighbours (and, if asked, wherever a wall is in the way).
  const trace = (points: Cell[], respectWalls: boolean) => {
    let d = "";
    let end = [cell_size / 2, cell_size / 2];
    for (const point of points) {
      const p = centre(point);
      let lift = Math.abs(p[0] - end[0]) > cell_size || Math.abs(p[1] - end[1]) > cell_size;
      if (!lift && respectWalls && shouldDrawWall(point, cellOf(end))) lift = true;
      d += lift || d === "" ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`;
      end = p;
    }
    return d;
  };

  const solution =
    extraPathPoints.length + letters.length > 0
      ? `<path d="${trace(extraPathPoints, true)}" fill="none" stroke="${PATH}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${trace(letters, false)}" fill="none" stroke="${SOLUTION}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
      : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">` +
    `<path d="${walls.join("")}" fill="none" stroke="${WALL}" stroke-width="${wall_thickness}"/>` +
    solution +
    `</svg>`
  );
}
