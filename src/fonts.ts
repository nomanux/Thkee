export const fontHeading = "font-['Instrument_Sans:Bold'] font-bold";
export const fontBold = "font-['Inter:Bold'] font-bold";
export const fontSemi = "font-['Inter:Semi_Bold'] font-semibold";
export const fontMedium = "font-['Inter:Medium'] font-medium";
export const fontRegular = "font-['Inter:Regular'] font-normal";
export const fontArabic = "font-['IBM_Plex_Sans_Arabic',sans-serif]";

const arabicPattern = /[؀-ۿ]/;
// Latin font files have no Arabic glyphs, so Arabic text switches to the Arabic font.
export const fontFor = (text: string, latinFont: string, arabicWeight = "font-semibold") =>
  arabicPattern.test(text) ? `${fontArabic} ${arabicWeight}` : latinFont;
