import { SVG, Svg } from "@svgdotjs/svg.js";

export function drawMaze(
  passages: { [key: string]: [number, number][] },
  width: number,
  height: number,
  letters: [number, number][],
  extraPathPoints: [number, number][],
  cell_size = 20,
  wall_thickness = 1
): Svg {
  const draw = SVG();

  // Calculate the total size of the SVG content
  const totalWidth = width * cell_size + wall_thickness;
  const totalHeight = height * cell_size + wall_thickness;

  // Set the viewBox to enable scaling
  draw.viewbox(0, 0, totalWidth, totalHeight);

  const shouldDrawWall = (cell1: [number, number], cell2: [number, number]) => {
    if (passages[`${cell1[0]},${cell1[1]}`]) {
      if (
        passages[`${cell1[0]},${cell1[1]}`].some((passage) =>
          cell2.every((c, i) => c === passage[i])
        )
      ) {
        return false;
      }
    }

    if (passages[`${cell2[0]},${cell2[1]}`]) {
      if (
        passages[`${cell2[0]},${cell2[1]}`].some((passage) =>
          cell1.every((c, i) => c === passage[i])
        )
      ) {
        return false;
      }
    }

    return true;
  };

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      // Check if we should draw the top wall
      if (shouldDrawWall([i, j], [i, j - 1])) {
        draw
          .rect(cell_size + wall_thickness, wall_thickness)
          .move(i * cell_size, j * cell_size)
          .fill("black");
      }

      // Check if we should draw the left wall
      if (shouldDrawWall([i, j], [i - 1, j])) {
        draw
          .rect(wall_thickness, cell_size + wall_thickness)
          .move(i * cell_size, j * cell_size)
          .fill("black");
      }

      // If at the edge draw a wall
      if (i === width - 1) {
        draw
          .rect(wall_thickness, cell_size + wall_thickness)
          .move((i + 1) * cell_size, j * cell_size)
          .fill("black");
      }

      if (j === height - 1) {
        draw
          .rect(cell_size + wall_thickness, wall_thickness)
          .move(i * cell_size, (j + 1) * cell_size)
          .fill("black");
      }
    }
  }

  if (extraPathPoints.length > 0) {
    let endPoint = [cell_size / 2, cell_size / 2];

    extraPathPoints.forEach(([x, y]) => {
      // Make sure this point is beside the previous point
      let xPoint = x * cell_size + cell_size / 2;
      let yPoint = y * cell_size + cell_size / 2;

      if (
        Math.abs(xPoint - endPoint[0]) > cell_size ||
        Math.abs(yPoint - endPoint[1]) > cell_size
      ) {
        endPoint = [xPoint, yPoint];
      }

      if (
        shouldDrawWall(
          [x, y],
          [
            (endPoint[0] - cell_size / 2) / cell_size,
            (endPoint[1] - cell_size / 2) / cell_size,
          ]
        )
      ) {
        endPoint = [xPoint, yPoint];
      }

      draw
        .line(endPoint[0], endPoint[1], xPoint, yPoint)
        .stroke({ color: "green", width: 4 });

      endPoint = [xPoint, yPoint];
    });
  }

  if (letters.length > 0) {
    let endPoint = [cell_size / 2, cell_size / 2];

    letters.forEach(([x, y]) => {
      // Make sure this point is beside the previous point
      let xPoint = x * cell_size + cell_size / 2;
      let yPoint = y * cell_size + cell_size / 2;

      if (
        Math.abs(xPoint - endPoint[0]) > cell_size ||
        Math.abs(yPoint - endPoint[1]) > cell_size
      ) {
        endPoint = [xPoint, yPoint];
      }

      draw
        .line(endPoint[0], endPoint[1], xPoint, yPoint)
        .stroke({ color: "red", width: 4 });

      endPoint = [xPoint, yPoint];
    });
  }

  return draw;
}
