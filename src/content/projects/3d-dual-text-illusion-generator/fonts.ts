import "./opentype-shim";
import { parse, type Font } from "opentype.js";

/** Font size handed to opentype, in its "px" units. */
export const FONT_SIZE = 15;

/** jscad-text converts opentype px to model units (mm) by this factor. */
export const PX_TO_MM = 0.2822222;

// Hinting snaps outlines to a screen's pixel grid, which at our small "px"
// size distorts curves and stroke widths; a 3D model wants the true outline.
export const PATH_OPTIONS = {
  kerning: true,
  hinting: false,
  features: { liga: false, rlig: false },
};

const fontCache = new Map<string, Promise<Font>>();

export const loadFont = (fontUrl: string): Promise<Font> => {
  let font = fontCache.get(fontUrl);
  if (!font) {
    font = fetch(fontUrl)
      .then((response) => response.arrayBuffer())
      .then((data) => parse(data));
    fontCache.set(fontUrl, font);
  }
  return font;
};

export type PlacedLetter = {
  char: string;
  /** Where this letter starts along the word, in opentype px. */
  x: number;
};

/** Each letter of `word` with its kerned position in the word. */
export const layoutWord = (font: Font, word: string): PlacedLetter[] => {
  const chars = Array.from(word);
  const xs: number[] = [];
  font.forEachGlyph(word, 0, 0, FONT_SIZE, PATH_OPTIONS, (_glyph, x) => {
    xs.push(x);
  });
  // One glyph per character unless the font composes sequences; fall back to
  // plain advances if that ever happens.
  if (xs.length !== chars.length) {
    let x = 0;
    return chars.map((char) => {
      const placed = { char, x };
      x += font.getAdvanceWidth(char, FONT_SIZE, PATH_OPTIONS);
      return placed;
    });
  }
  return chars.map((char, i) => ({ char, x: xs[i] }));
};

/** Length of the word along its baseline, in model units. */
export const wordLength = (font: Font, word: string) =>
  font.getAdvanceWidth(word, FONT_SIZE, PATH_OPTIONS) * PX_TO_MM;

/** Both words are cut to the shorter one's length. */
export const matchLengths = (a: string, b: string): [string, string] => {
  const n = Math.min(Array.from(a).length, Array.from(b).length);
  return [Array.from(a).slice(0, n).join(""), Array.from(b).slice(0, n).join("")];
};
