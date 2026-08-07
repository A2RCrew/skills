// A2R product-video — brand tokens + fonts (shared by every scene).
// Requires: npm i @remotion/google-fonts
import { loadFont as loadTitle } from "@remotion/google-fonts/FacultyGlyphic";
import { loadFont as loadBody } from "@remotion/google-fonts/PlusJakartaSans";

export const titleFont = loadTitle().fontFamily; // headlines / scene titles
export const bodyFont = loadBody().fontFamily;   // body, overlines, captions

// A2R palette (subset). 60-30-10: silver base, core-blue brand, solid-black text.
export const C = {
  coreBlue: "#2764F4",
  silver: "#FBFCFD",
  silver200: "#F1F1F1",
  silver300: "#E6E6E9",
  silver400: "#D0D0D4",
  silver700: "#6F6F75",
  silver800: "#35363B",
  black: "#111218",
  white: "#FFFFFF",
  green: "#A1E8C9",
};
