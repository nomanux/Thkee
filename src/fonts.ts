export const fontHeading = "font-instrument-bold font-bold";
export const fontBold = "font-inter-bold font-bold";
export const fontSemi = "font-inter-semibold font-semibold";
export const fontMedium = "font-inter-medium font-medium";
export const fontRegular = "font-inter-regular font-normal";
export const fontArabic = "font-arabic";

const arabicPattern = /[؀-ۿ]/;
// Latin font files have no Arabic glyphs, so Arabic text switches to the Arabic font.
export const fontFor = (text: string, latinFont: string, arabicWeight = "font-semibold") =>
  arabicPattern.test(text) ? `${fontArabic} ${arabicWeight}` : latinFont;
