import letters from "./letters";

/**
 * Randomly shuffles an array
 *
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Checks if two coordinates are equal
 *
 * @param cord1 [x,y] coordinate pair
 * @param cord2 [x,y] coordinate pair
 * @returns
 */
function isCoordsEq([x1, y1]: [number, number], [x2, y2]: [number, number]) {
  return x1 === x2 && y1 === y2;
}

/**
 * A set of coordinates that allows for adding, removing, and checking if a coordinate exists`
 */
export default class CoordinateSet {
  tree: Record<number, Record<number, boolean>> = {};
  size = 0;

  add(x: number, y: number) {
    if (!this.has(x, y)) {
      this.tree[x] ||= {};
      this.tree[x][y] = true;
      this.size++;
    }
  }

  remove(x: number, y: number) {
    // if the coordinate doesn't exist, don't do anything
    if (!this.tree[x] || !this.tree[x][y]) {
      return;
    }

    // otherwise, delete it
    delete this.tree[x][y];
    this.size--;

    // if the branch has no leaves, delete the branch, too
    if (!Object.keys(this.tree[x]).length) {
      delete this.tree[x];
    }
  }

  has(x: number, y: number) {
    return !!this.tree[x]?.[y];
  }

  getRandomCell() {
    const xKeys = Object.keys(this.tree);
    if (xKeys.length === 0) {
      return null;
    }

    const randomX = xKeys[Math.floor(Math.random() * xKeys.length)];
    const yKeys = Object.keys(this.tree[parseInt(randomX)]);
    const randomY = yKeys[Math.floor(Math.random() * yKeys.length)];

    return [parseInt(randomX), parseInt(randomY)];
  }
}

const CHAR_SPACING = 2;
const LEFT_RIGHT_MARGIN = 5;
const TOP_BOTTOM_MARGIN = 5;

/**
 * Generates a maze using Randomized Prim's Algorithm. If a text is provided, the maze will be generated with that text as the solution
 *
 * @param width - Width of the maze. If text is provided, this will be treated as the minimum width. Note that the width of the maze or text must be provided
 * @param height - Height of the maze. If text is provided, this will be treated as the minimum height. Note that the height of the maze or text must be provided
 * @param text - Text to include as solution to the maze. If provided, the maze will be generated with the text as the solution
 * @param multiline - Whether the text is multi-line or not. If true, we will split when text would be greater than width
 * @returns
 */
export function createMaze(
  width?: number,
  height?: number,
  text?: string,
  multiline?: boolean
): {
  passages: { [key: string]: [number, number][] };
  letterPoints: [number, number][];
  extraPathPoints: [number, number][];
  width: number;
  height: number;
} {
  if ((!width || !height) && (!text || text.length === 0)) {
    throw new Error("Width and height or text must be provided");
  }

  let mazeWidth = width || 0,
    mazeHeight = height || 0;

  let textWidth = 0,
    textHeight = 0;

  let wordWidths = [0];
  let wordHeights = [0];

  if (text && text.length > 0) {
    let wordIndex = 0;

    // Calculate the width and height of all words
    for (const c of text) {
      const letter = letters[c];

      wordWidths[wordIndex] += letter.width + CHAR_SPACING;
      wordHeights[wordIndex] = Math.max(wordHeights[wordIndex], letter.height);

      if (multiline && c == " ") {
        wordWidths[wordIndex] -= letter.width + CHAR_SPACING; // Don't include the space

        wordWidths.push(0);
        wordHeights.push(0);
        wordIndex++;
      }
    }

    textWidth = Math.max(...wordWidths);

    // @TODO - This assumes each word always has it's own line
    textHeight = wordHeights.reduce((a, b) => a + b + CHAR_SPACING, 0); // Calculate the total height taken up by the text

    mazeWidth = Math.max(mazeWidth, textWidth);
    mazeHeight = Math.max(mazeHeight, textHeight);

    if (mazeWidth - textWidth < LEFT_RIGHT_MARGIN * 2) {
      mazeWidth += LEFT_RIGHT_MARGIN * 2 - (mazeWidth - textWidth);
    }

    if (mazeHeight - textHeight < TOP_BOTTOM_MARGIN * 2) {
      mazeHeight += TOP_BOTTOM_MARGIN * 2 - (mazeHeight - textHeight);
    }
  }

  // Create a 2D array of 0s with the given width and height
  const grid = Array.from(Array(mazeHeight), (_) => Array(mazeWidth).fill(0));

  // Store the passages between cells
  const passages: { [key: string]: [number, number][] } = {};

  // Set of all cells to be visited next
  const frontier = new CoordinateSet();

  // Store the letter points
  let letterPoints: [number, number][] = [];

  // Store the extra path points
  let extraPathPoints: [number, number][] = [];

  /**
   * Returns adjacent cells to the given cell that are in / out of the maze
   *
   * @param x x coordinate of the cell
   * @param y y coordinate of the cell
   * @param in_maze Whether adjacent cells should be in the maze or not
   * @param directions Which directions to return adjacent cells for
   */
  const get_adjacent_cells = (
    x: number,
    y: number,
    in_maze: boolean | undefined,
    directions = { left: true, right: true, up: true, down: true }
  ): [number, number][] => {
    const adjacent_cells: [number, number][] = [];

    if (directions.left && x > 0) {
      adjacent_cells.push([x - 1, y]);
    }
    if (directions.right && x < mazeWidth - 1) {
      adjacent_cells.push([x + 1, y]);
    }
    if (directions.up && y > 0) {
      adjacent_cells.push([x, y - 1]);
    }
    if (directions.down && y < mazeHeight - 1) {
      adjacent_cells.push([x, y + 1]);
    }

    if (in_maze != undefined) {
      return adjacent_cells.filter(([x, y]) => {
        return in_maze ? grid[y][x] : !grid[y][x];
      });
    }

    return adjacent_cells;
  };

  /**
   * Returns the frontier of a cell (x,y) i.e. all adjacent cells that are not in the maze
   *
   * @param x x coordinate of the cell
   * @param y y coordinate of the cell
   * @param directions Which directions to return adjacent cells for
   * @returns
   */
  const get_frontier_cells = (
    x: number,
    y: number,
    directions = { left: true, right: true, up: true, down: true }
  ) => {
    return get_adjacent_cells(x, y, false, directions);
  };

  /**
   * Returns the neighbours of a cell (x,y) i.e. all adjacent cells that are in the maze
   *
   * @param x x coordinate of the cell
   * @param y y coordinate of the cell
   * @param directions Which directions to return adjacent cells for
   * @returns
   */
  const get_neighbour_cells = (
    x: number,
    y: number,
    directions = { left: true, right: true, up: true, down: true }
  ) => {
    return get_adjacent_cells(x, y, true, directions);
  };

  /**
   * Adds a passage between two cells
   *
   * @param cell1 First cell
   * @param cell2 Second cell
   */
  const add_passage = (cell1: [number, number], cell2: [number, number]) => {
    if (passages[`${cell1[0]},${cell1[1]}`] == undefined) {
      passages[`${cell1[0]},${cell1[1]}`] = [];
    }

    if (passages[`${cell2[0]},${cell2[1]}`] == undefined) {
      passages[`${cell2[0]},${cell2[1]}`] = [];
    }

    passages[`${cell1[0]},${cell1[1]}`].push(cell2);
    passages[`${cell2[0]},${cell2[1]}`].push(cell1);
  };

  /**
   * Given a list of cells we add each cell to the maze and add a passage between adjacent cells
   *
   * @param cells List of cells to add to the maze
   */
  const allocate_path_from_points = (points: [number, number][]) => {
    points.forEach(([x, y], index) => {
      grid[y][x] = 1;

      if (index < points.length - 1) {
        const [x2, y2] = points[index + 1];

        add_passage([x, y], [x2, y2]);
      }

      // Add adjacent cells to the frontier
      get_frontier_cells(x, y).forEach((cell) => {
        frontier.add(...cell);
      });

      // Remove cell from frontier if present
      frontier.remove(x, y);
    });
  };

  /**
   * Finds the shortest path between two cells compromised of cells not currently in the maze
   *
   * @param start The starting cell
   * @param end The ending cell
   * @param can_move_back Whether we can move back in the x-direction. Defaults to false to avoid interference with later connections on the same line
   *                      If it is true we still don't want to interfere, so we only move down if we've left where the text should start.
   */
  const find_empty_path = (
    start: [number, number],
    end: [number, number],
    can_move_back = false,
    lower_right_y?: number
  ) => {
    const stack = [start];
    const visited = new CoordinateSet();
    visited.add(...start);

    const parents: {
      [key: number]: { [key: number]: [number, number] | null };
    } = {};
    parents[start[0]] = {};
    parents[start[0]][start[1]] = null;

    while (stack.length > 0) {
      const cell = stack.shift();

      if (cell == undefined) {
        return undefined;
      }

      if (isCoordsEq(cell, end)) {
        const path = [end];
        let parent = parents[end[0]][end[1]];

        while (parent != null) {
          path.push(parent);
          parent = parents[parent[0]][parent[1]];
        }

        return path.reverse();
      }

      // If cell is already in the maze, continue
      if (!isCoordsEq(cell, start) && grid[cell[1]][cell[0]]) {
        continue;
      }

      // We never want to move back (or else it interferes with later connections) unless we are moving to a new line
      // i.e. since the cell we're considering is in front of the end position, we'd then have to move back to get to the end
      if (cell[0] > end[0] && !can_move_back) {
        continue;
      }

      // If we are moving back, we don't want to move through the text
      if (can_move_back && cell[0] > end[0] && lower_right_y != undefined) {
        if (cell[1] > lower_right_y + CHAR_SPACING) {
          continue;
        }
      }

      // End point can be in the maze so we need to get all neighbours
      const all_neighbours = get_adjacent_cells(cell[0], cell[1], undefined);

      shuffleArray(all_neighbours).forEach((neighbour: [number, number]) => {
        if (!visited.has(...neighbour)) {
          stack.push(neighbour);
          visited.add(...neighbour);
          parents[neighbour[0]] ||= {};

          parents[neighbour[0]][neighbour[1]] = cell;
        }
      });
    }
  };

  /**
   * Finds a windy path between start and end such that the path is composed of cells not
   * currently in the maze and we never go further in the x-direction than the end point
   *
   * @param start The starting cell
   * @param end The ending cell
   */
  const find_windy_path = (start: [number, number], end: [number, number]) => {
    const stack = [start];
    const visited = new CoordinateSet();
    visited.add(...start);

    const parents: {
      [key: number]: { [key: number]: [number, number] | null };
    } = {};
    parents[start[0]] = {};
    parents[start[0]][start[1]] = null;

    while (stack.length > 0) {
      const cell = stack.pop();

      if (cell == undefined) {
        return undefined;
      }

      if (isCoordsEq(cell, end)) {
        const path = [end];
        let parent = parents[end[0]][end[1]];

        while (parent != null) {
          path.push(parent);
          parent = parents[parent[0]][parent[1]];
        }

        return path.reverse();
      }

      // If cell is already in the maze, continue
      if (!isCoordsEq(cell, start) && grid[cell[1]][cell[0]]) {
        continue;
      }

      // If the current point is further away in x direction than the end point then we want to ignore it
      if (Math.abs(cell[0] - start[0]) > Math.abs(end[0] - start[0])) {
        continue;
      }

      // End point can be in the maze so we need to get all neighbours
      const all_neighbours = get_adjacent_cells(cell[0], cell[1], undefined);

      shuffleArray(all_neighbours).forEach((neighbour: [number, number]) => {
        if (!visited.has(...neighbour)) {
          stack.push(neighbour);
          visited.add(...neighbour);
          parents[neighbour[0]] ||= {};

          parents[neighbour[0]][neighbour[1]] = cell;
        }
      });
    }
  };

  /**
   *  Add a preset solution to the maze
        1. First we allocate paths for all the letters
        2. Then we connect the indivdual letters
        3. Then we connect start point with the start of the first letter
        4. Finally we connect the end of the last letter with the end point
   * @param solution String representing the solution
   */
  const add_preset_solution = (solution: string) => {
    // Want to align text to be in the center
    const inital_offset = [
      Math.floor((mazeWidth - wordWidths[0]) / 2),
      Math.floor((mazeHeight - textHeight) / 2),
    ];

    let letter_offset = inital_offset;

    // Store the previous ending point
    let previous_ending_point;
    let previous_offset_height;

    let word_index = 0;
    for (const c of solution) {
      if (multiline && c == " ") {
        word_index++;
        /**
         * Check if we need to move to the next line
         **/
        if (
          letter_offset[0] +
            letters[c].width +
            CHAR_SPACING +
            wordWidths[word_index] >
          mazeWidth - LEFT_RIGHT_MARGIN
        ) {
          console.log("Moving to the next line");
          letter_offset = [
            Math.floor((mazeWidth - wordWidths[word_index]) / 2),
            letter_offset[1] + wordHeights[word_index - 1] + CHAR_SPACING,
          ];
          continue; // moving to the next line so we don't need this space
        }
      }

      const points = letters[c].path.map(([x, y]): [number, number] => {
        return [x + letter_offset[0], y + letter_offset[1]];
      });

      allocate_path_from_points(points);

      if (c != " ") {
        letterPoints = letterPoints.concat(points);
      }

      // Connect the start of the this character with the end of the previous
      if (previous_ending_point != undefined) {
        const path = find_empty_path(
          previous_ending_point,
          points[0],
          letter_offset[1] != previous_offset_height,
          letter_offset[1] + wordHeights[word_index]
        );

        if (path != undefined) {
          allocate_path_from_points(path);
          extraPathPoints = extraPathPoints.concat(path);
        } else {
          console.log({ previous_ending_point, new: points[0] });
          console.error(
            "No path from previous ending point to start of letter for ",
            c
          );
        }
      }

      // Store the ending point
      previous_ending_point = points[points.length - 1];
      previous_offset_height = letter_offset[1];

      // Update the offset
      letter_offset = [
        letter_offset[0] + letters[c].width + CHAR_SPACING,
        letter_offset[1],
      ];
    }

    // Connect the start of the first character with the start of the maze
    const start: [number, number] = [
      inital_offset[0] + letters[solution[0]]["path"][0][0],
      inital_offset[1] + letters[solution[0]]["path"][0][1],
    ];

    let connecting_path = find_windy_path([0, 0], start);

    if (connecting_path != undefined) {
      allocate_path_from_points(connecting_path);
      extraPathPoints = extraPathPoints.concat(connecting_path);
    } else {
      console.error("No windy path from start to first letter");
    }

    if (!previous_ending_point) {
      throw new Error("No previous ending point");
    }

    connecting_path = find_windy_path(
      [mazeWidth - 1, mazeHeight - 1],
      previous_ending_point
    );

    if (connecting_path != undefined) {
      allocate_path_from_points(connecting_path);
      extraPathPoints = extraPathPoints.concat(connecting_path);
    }
  };

  /**
   * Generate a maze using Randomized Prim's Algorithm
   */
  const generate = () => {
    // If we've already added the preset solutuon we don't need to pick a random start point
    if (frontier.size == 0) {
      const [x, y] = [
        Math.floor(Math.random() * mazeWidth),
        Math.floor(Math.random() * mazeHeight),
      ];

      // Mark it as part of the maze
      grid[y][x] = 1;

      // Add adjacent cells to the frontier
      get_frontier_cells(x, y).forEach((cell) => {
        frontier.add(...cell);
      });
    }

    // While there are walls in the frontier
    while (frontier.size > 0) {
      // Pick a random wall
      const [x, y] = frontier.getRandomCell()!;

      // Remove it from the frontier
      frontier.remove(x, y);

      // Get all neighbours
      const neighbours = get_neighbour_cells(x, y);

      // Connect the cell with a random neighbour
      const [nx, ny] =
        neighbours[Math.floor(Math.random() * neighbours.length)];

      grid[y][x] = 1;

      add_passage([x, y], [nx, ny]);

      // Add adjacent cells to the frontier
      get_frontier_cells(x, y).forEach((cell) => {
        frontier.add(...cell);
      });
    }
  };

  // Generate the maze
  if (text && text.length > 0) {
    add_preset_solution(text);
  }

  generate();

  return {
    passages,
    letterPoints,
    extraPathPoints,
    width: mazeWidth,
    height: mazeHeight,
  };
}
