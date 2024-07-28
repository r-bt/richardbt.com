import { extrudeText } from "jscad-text";
import { parse } from "opentype.js";
import { booleans, transforms, measurements } from "@jscad/modeling";
import { cuboid, roundedRectangle } from "@jscad/modeling/src/primitives";
import { union } from "@jscad/modeling/src/operations/booleans";
import { extrudeLinear } from "@jscad/modeling/src/operations/extrusions";
const { intersect, scission } = booleans;
const { translate, rotate, scale } = transforms;
const { measureCenter, measureVolume, measureBoundingBox } = measurements;

const API_KEY = " AIzaSyDiGWO-DxfggkNUnIEkJ6hgsq8KLFuEIgY";
const API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}`;

// Needed to fix bug with opentype.js
globalThis.exports = {};

export const getFonts = async () => {
  const response = await fetch(API_URL);
  const fontList = await response.json();

  return fontList;
};

const getFont = async (fontUrl: string) => {
  const response = await fetch(fontUrl);
  const fontData = await response.arrayBuffer();

  // convert the data received to FONT information
  const font = parse(fontData);

  return font;
};

export const generateIllusion = async (
  fontUrl: string,
  firstWord: string,
  secondWord: string,
  padding: number,
  fillet: number
) => {
  /**
   * Make both strings smallest length
   */

  if (firstWord.length > secondWord.length) {
    firstWord = firstWord.slice(0, secondWord.length);
  } else if (secondWord.length > firstWord.length) {
    secondWord = secondWord.slice(0, firstWord.length);
  }

  const font = await getFont(fontUrl);

  let firstWordExtruded = rotate(
    [0, 0, 0],
    translate(
      [(Math.PI * 2) / 4, 0, 0],
      extrudeText({ font: font, fontSize: 15 }, firstWord, 20)
    )
  );

  let secondWordExtruded = rotate(
    [(Math.PI * 2) / 4, (Math.PI * 2) / 4, (Math.PI * 2) / 4],
    translate(
      [-20, 0, 0],
      extrudeText({ font: font, fontSize: 15 }, secondWord, 20)
    )
  );

  let intersection = intersect(firstWordExtruded, secondWordExtruded);

  const center = measureCenter(intersection);

  intersection = translate([-center[0], -center[1], -center[2]], intersection);

  let pieces = scission(intersection);

  /**
   * Only keep the largest pieces
   */
  const expectedPieces = Math.pow(firstWord.length, 2);

  // @ts-ignore
  if (Math.sqrt(pieces.length) !== expectedPieces) {
    // @ts-ignore
    pieces.sort((a, b) => {
      return measureVolume(b) - measureVolume(a);
    });

    // @ts-ignore
    pieces = pieces.slice(0, expectedPieces);
  }

  /**
   * Sort pieces left to right, bottom to top
   */
  // @ts-ignore
  pieces.sort((a, b) => {
    const aCenter = measureCenter(a);
    const bCenter = measureCenter(b);

    const aX = parseFloat(aCenter[0].toFixed(2));
    const bX = parseFloat(bCenter[0].toFixed(2));

    const aZ = parseFloat(aCenter[2].toFixed(2));
    const bZ = parseFloat(bCenter[2].toFixed(2));

    if (aX - bX == 0) {
      return bZ - aZ;
    }

    return aX - bX;
  });

  /**
   * Filter pieces to only have diagonal
   */
  // @ts-ignore
  let increment = Math.floor(Math.sqrt(pieces.length)) + 1;

  // Filter pieces by index along diagonal 0, 8, 16, 24, etc.
  // @ts-ignore
  pieces = pieces.filter((_, index) => {
    return index % increment === 0;
  });

  /**
   * Union all the pieces
   */

  const piecesUnion = union(pieces);

  /**
   * Add the base
   */

  const piecesBoundingBox = measureBoundingBox(piecesUnion);

  const adjacent = piecesBoundingBox[1][0] - piecesBoundingBox[0][0];
  const opposite = piecesBoundingBox[1][2] - piecesBoundingBox[0][2];

  const hypotenuse = Math.sqrt(adjacent ** 2 + opposite ** 2);

  let yTranslate = -Infinity;

  // @ts-ignore
  pieces.forEach((piece) => {
    const boundingBox = measureBoundingBox(piece);

    yTranslate = Math.max(
      yTranslate,
      Math.min(boundingBox[0][1], boundingBox[1][1])
    );
  });

  let base2D = roundedRectangle({
    size: [hypotenuse + padding * 2, 6],
    roundRadius: (fillet / 100) * 2.99,
  });

  let base = extrudeLinear({ height: 0.5 }, base2D);
  base = rotate([Math.PI / 2, 0, 0], base);
  base = translate([0, yTranslate, 0], base);

  /**
   * Align the pieces with the base
   */
  // @ts-ignore
  pieces = pieces.map((piece) => {
    const rotatedPiece = rotate([0, -Math.PI / 4, 0], piece);

    let center = measureCenter(rotatedPiece);

    console.log({ center });

    return translate([0, 0, -center[2]], rotatedPiece);
  });

  /**
   * Return the finished model
   */

  return union([pieces, base]);
};
