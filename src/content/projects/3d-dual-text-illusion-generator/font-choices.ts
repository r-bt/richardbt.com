// Kept apart from fonts.ts so the page can show the list without loading
// opentype.js, which only the worker needs.
import fontList from "./font-list.json";

export type FontCategory = "sans-serif" | "serif" | "display" | "monospace";

export type FontChoice = {
  family: string;
  category: FontCategory;
  /** Default weight (bold where the font has it). */
  weight: number;
  /** Weight → TTF URL, for each weight that passed the same build test. */
  files: Record<string, string>;
};

/**
 * 100 Google Fonts that make good nameplates: the most popular families that
 * passed a build test of every capital (sturdy strokes, no loose pieces), with
 * near-duplicates and fonts designed for non-Latin scripts left out.
 */
export const FONTS = fontList as FontChoice[];

export const DEFAULT_FONT = "Poppins";
