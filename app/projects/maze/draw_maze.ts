import { SVG } from "@svgdotjs/svg.js";

export function drawMaze(
  passages: { [key: string]: [number, number][] },
  width: number,
  height: number,
  container: HTMLDivElement,
  letters: [number, number][],
  extraPathPoints: [number, number][],
  cell_size = 20,
  wall_thickness = 1
) {
  const draw = SVG().addTo(container);
  draw.size(
    width * cell_size + wall_thickness,
    height * cell_size + wall_thickness
  );

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
    extraPathPoints.forEach(([x, y]) => {
      draw
        .rect(cell_size / 2, cell_size / 2)
        .move(x * cell_size + cell_size / 4, y * cell_size + cell_size / 4)
        .fill("green");
    });
  }

  if (letters.length > 0) {
    letters.forEach(([x, y]) => {
      draw
        .rect(cell_size / 2, cell_size / 2)
        .move(x * cell_size + cell_size / 4, y * cell_size + cell_size / 4)
        .fill("red");
    });
  }
}
