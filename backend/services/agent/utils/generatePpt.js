import pptxgen from "pptxgenjs";

// -----------------------------------------------------
// Design tokens — "Ink & Brass" editorial identity
// A deliberate departure from the generic blue-SaaS
// template: near-black ink, a single warm brass accent,
// and an asymmetric, left-rule editorial layout instead
// of centered hero + decorative blob circles.
// -----------------------------------------------------

const COLORS = {
  ink: "12151C", // primary dark background (cover / closing)
  inkPanel: "1B2030", // subtle secondary panel tone
  inkLine: "313852", // hairline rule on dark backgrounds
  brass: "C9A24B", // signature accent
  brassLight: "E3C878", // accent highlight / ghost numerals
  cream: "F8F6F1", // primary light background (content slides)
  paper: "F1EEE6", // secondary light tone
  paperLine: "E1DCCF", // hairline rule on light backgrounds
  ink900: "1E212A", // near-black text on light backgrounds
  text: "3A3E47", // body text
  muted: "7A7E88", // secondary text on light backgrounds
  mutedOnDark: "9CA3C2", // secondary text on dark backgrounds
  white: "FFFFFF",
};

const FONT_DISPLAY = "Georgia"; // characterful serif, used with restraint
const FONT_BODY = "Calibri"; // quiet, legible workhorse

// -----------------------------------------------------
// Main PPT Generator
// -----------------------------------------------------

export const generatePpt = async (data = {}) => {
  const ppt = new pptxgen();

  ppt.layout = "LAYOUT_WIDE";
  ppt.author = "NexusAI";
  ppt.title = data.title || "NexusAI Presentation";
  ppt.subject = data.title || "NexusAI Presentation";
  ppt.company = "NexusAI";
  ppt.lang = "en-US";

  ppt.theme = {
    headFontFace: FONT_DISPLAY,
    bodyFontFace: FONT_BODY,
    lang: "en-US",
  };

  addCover(ppt, data);

  const slides = Array.isArray(data?.slides) ? data.slides : [];

  slides.forEach((slideData, index) => {
    addContentSlide(
      ppt,
      slideData?.title || `Slide ${index + 1}`,
      slideData?.points || [],
      index + 1,
      slides.length
    );
  });

  addThankYou(ppt, data);

  return ppt;
};

// -----------------------------------------------------
// Shared helper: signature monogram mark
// -----------------------------------------------------

const addMonogram = (slide, { x, y, dark }) => {
  slide.addShape("ellipse", {
    x,
    y,
    w: 0.42,
    h: 0.42,
    fill: { color: dark ? "00000000" : "00000000", transparency: 100 },
    line: { color: COLORS.brass, width: 1 },
  });
  slide.addText("N", {
    x,
    y: y - 0.015,
    w: 0.42,
    h: 0.42,
    align: "center",
    valign: "mid",
    color: COLORS.brass,
    bold: true,
    fontSize: 13,
    fontFace: FONT_DISPLAY,
    margin: 0,
  });
};

// -----------------------------------------------------
// Cover Slide — asymmetric editorial layout
// -----------------------------------------------------

const addCover = (ppt, data = {}) => {
  const slide = ppt.addSlide();

  slide.background = { color: COLORS.ink };

  // Faint tonal panel on the right third for depth (no blur blobs)
  slide.addShape("rect", {
    x: 9.2,
    y: 0,
    w: 4.13,
    h: 7.5,
    fill: { color: COLORS.inkPanel },
    line: { color: COLORS.inkPanel },
  });

  // Ghost numeral / texture, subtle, top-right
  slide.addText("01", {
    x: 9.4,
    y: 0.35,
    w: 3.6,
    h: 2,
    align: "right",
    color: COLORS.inkLine,
    bold: true,
    fontSize: 130,
    fontFace: FONT_DISPLAY,
    margin: 0,
  });

  // Vertical brass rule — the signature element
  slide.addShape("line", {
    x: 1.1,
    y: 1.55,
    w: 0,
    h: 3.9,
    line: { color: COLORS.brass, width: 2 },
  });

  // Eyebrow / kicker
  slide.addText("PRESENTATION", {
    x: 1.5,
    y: 1.55,
    w: 8,
    h: 0.35,
    color: COLORS.brass,
    bold: true,
    fontSize: 12,
    fontFace: FONT_BODY,
    charSpacing: 3,
    margin: 0,
  });

  // Title
  slide.addText(data?.title || "NexusAI Presentation", {
    x: 1.5,
    y: 2.05,
    w: 8.6,
    h: 1.9,
    color: COLORS.white,
    bold: true,
    fontSize: 40,
    fontFace: FONT_DISPLAY,
    margin: 0,
    fit: "shrink",
    valign: "top",
    lineSpacing: 44,
  });

  // Subtitle
  if (data?.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.5,
      y: 4.0,
      w: 7.6,
      h: 0.5,
      color: COLORS.brassLight,
      fontSize: 16,
      fontFace: FONT_BODY,
      italic: true,
      margin: 0,
      fit: "shrink",
    });
  }

  // Description
  if (data?.description) {
    slide.addText(data.description, {
      x: 1.5,
      y: 4.55,
      w: 7.4,
      h: 0.9,
      color: COLORS.mutedOnDark,
      fontSize: 12.5,
      fontFace: FONT_BODY,
      margin: 0,
      fit: "shrink",
      lineSpacing: 18,
    });
  }

  // Footer hairline
  slide.addShape("line", {
    x: 1.1,
    y: 6.55,
    w: 11.13,
    h: 0,
    line: { color: COLORS.inkLine, width: 1 },
  });

  slide.addText("NEXUSAI", {
    x: 1.1,
    y: 6.68,
    w: 4,
    h: 0.3,
    color: COLORS.mutedOnDark,
    bold: true,
    fontSize: 9,
    fontFace: FONT_BODY,
    charSpacing: 2,
    margin: 0,
  });

  if (data?.date) {
    slide.addText(data.date, {
      x: 8.23,
      y: 6.68,
      w: 4,
      h: 0.3,
      align: "right",
      color: COLORS.mutedOnDark,
      fontSize: 9,
      fontFace: FONT_BODY,
      margin: 0,
    });
  }
};

// -----------------------------------------------------
// Content Slide
// -----------------------------------------------------

const addContentSlide = (ppt, title, points, slideNumber, totalSlides) => {
  const slide = ppt.addSlide();

  slide.background = { color: COLORS.cream };

  // Top hairline with a short brass accent segment
  slide.addShape("line", {
    x: 0,
    y: 0.06,
    w: 13.33,
    h: 0,
    line: { color: COLORS.paperLine, width: 1 },
  });
  slide.addShape("line", {
    x: 0,
    y: 0.06,
    w: 1.3,
    h: 0,
    line: { color: COLORS.brass, width: 3 },
  });

  // Ghost numeral watermark, top-right — legitimate here since it
  // marks this slide's true position in the deck sequence
  slide.addText(String(slideNumber).padStart(2, "0"), {
    x: 10.9,
    y: 0.15,
    w: 2.1,
    h: 1.3,
    align: "right",
    color: COLORS.paperLine,
    bold: true,
    fontSize: 72,
    fontFace: FONT_DISPLAY,
    margin: 0,
  });

  // Eyebrow
  slide.addText(`SECTION ${String(slideNumber).padStart(2, "0")}`, {
    x: 0.75,
    y: 0.55,
    w: 6,
    h: 0.3,
    color: COLORS.brass,
    bold: true,
    fontSize: 10.5,
    fontFace: FONT_BODY,
    charSpacing: 2.5,
    margin: 0,
  });

  // Slide title
  slide.addText(title || `Slide ${slideNumber}`, {
    x: 0.75,
    y: 0.86,
    w: 9.6,
    h: 0.75,
    color: COLORS.ink900,
    bold: true,
    fontSize: 26,
    fontFace: FONT_DISPLAY,
    margin: 0,
    fit: "shrink",
    valign: "mid",
  });

  // Short brass underline accent beneath the title (not full width)
  slide.addShape("line", {
    x: 0.75,
    y: 1.62,
    w: 0.9,
    h: 0,
    line: { color: COLORS.brass, width: 2.5 },
  });

  // ---------------------------------------------------
  // Normalize Points
  // ---------------------------------------------------

  let normalizedPoints = [];

  if (Array.isArray(points)) {
    normalizedPoints = points
      .map((point) => {
        if (typeof point === "string") return point.trim();
        if (typeof point === "object" && point !== null) {
          return (
            point.text ||
            point.content ||
            point.description ||
            point.title ||
            ""
          );
        }
        return String(point);
      })
      .map((point) => String(point).trim())
      .filter(Boolean);
  } else if (typeof points === "string") {
    normalizedPoints = points
      .split("\n")
      .map((point) => point.trim())
      .filter(Boolean);
  }

  // ---------------------------------------------------
  // Body
  // ---------------------------------------------------

  if (normalizedPoints.length === 0) {
    slide.addText("No content available.", {
      x: 0.9,
      y: 2.4,
      w: 11,
      h: 0.5,
      color: COLORS.muted,
      fontSize: 15,
      italic: true,
      fontFace: FONT_BODY,
      margin: 0,
    });
  } else {
    const startY = 2.1;
    const availableHeight = 4.35;
    const itemHeight = Math.min(
      0.82,
      Math.max(0.55, availableHeight / normalizedPoints.length)
    );

    normalizedPoints.forEach((point, index) => {
      const y = startY + index * itemHeight;

      // Marker: small brass square, quieter than a filled dot
      slide.addShape("rect", {
        x: 0.85,
        y: y + 0.185,
        w: 0.1,
        h: 0.1,
        fill: { color: COLORS.brass },
        line: { color: COLORS.brass },
      });

      // Point text
      slide.addText(point, {
        x: 1.15,
        y,
        w: 11.15,
        h: itemHeight - 0.05,
        color: COLORS.text,
        fontSize: 15,
        fontFace: FONT_BODY,
        margin: 0,
        valign: "mid",
        fit: "shrink",
        lineSpacing: 20,
      });

      // Faint row divider between items (skip after last)
      if (index < normalizedPoints.length - 1) {
        slide.addShape("line", {
          x: 0.85,
          y: y + itemHeight - 0.03,
          w: 11.45,
          h: 0,
          line: { color: COLORS.paperLine, width: 0.75 },
        });
      }
    });
  }

  // ---------------------------------------------------
  // Footer
  // ---------------------------------------------------

  slide.addShape("line", {
    x: 0.75,
    y: 6.88,
    w: 11.83,
    h: 0,
    line: { color: COLORS.paperLine, width: 1 },
  });

  slide.addText("NEXUSAI", {
    x: 0.75,
    y: 6.98,
    w: 2,
    h: 0.25,
    color: COLORS.muted,
    fontSize: 8,
    bold: true,
    fontFace: FONT_BODY,
    charSpacing: 1.5,
    margin: 0,
  });

  slide.addText(
    [
      { text: `${String(slideNumber).padStart(2, "0")}`, options: { color: COLORS.brass, bold: true } },
      { text: ` / ${String(totalSlides).padStart(2, "0")}`, options: { color: COLORS.muted } },
    ],
    {
      x: 11.08,
      y: 6.98,
      w: 1.5,
      h: 0.25,
      align: "right",
      fontSize: 8,
      fontFace: FONT_BODY,
      margin: 0,
    }
  );
};

// -----------------------------------------------------
// Closing Slide — mirrors the cover for a bookended feel
// -----------------------------------------------------

const addThankYou = (ppt, data = {}) => {
  const slide = ppt.addSlide();

  slide.background = { color: COLORS.ink };

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 4.13,
    h: 7.5,
    fill: { color: COLORS.inkPanel },
    line: { color: COLORS.inkPanel },
  });

  slide.addText("02", {
    x: 0.2,
    y: 5.1,
    w: 3.6,
    h: 2,
    align: "left",
    color: COLORS.inkLine,
    bold: true,
    fontSize: 130,
    fontFace: FONT_DISPLAY,
    margin: 0,
  });

  slide.addShape("line", {
    x: 5.4,
    y: 2.85,
    w: 0,
    h: 1.8,
    line: { color: COLORS.brass, width: 2 },
  });

  slide.addText("Thank You", {
    x: 5.8,
    y: 3.0,
    w: 6.8,
    h: 0.9,
    color: COLORS.white,
    bold: true,
    fontSize: 38,
    fontFace: FONT_DISPLAY,
    margin: 0,
  });

  slide.addText(data?.closingNote || "Questions & discussion welcome", {
    x: 5.8,
    y: 3.72,
    w: 6.8,
    h: 0.45,
    color: COLORS.brassLight,
    fontSize: 14,
    italic: true,
    fontFace: FONT_BODY,
    margin: 0,
  });

  slide.addShape("line", {
    x: 5.8,
    y: 6.55,
    w: 6.4,
    h: 0,
    line: { color: COLORS.inkLine, width: 1 },
  });

  addMonogram(slide, { x: 5.8, y: 6.72, dark: true });

  slide.addText("POWERED BY NEXUSAI", {
    x: 6.32,
    y: 6.73,
    w: 4,
    h: 0.35,
    valign: "mid",
    color: COLORS.mutedOnDark,
    bold: true,
    fontSize: 9,
    fontFace: FONT_BODY,
    charSpacing: 2,
    margin: 0,
  });
};

// -----------------------------------------------------
// Export
// -----------------------------------------------------

export default generatePpt;