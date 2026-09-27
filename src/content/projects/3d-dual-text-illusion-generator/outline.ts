import type { Font } from "opentype.js";
import { FONT_SIZE, PATH_OPTIONS, PX_TO_MM } from "./fonts";

type Vec2 = [number, number];

/** Straight segments per curve. Letters are a few mm tall, so this is plenty. */
const CURVE_STEPS = 8;

/**
 * A letter's outline as closed polygons in model units, placed at `x` (in
 * opentype px) along the word. Coordinates match jscad-text: x scaled to mm
 * and y flipped so the letter stands upright.
 *
 * Outer contours and holes wind in opposite directions, but which way round
 * depends on the font (TrueType vs CFF), so consumers should use a non-zero
 * fill rule rather than assume an orientation.
 */
export function letterContours(font: Font, char: string, x: number): Vec2[][] {
  const path = font.getPath(char, x, 0, FONT_SIZE, PATH_OPTIONS);
  const toModel = (px: number, py: number): Vec2 => [px * PX_TO_MM, -py * PX_TO_MM];

  const contours: Vec2[][] = [];
  let current: Vec2[] = [];
  let cx = 0;
  let cy = 0;

  const close = () => {
    // Drop a repeated closing point; polygons are implicitly closed.
    if (current.length > 1) {
      const [fx, fy] = current[0];
      const [lx, ly] = current[current.length - 1];
      if (Math.abs(fx - lx) < 1e-9 && Math.abs(fy - ly) < 1e-9) current.pop();
    }
    if (current.length >= 3) contours.push(current);
    current = [];
  };

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case "M":
        close();
        cx = cmd.x;
        cy = cmd.y;
        current.push(toModel(cx, cy));
        break;
      case "L":
        cx = cmd.x;
        cy = cmd.y;
        current.push(toModel(cx, cy));
        break;
      case "Q":
        for (let i = 1; i <= CURVE_STEPS; i++) {
          const t = i / CURVE_STEPS;
          const u = 1 - t;
          current.push(
            toModel(
              u * u * cx + 2 * u * t * cmd.x1 + t * t * cmd.x,
              u * u * cy + 2 * u * t * cmd.y1 + t * t * cmd.y
            )
          );
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
      case "C":
        for (let i = 1; i <= CURVE_STEPS; i++) {
          const t = i / CURVE_STEPS;
          const u = 1 - t;
          current.push(
            toModel(
              u * u * u * cx + 3 * u * u * t * cmd.x1 + 3 * u * t * t * cmd.x2 + t * t * t * cmd.x,
              u * u * u * cy + 3 * u * u * t * cmd.y1 + 3 * u * t * t * cmd.y2 + t * t * t * cmd.y
            )
          );
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
      case "Z":
        close();
        break;
    }
  }
  close();

  return contours;
}
